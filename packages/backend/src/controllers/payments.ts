import { Response } from 'express';
import Stripe from 'stripe';
import Payment from '../models/Payment';
import { AuthRequest } from '../types';

const zeroDecimalCurrencies = new Set([
  'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'
]);

const getStripeClient = (): Stripe => {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('Stripe secret key is not configured');
  }

  return new Stripe(secretKey, {
    apiVersion: '2023-10-16'
  });
};

const normalizeAmount = (amount: number, currency: string): number => {
  if (zeroDecimalCurrencies.has(currency.toLowerCase())) {
    return Math.round(amount);
  }

  return Math.round(amount * 100);
};

// @desc    Create a payment intent for the authenticated user
// @route   POST /api/payments/create-intent
// @access  Private
export const createPaymentIntent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const { amount, currency = 'usd', description, metadata } = req.body as {
      amount?: number;
      currency?: string;
      description?: string;
      metadata?: Record<string, any>;
    };

    if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
      res.status(400).json({
        success: false,
        error: 'A valid amount greater than zero is required'
      });
      return;
    }

    const stripe = getStripeClient();
    const normalizedAmount = normalizeAmount(amount, currency);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: normalizedAmount,
      currency,
      description,
      automatic_payment_methods: {
        enabled: true
      },
      metadata: {
        userId: req.user.id,
        ...metadata
      }
    });

    await Payment.createPayment(
      req.user.id,
      paymentIntent.id,
      normalizedAmount,
      currency,
      description,
      metadata
    );

    res.status(201).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error: any) {
    const message = error.type === 'StripeAuthenticationError'
      ? 'Payment processor authentication failed'
      : error.message || 'Unable to create payment intent';

    const statusCode = error.message === 'Stripe secret key is not configured' ? 503 : 400;

    res.status(statusCode).json({
      success: false,
      error: message
    });
  }
};

// @desc    Get payment history for the authenticated user
// @route   GET /api/payments/history
// @access  Private
export const getPaymentHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const { page = 1, limit = 20 } = req.query;
    const parsedPage = Math.max(Number(page) || 1, 1);
    const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (parsedPage - 1) * parsedLimit;

    const [payments, total] = await Promise.all([
      Payment.getUserPayments(req.user.id, parsedLimit, skip),
      Payment.countDocuments({ userId: req.user.id })
    ]);

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          pages: Math.ceil(total / parsedLimit) || 1
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get a payment by Mongo ID
// @route   GET /api/payments/:paymentId
// @access  Private
export const getPaymentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const { paymentId } = req.params;

    const payment = await Payment.findOne({
      _id: paymentId,
      userId: req.user.id
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const handleWebhook = async (req: any, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    event = getStripeClient().webhooks.constructEvent(req.body, sig!, endpointSecret!);
  } catch (err: any) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent was successful!', paymentIntent.id);

      // Update payment status in database
      try {
        await Payment.findOneAndUpdate(
          { stripePaymentIntentId: paymentIntent.id },
          {
            status: 'succeeded',
            stripePaymentIntent: paymentIntent,
            updatedAt: new Date()
          }
        );
      } catch (error) {
        console.error('Error updating payment status:', error);
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent failed!', failedPaymentIntent.id);

      // Update payment status in database
      try {
        await Payment.findOneAndUpdate(
          { stripePaymentIntentId: failedPaymentIntent.id },
          {
            status: 'failed',
            stripePaymentIntent: failedPaymentIntent,
            updatedAt: new Date()
          }
        );
      } catch (error) {
        console.error('Error updating payment status:', error);
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

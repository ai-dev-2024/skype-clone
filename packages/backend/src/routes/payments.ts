import express from 'express';
import {
  createPaymentIntent,
  getPaymentHistory,
  getPaymentById,
  handleWebhook
} from '../controllers/payments';
import { protect } from '../middleware/auth';

const router = express.Router();

// Protected routes
router.use(protect);

router.post('/create-intent', createPaymentIntent);
router.get('/history', getPaymentHistory);
router.get('/:paymentId', getPaymentById);

// Webhook doesn't require authentication but should validate signature
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;

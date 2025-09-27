import React, { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { paymentsAPI } from '../services/api'
import toast from 'react-hot-toast'

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_default')

interface PaymentFormProps {
  amount: number
  description?: string
  onSuccess: (paymentIntent: any) => void
  onCancel: () => void
}

const CheckoutForm: React.FC<PaymentFormProps> = ({
  amount,
  description,
  onSuccess,
  onCancel
}) => {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)

    try {
      // Create payment intent
      const response = await paymentsAPI.createPaymentIntent({
        amount: amount * 100, // Convert to cents
        currency: 'usd',
        description
      })

      const { clientSecret } = response.data

      // Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      })

      if (result.error) {
        toast.error(result.error.message || 'Payment failed')
      } else if (result.paymentIntent?.status === 'succeeded') {
        toast.success('Payment successful!')
        onSuccess(result.paymentIntent)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-300 rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>

      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : `Pay $${(amount / 100).toFixed(2)}`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

interface PaymentFormWrapperProps {
  amount: number
  description?: string
  onSuccess: (paymentIntent: any) => void
  onCancel: () => void
}

const PaymentForm: React.FC<PaymentFormWrapperProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  )
}

export default PaymentForm

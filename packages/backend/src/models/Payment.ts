import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IPaymentDocument extends Document {
  userId: Types.ObjectId;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  description?: string;
  metadata?: Record<string, any>;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IPaymentModel extends Model<IPaymentDocument> {
  getUserPayments(userId: string, limit?: number, skip?: number): Promise<IPaymentDocument[]>;
  getByPaymentIntentId(stripePaymentIntentId: string): Promise<IPaymentDocument | null>;
  updatePaymentStatus(
    stripePaymentIntentId: string,
    status: string,
    additionalFields?: Record<string, unknown>
  ): Promise<IPaymentDocument | null>;
  createPayment(
    userId: string,
    stripePaymentIntentId: string,
    amount: number,
    currency?: string,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<IPaymentDocument>;
}

const paymentSchema = new Schema<IPaymentDocument, IPaymentModel>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stripePaymentIntentId: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0.5, 'Amount must be at least $0.50']
  },
  currency: {
    type: String,
    default: 'usd',
    enum: ['usd', 'eur', 'gbp', 'cad', 'aud']
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'canceled'],
    default: 'pending'
  },
  description: {
    type: String,
    maxlength: [500, 'Description must be less than 500 characters']
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  receiptUrl: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ stripePaymentIntentId: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return `$${(this.amount / 100).toFixed(2)}`;
});

// Static method to get user payments
paymentSchema.statics.getUserPayments = async function(
  this: IPaymentModel,
  userId: string,
  limit: number = 20,
  skip: number = 0
) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .exec();
};

// Static method to get payment by intent ID
paymentSchema.statics.getByPaymentIntentId = async function(this: IPaymentModel, stripePaymentIntentId: string) {
  return this.findOne({ stripePaymentIntentId }).exec();
};

// Static method to update payment status
paymentSchema.statics.updatePaymentStatus = async function(
  this: IPaymentModel,
  stripePaymentIntentId: string,
  status: string,
  additionalFields: any = {}
) {
  const updateData: any = { status };
  Object.assign(updateData, additionalFields);

  return this.findOneAndUpdate(
    { stripePaymentIntentId },
    updateData,
    { new: true }
  ).exec();
};

// Static method to create payment record
paymentSchema.statics.createPayment = async function(
  this: IPaymentModel,
  userId: string,
  stripePaymentIntentId: string,
  amount: number,
  currency: string = 'usd',
  description?: string,
  metadata?: Record<string, any>
) {
  return this.create({
    userId,
    stripePaymentIntentId,
    amount,
    currency,
    description,
    metadata: metadata || {}
  });
};

export default mongoose.model<IPaymentDocument, IPaymentModel>('Payment', paymentSchema);

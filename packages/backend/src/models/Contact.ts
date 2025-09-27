import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { Contact as IContact } from '@skype-clone/shared';

export interface IContactDocument extends Omit<IContact, 'id' | 'userId' | 'contactId'>, Document {
  userId: Types.ObjectId;
  contactId: Types.ObjectId;
}

interface IContactModel extends Model<IContactDocument> {
  getUserContacts(userId: string): Promise<IContactDocument[]>;
  getPendingRequests(userId: string): Promise<IContactDocument[]>;
  sendRequest(userId: string, contactId: string): Promise<IContactDocument>;
  acceptRequest(userId: string, contactId: string): Promise<IContactDocument>;
  blockContact(userId: string, contactId: string): Promise<IContactDocument>;
  unblockContact(userId: string, contactId: string): Promise<boolean>;
}

const contactSchema = new Schema<IContactDocument, IContactModel>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contactId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'blocked'],
    default: 'pending'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
contactSchema.index({ userId: 1, contactId: 1 }, { unique: true });
contactSchema.index({ userId: 1, status: 1 });
contactSchema.index({ contactId: 1, status: 1 });

// Virtual for reverse contact
contactSchema.virtual('reverseContact', {
  ref: 'Contact',
  localField: 'contactId',
  foreignField: 'userId'
});

// Static method to get user contacts
contactSchema.statics.getUserContacts = async function(this: IContactModel, userId: string) {
  return this.find({
    userId,
    status: 'accepted'
  })
  .populate('contactId', 'username firstName lastName avatar isOnline lastSeen')
  .sort({ updatedAt: -1 })
  .exec();
};

// Static method to get pending requests
contactSchema.statics.getPendingRequests = async function(this: IContactModel, userId: string) {
  return this.find({
    contactId: userId,
    status: 'pending'
  })
  .populate('userId', 'username firstName lastName avatar')
  .sort({ createdAt: -1 })
  .exec();
};

// Static method to send contact request
contactSchema.statics.sendRequest = async function(this: IContactModel, userId: string, contactId: string) {
  // Check if request already exists
  const existing = await this.findOne({
    userId,
    contactId
  });

  if (existing) {
    if (existing.status === 'pending') {
      throw new Error('Contact request already sent');
    }
    if (existing.status === 'accepted') {
      throw new Error('Users are already contacts');
    }
    if (existing.status === 'blocked') {
      throw new Error('Contact is blocked');
    }
  }

  // Check reverse request
  const reverse = await this.findOne({
    userId: contactId,
    contactId: userId
  });

  if (reverse && reverse.status === 'pending') {
    // Accept both requests
    await this.findByIdAndUpdate(reverse._id, { status: 'accepted' });
    const created = await this.create({ userId, contactId, status: 'accepted' });
    return created.populate('contactId', 'username firstName lastName avatar isOnline lastSeen');
  }

  const request = await this.create({ userId, contactId, status: 'pending' });
  return request.populate('contactId', 'username firstName lastName avatar isOnline lastSeen');
};

// Static method to accept contact request
contactSchema.statics.acceptRequest = async function(this: IContactModel, userId: string, contactId: string) {
  const contact = await this.findOne({
    userId: contactId,
    contactId: userId,
    status: 'pending'
  });

  if (!contact) {
    throw new Error('No pending request found');
  }

  contact.status = 'accepted';
  await contact.save();

  // Ensure reciprocal record exists
  let reciprocalRecord = await this.findOne({ userId, contactId });
  if (!reciprocalRecord) {
    reciprocalRecord = await this.create({ userId, contactId, status: 'accepted' });
  } else if (reciprocalRecord.status !== 'accepted') {
    reciprocalRecord.status = 'accepted';
    await reciprocalRecord.save();
  }

  const reciprocal = await this.findOne({ userId, contactId })
    .populate('contactId', 'username firstName lastName avatar isOnline lastSeen')
    .exec();

  if (!reciprocal) {
    throw new Error('Failed to update contact status');
  }

  return reciprocal;
};

// Static method to block contact
contactSchema.statics.blockContact = async function(this: IContactModel, userId: string, contactId: string) {
  const contact = await this.findOne({
    userId,
    contactId
  });

  if (contact) {
    contact.status = 'blocked';
    return contact.save();
  }

  return this.create({
    userId,
    contactId,
    status: 'blocked'
  });
};

// Static method to unblock contact
contactSchema.statics.unblockContact = async function(this: IContactModel, userId: string, contactId: string) {
  const contact = await this.findOne({
    userId,
    contactId,
    status: 'blocked'
  });

  if (contact) {
    await contact.deleteOne();
  }

  return true;
};

export default mongoose.model<IContactDocument, IContactModel>('Contact', contactSchema);

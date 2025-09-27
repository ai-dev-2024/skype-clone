import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { Message as IMessage } from '@skype-clone/shared';

export interface IMessageDocument extends Omit<IMessage, 'id' | 'senderId' | 'receiverId' | 'groupId'>, Document {
  senderId: Types.ObjectId;
  receiverId?: Types.ObjectId;
  groupId?: Types.ObjectId;
}

interface IMessageModel extends Model<IMessageDocument> {
  markAsRead(messageIds: string[], userId: string): Promise<void>;
  getConversation(userId1: string, userId2: string, limit?: number, skip?: number): Promise<IMessageDocument[]>;
  getGroupMessages(groupId: string, limit?: number, skip?: number): Promise<IMessageDocument[]>;
}

const messageSchema = new Schema<IMessageDocument, IMessageModel>({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group'
  },
  content: {
    type: String,
    required: function() {
      return this.type === 'text';
    }
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'audio', 'video'],
    default: 'text'
  },
  fileUrl: {
    type: String,
    required: function() {
      return ['image', 'file', 'audio', 'video'].includes(this.type);
    }
  },
  fileName: {
    type: String
  },
  fileSize: {
    type: Number
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  isEncrypted: {
    type: Boolean,
    default: false
  },
  encryptedData: {
    type: {
      id: String,
      chatId: String,
      senderId: String,
      encryptedContent: String,
      iv: String,
      signature: String,
      timestamp: Date,
      encryptedKeys: Schema.Types.Mixed
    },
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, createdAt: -1 });
messageSchema.index({ groupId: 1, createdAt: -1 });
messageSchema.index({ isRead: 1, createdAt: -1 });

// Virtual for conversation partner
messageSchema.virtual('conversationPartner').get(function() {
  if (this.groupId) return null;
  return this.receiverId;
});

// Static method to mark messages as read
messageSchema.statics.markAsRead = async function(this: IMessageModel, messageIds: string[], userId: string) {
  await this.updateMany(
    {
      _id: { $in: messageIds },
      receiverId: userId,
      isRead: false
    },
    {
      isRead: true,
      readAt: new Date()
    }
  );
};

// Static method to get conversation messages
messageSchema.statics.getConversation = async function(
  this: IMessageModel,
  userId1: string,
  userId2: string,
  limit: number = 50,
  skip: number = 0
) {
  return this.find({
    $or: [
      { senderId: userId1, receiverId: userId2 },
      { senderId: userId2, receiverId: userId1 }
    ]
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip)
  .populate('senderId', 'username firstName lastName avatar')
  .exec();
};

// Static method to get group messages
messageSchema.statics.getGroupMessages = async function(
  this: IMessageModel,
  groupId: string,
  limit: number = 50,
  skip: number = 0
) {
  return this.find({ groupId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('senderId', 'username firstName lastName avatar')
    .exec();
};

export default mongoose.model<IMessageDocument, IMessageModel>('Message', messageSchema);

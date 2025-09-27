import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { Call as ICall } from '@skype-clone/shared';

export interface ICallDocument extends Omit<ICall, 'id' | 'callerId' | 'receiverId' | 'groupId'>, Document {
  callerId: Types.ObjectId;
  receiverId?: Types.ObjectId;
  groupId?: Types.ObjectId;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

interface ICallModel extends Model<ICallDocument> {
  getCallHistory(userId: string, limit?: number, skip?: number): Promise<ICallDocument[]>;
  updateCallStatus(callId: string, status: string, additionalFields?: Record<string, unknown>): Promise<ICallDocument | null>;
  getActiveCalls(userId: string): Promise<ICallDocument[]>;
}

const callSchema = new Schema<ICallDocument, ICallModel>({
  callerId: {
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
  type: {
    type: String,
    enum: ['audio', 'video'],
    required: true
  },
  status: {
    type: String,
    enum: ['initiated', 'ringing', 'answered', 'ended', 'missed', 'declined'],
    default: 'initiated'
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // Duration in seconds
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
callSchema.index({ callerId: 1, createdAt: -1 });
callSchema.index({ receiverId: 1, createdAt: -1 });
callSchema.index({ groupId: 1, createdAt: -1 });
callSchema.index({ status: 1, createdAt: -1 });

// Virtual for call duration calculation
callSchema.virtual('calculatedDuration').get(function() {
  if (this.startTime && this.endTime) {
    return Math.floor((this.endTime.getTime() - this.startTime.getTime()) / 1000);
  }
  return this.duration;
});

// Pre-save middleware to calculate duration
callSchema.pre('save', function(next) {
  if (this.startTime && this.endTime && !this.duration) {
    this.duration = Math.floor((this.endTime.getTime() - this.startTime.getTime()) / 1000);
  }
  next();
});

// Static method to get call history
callSchema.statics.getCallHistory = async function(
  this: ICallModel,
  userId: string,
  limit: number = 50,
  skip: number = 0
) {
  const groupIds = await mongoose.model('Group').find({ members: userId }).distinct('_id');

  return this.find({
    $or: [
      { callerId: userId },
      { receiverId: userId },
      { groupId: { $in: groupIds } }
    ]
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip)
  .populate('callerId', 'username firstName lastName avatar')
  .populate('receiverId', 'username firstName lastName avatar')
  .populate('groupId', 'name avatar')
  .exec();
};

// Static method to update call status
callSchema.statics.updateCallStatus = async function(
  this: ICallModel,
  callId: string,
  status: string,
  additionalFields: any = {}
) {
  const updateData: any = { status };

  if (status === 'answered' && !additionalFields.startTime) {
    updateData.startTime = new Date();
  }

  if (status === 'ended' && !additionalFields.endTime) {
    updateData.endTime = new Date();
  }

  Object.assign(updateData, additionalFields);

  return this.findByIdAndUpdate(callId, updateData, { new: true }).exec();
};

// Static method to get active calls for user
callSchema.statics.getActiveCalls = async function(this: ICallModel, userId: string) {
  const groupIds = await mongoose.model('Group').find({ members: userId }).distinct('_id');

  return this.find({
    $or: [
      { callerId: userId },
      { receiverId: userId },
      { groupId: { $in: groupIds } }
    ],
    status: { $in: ['initiated', 'ringing', 'answered'] }
  })
  .populate('callerId', 'username firstName lastName avatar')
  .populate('receiverId', 'username firstName lastName avatar')
  .populate('groupId', 'name avatar')
  .exec();
};

export default mongoose.model<ICallDocument, ICallModel>('Call', callSchema);

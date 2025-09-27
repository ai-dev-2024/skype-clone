import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { Group as IGroup } from '@skype-clone/shared';

export interface IGroupDocument extends Omit<IGroup, 'id' | 'createdBy' | 'members' | 'admins'>, Document {
  createdBy: Types.ObjectId;
  members: Types.ObjectId[];
  admins: Types.ObjectId[];
  addMember(userId: string): Promise<void>;
  removeMember(userId: string): Promise<void>;
  isMember(userId: string): boolean;
  isAdmin(userId: string): boolean;
}

interface IGroupModel extends Model<IGroupDocument> {
  getUserGroups(userId: string): Promise<IGroupDocument[]>;
  createGroup(
    name: string,
    description: string,
    createdBy: string,
    members: string[],
    isPrivate?: boolean
  ): Promise<IGroupDocument>;
}

const groupSchema = new Schema<IGroupDocument, IGroupModel>({
  name: {
    type: String,
    required: [true, 'Please provide a group name'],
    maxlength: [50, 'Group name must be less than 50 characters']
  },
  description: {
    type: String,
    maxlength: [200, 'Description must be less than 200 characters']
  },
  avatar: {
    type: String,
    default: ''
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  admins: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  isPrivate: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
groupSchema.index({ name: 1 });
groupSchema.index({ members: 1 });
groupSchema.index({ createdBy: 1 });

// Virtual for member count
groupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Add member to group
groupSchema.methods.addMember = async function(userId: string): Promise<void> {
  const alreadyMember = this.members.some((id: any) => id.toString() === userId.toString());
  if (!alreadyMember) {
    this.members.push(userId);
    await this.save();
  }
};

// Remove member from group
groupSchema.methods.removeMember = async function(userId: string): Promise<void> {
  this.members = this.members.filter((id: any) => id.toString() !== userId.toString());
  this.admins = this.admins.filter((id: any) => id.toString() !== userId.toString());

  // If creator leaves, assign admin to first remaining member
  if (this.createdBy.toString() === userId.toString() && this.members.length > 0) {
    this.admins.unshift(this.members[0]);
  }

  await this.save();
};

// Check if user is member
groupSchema.methods.isMember = function(userId: string): boolean {
  return this.members.some((id: any) => id.toString() === userId.toString());
};

// Check if user is admin
groupSchema.methods.isAdmin = function(userId: string): boolean {
  return this.admins.some((id: any) => id.toString() === userId.toString());
};

// Static method to get user's groups
groupSchema.statics.getUserGroups = async function(this: IGroupModel, userId: string) {
  return this.find({ members: userId })
    .sort({ updatedAt: -1 })
    .populate('createdBy', 'username firstName lastName avatar')
    .populate('members', 'username firstName lastName avatar')
    .exec();
};

// Static method to create group
groupSchema.statics.createGroup = async function(
  this: IGroupModel,
  name: string,
  description: string,
  createdBy: string,
  members: string[],
  isPrivate: boolean = false
) {
  const uniqueMemberIds = Array.from(new Set([createdBy, ...members].map((member) => member.toString())));

  const group = new this({
    name,
    description,
    createdBy,
    members: uniqueMemberIds,
    admins: [createdBy],
    isPrivate
  });

  return group.save();
};

export default mongoose.model<IGroupDocument, IGroupModel>('Group', groupSchema);

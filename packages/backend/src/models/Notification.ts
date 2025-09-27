import mongoose, { Document, Schema } from 'mongoose';

export interface INotificationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'message' | 'call' | 'group_invite' | 'contact_request' | 'payment';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotificationDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['message', 'call', 'group_invite', 'contact_request', 'payment'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: [100, 'Title must be less than 100 characters']
  },
  message: {
    type: String,
    required: true,
    maxlength: [500, 'Message must be less than 500 characters']
  },
  data: {
    type: Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = async function(
  userId: string,
  limit: number = 20,
  skip: number = 0,
  unreadOnly: boolean = false
) {
  const query: any = { userId };

  if (unreadOnly) {
    query.isRead = false;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
};

// Static method to mark as read
notificationSchema.statics.markAsRead = async function(
  notificationIds: string[],
  userId: string
) {
  return this.updateMany(
    {
      _id: { $in: notificationIds },
      userId
    },
    {
      isRead: true,
      readAt: new Date()
    }
  );
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId: string) {
  return this.updateMany(
    { userId, isRead: false },
    {
      isRead: true,
      readAt: new Date()
    }
  );
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: Record<string, any>
) {
  return this.create({
    userId,
    type,
    title,
    message,
    data: data || {}
  });
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId: string) {
  return this.countDocuments({ userId, isRead: false });
};

// Static method to delete old notifications (cleanup)
notificationSchema.statics.deleteOldNotifications = async function(daysOld: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead: true
  });
};

export default mongoose.model<INotificationDocument>('Notification', notificationSchema);

import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    // success | warning | info | security | error
    type: {
      type: String,
      enum: ['success', 'warning', 'info', 'security', 'error'],
      default: 'info',
    },
    // category drives deep-linking and future routing
    category: {
      type: String,
      enum: ['transfer', 'login', 'security', 'wire', 'billpay', 'system', 'activity'],
      default: 'system',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // Flexible bag for future deep-linking, fraud alerts, AI, etc.
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;

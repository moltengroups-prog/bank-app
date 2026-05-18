import mongoose from 'mongoose';

const supportConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'active', 'closed'],
      default: 'waiting',
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    source: {
      type: String,
      enum: ['erica', 'live-chat', 'admin'],
      default: 'live-chat',
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    // Flexible bag: escalation reason, user-agent, initial topic, etc.
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

supportConversationSchema.index({ user: 1, status: 1 });
supportConversationSchema.index({ status: 1, lastMessageAt: -1 });
supportConversationSchema.index({ assignedAgent: 1, status: 1 });

const SupportConversation = mongoose.model('SupportConversation', supportConversationSchema);

export default SupportConversation;

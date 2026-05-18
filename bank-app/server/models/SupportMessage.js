import mongoose from 'mongoose';

const supportMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupportConversation',
      required: true,
    },
    // null for senderType 'system' or 'erica'
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    senderType: {
      type: String,
      enum: ['user', 'agent', 'system', 'erica'],
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Message cannot be empty'],
      trim: true,
    },
    // Reserved for future file upload support
    attachments: {
      type: [String],
      default: [],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

supportMessageSchema.index({ conversation: 1, createdAt: 1 });
supportMessageSchema.index({ conversation: 1, senderType: 1 });

const SupportMessage = mongoose.model('SupportMessage', supportMessageSchema);

export default SupportMessage;

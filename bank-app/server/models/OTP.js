import mongoose from 'mongoose';
import crypto from 'crypto';

const otpSchema = new mongoose.Schema({
  user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  email:          { type: String, required: true, lowercase: true },
  codeHash:       { type: String, required: true },
  expiresAt:      { type: Date, required: true },
  attempts:       { type: Number, default: 0 },
  lastSentAt:     { type: Date, default: Date.now },
  used:           { type: Boolean, default: false },
  deliveryMethod: { type: String, enum: ['email', 'terminal', 'admin-issued'], default: 'email' },
}, { timestamps: true });

// MongoDB auto-deletes documents once expiresAt is past
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export function hashOTP(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

export default mongoose.model('OTP', otpSchema);

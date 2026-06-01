import mongoose from 'mongoose';

export const ALERT_TYPES = [
  'suspicious_login',
  'failed_login_attempts',
  'large_wire_transfer',
  'card_security_review',
  'international_activity',
  'high_transaction_volume',
  'account_info_changed',
  'identity_verification_required',
  'custom',
];

export const SEVERITIES = ['low', 'medium', 'high', 'critical'];
export const STATUSES   = ['active', 'inactive', 'resolved'];

const restrictionsSchema = new mongoose.Schema({
  login:                     { type: Boolean, default: false },
  transfers:                 { type: Boolean, default: false },
  wires:                     { type: Boolean, default: false },
  billPay:                   { type: Boolean, default: false },
  zelle:                     { type: Boolean, default: false },
  debitCard:                 { type: Boolean, default: false },
  creditCard:                { type: Boolean, default: false },
  internationalTransactions: { type: Boolean, default: false },
  otpRequired:               { type: Boolean, default: false },
  identityVerification:      { type: Boolean, default: false },
  freezeAccount:             { type: Boolean, default: false },
}, { _id: false });

const securityAlertSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    alertType: {
      type:    String,
      enum:    ALERT_TYPES,
      default: 'custom',
    },
    title:   { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 600 },
    severity: {
      type:    String,
      enum:    SEVERITIES,
      default: 'medium',
    },
    restrictions: {
      type:    restrictionsSchema,
      default: () => ({}),
    },
    requiresChatResolution: { type: Boolean, default: true },
    status: {
      type:    String,
      enum:    STATUSES,
      default: 'active',
    },
    resolutionNotes: { type: String, default: '', maxlength: 1000 },
    createdBy: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },
    resolvedBy: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

securityAlertSchema.index({ user: 1, status: 1 });
securityAlertSchema.index({ status: 1, createdAt: -1 });
securityAlertSchema.index({ createdBy: 1, createdAt: -1 });

const SecurityAlert = mongoose.model('SecurityAlert', securityAlertSchema);
export default SecurityAlert;

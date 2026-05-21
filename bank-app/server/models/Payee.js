import mongoose from 'mongoose';

const PAYEE_CATEGORIES = [
  'utility', 'credit-card', 'mortgage', 'phone', 'insurance',
  'auto', 'student-loan', 'medical', 'subscription', 'government',
  'rent', 'other',
];

const payeeSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    // ── Identity ──────────────────────────────────────────────────────
    name:     { type: String, required: true, trim: true },
    nickname: { type: String, trim: true, default: '' },
    category: { type: String, enum: PAYEE_CATEGORIES, default: 'other' },

    // ── Account identifier at the biller ─────────────────────────────
    accountNumber: { type: String, trim: true, default: '' },

    // ── Mailing address (for check-based bill pay) ────────────────────
    address:    { type: String, trim: true, default: '' },
    addressTwo: { type: String, trim: true, default: '' },
    city:       { type: String, trim: true, default: '' },
    state:      { type: String, trim: true, default: '' },
    zipCode:    { type: String, trim: true, default: '' },
    phoneNumber:{ type: String, trim: true, default: '' },

    // ── Payment history ───────────────────────────────────────────────
    lastPaymentDate:   { type: Date,   default: null },
    lastPaymentAmount: { type: Number, default: null },
    totalPaid:         { type: Number, default: 0, min: 0 },
    paymentCount:      { type: Number, default: 0, min: 0 },

    // ── Status ────────────────────────────────────────────────────────
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

payeeSchema.index({ user: 1, isActive: 1 });
payeeSchema.index({ user: 1, createdAt: -1 });

const Payee = mongoose.model('Payee', payeeSchema);
export default Payee;

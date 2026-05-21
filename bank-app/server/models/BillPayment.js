import mongoose from 'mongoose';

function genConfirmNum() {
  return (
    'BP' +
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).substring(2, 7).toUpperCase()
  );
}

const PAYMENT_STATUSES = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
const RECURRING_RULES  = ['once', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually'];

const billPaymentSchema = new mongoose.Schema(
  {
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User',        required: true },
    fromAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount', required: true },
    payee:       { type: mongoose.Schema.Types.ObjectId, ref: 'Payee',       required: true },

    // ── Amount ────────────────────────────────────────────────────────
    amount: {
      type:     Number,
      required: true,
      min:      [0.01, 'Payment amount must be positive'],
    },
    memo: { type: String, trim: true, default: '', maxlength: 140 },

    // ── Scheduling ────────────────────────────────────────────────────
    scheduledDate: { type: Date, required: true },
    processedDate: { type: Date, default: null },

    // ── Status ────────────────────────────────────────────────────────
    status:             { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    failureReason:      { type: String, default: '' },
    cancellationReason: { type: String, default: '' },
    cancelledAt:        { type: Date,   default: null },
    cancelledBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // ── Recurring ─────────────────────────────────────────────────────
    isRecurring:     { type: Boolean, default: false },
    recurringRule:   { type: String,  enum: RECURRING_RULES, default: 'once' },
    recurringEndDate:{ type: Date,    default: null },
    // Links recurring payments into a chain
    nextPaymentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'BillPayment', default: null },
    parentPaymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'BillPayment', default: null },

    // ── Reference ─────────────────────────────────────────────────────
    confirmationNumber: {
      type:     String,
      required: true,
      default:  genConfirmNum,
    },

    // ── Ledger linkage ────────────────────────────────────────────────
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', default: null },

    // ── Admin ─────────────────────────────────────────────────────────
    refundedAt: { type: Date,   default: null },
    refundedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    refundTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', default: null },
    adminNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

billPaymentSchema.index({ user: 1, scheduledDate: -1 });
billPaymentSchema.index({ user: 1, status: 1 });
billPaymentSchema.index({ payee: 1, scheduledDate: -1 });
billPaymentSchema.index({ status: 1, scheduledDate: 1 });
billPaymentSchema.index({ confirmationNumber: 1 }, { unique: true });

const BillPayment = mongoose.model('BillPayment', billPaymentSchema);
export default BillPayment;

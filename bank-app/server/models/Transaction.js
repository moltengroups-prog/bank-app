import mongoose from 'mongoose';

const CATEGORIES = [
  'transfer', 'wire', 'billpay', 'deposit',
  'shopping', 'atm', 'zelle', 'payroll',
  'utilities', 'dining', 'travel', 'healthcare',
  'subscription', 'other',
];

function genRef() {
  return (
    'TXN' +
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).substring(2, 6).toUpperCase()
  );
}

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BankAccount',
      required: true,
    },
    type: {
      type: String,
      enum: ['debit', 'credit'],
      required: [true, 'Transaction type is required'],
    },
    category: {
      type: String,
      enum: CATEGORIES,
      default: 'other',
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    merchant: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'reversed', 'flagged'],
      default: 'completed',
    },
    referenceNumber: {
      type: String,
      default: genRef,
    },
    balanceAfter: {
      type: Number,
      default: 0,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },

    // ── Fraud / Risk fields ─────────────────────────────────────
    riskScore: {
      type:    Number,
      default: 0,
      min:     0,
      max:     100,
    },
    fraudFlags: {
      type:    [String],
      default: [],
    },
    fraudStatus: {
      type:    String,
      enum:    ['clean', 'monitoring', 'pending-review', 'blocked', 'approved', 'rejected'],
      default: 'clean',
    },
    // Stored for pending-review transfers so admin can execute the actual move on approval
    pendingMeta: {
      fromAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount' },
      toAccountId:   { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount' },
    },
    // Audit trail
    reviewedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt:    { type: Date, default: null },
    blockedReason: { type: String, default: null },

    // Flexible metadata: idempotency keys, transfer linkage, reversal refs, etc.
    metadata: {
      type:    mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// ── Indexes for efficient dashboard and statement queries ─────────
transactionSchema.index({ user: 1, transactionDate: -1 });
transactionSchema.index({ account: 1, transactionDate: -1 });
transactionSchema.index({ user: 1, account: 1, transactionDate: -1 });
transactionSchema.index({ fraudStatus: 1, transactionDate: -1 });
transactionSchema.index({ riskScore: -1, transactionDate: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;

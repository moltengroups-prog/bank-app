import mongoose from 'mongoose';

function genWireRef() {
  return (
    'WIR' +
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).substring(2, 7).toUpperCase()
  );
}

const WIRE_STATUSES = [
  'draft',
  'pending-review',
  'processing',
  'completed',
  'rejected',
  'blocked',
  'cancelled',
];

const wireTransferSchema = new mongoose.Schema(
  {
    // ── Parties ──────────────────────────────────────────────────────
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    fromAccount: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'BankAccount',
      required: true,
    },
    recipient: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'WireRecipient',
      required: true,
    },

    // ── Amount ───────────────────────────────────────────────────────
    amount: {
      type:     Number,
      required: true,
      min:      [1, 'Wire amount must be at least $1.00'],
    },
    currency: {
      type:      String,
      uppercase: true,
      trim:      true,
      default:   'USD',
    },
    exchangeRate: {
      type:    Number,
      default: 1,
    },

    // ── Fee ──────────────────────────────────────────────────────────
    // Wire transfer fee charged to the sender (in addition to amount).
    // Recorded here for display; the deduction is part of the engine withdrawal.
    fee: {
      type:    Number,
      default: 0,
      min:     0,
    },

    // ── Transfer details ─────────────────────────────────────────────
    memo: {
      type:    String,
      trim:    true,
      default: '',
      maxlength: 140,
    },

    // ── Status & risk ────────────────────────────────────────────────
    status: {
      type:    String,
      enum:    WIRE_STATUSES,
      default: 'draft',
    },
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
    riskLevel: {
      type:    String,
      enum:    ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW',
    },

    // ── Reference ────────────────────────────────────────────────────
    // unique index declared below via schema.index() — not here
    referenceNumber: {
      type:     String,
      required: true,
      default:  genWireRef,
    },

    // ── Timestamps ───────────────────────────────────────────────────
    submittedAt: {
      type:    Date,
      default: null,
    },
    processedAt: {
      type:    Date,
      default: null,
    },
    reviewedAt: {
      type:    Date,
      default: null,
    },
    settledAt: {
      type:    Date,
      default: null,
    },

    // ── Admin review ─────────────────────────────────────────────────
    reviewedBy: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },
    settledBy: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },
    reviewNotes: {
      type:    String,
      trim:    true,
      default: '',
    },
    blockedReason: {
      type:    String,
      default: '',
    },

    // ── Ledger linkage ───────────────────────────────────────────────
    // Populated once funds are actually moved (on completion).
    ledgerEntries: [{
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'LedgerEntry',
    }],
    transactionRecords: [{
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Transaction',
    }],

    // ── Future: scheduled / recurring ───────────────────────────────
    scheduledFor:  { type: Date, default: null },
    isRecurring:   { type: Boolean, default: false },
    recurringRule: { type: String, default: null },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────
wireTransferSchema.index({ user: 1, createdAt: -1 });
wireTransferSchema.index({ user: 1, status: 1 });
wireTransferSchema.index({ status: 1, createdAt: -1 });
wireTransferSchema.index({ referenceNumber: 1 }, { unique: true });
wireTransferSchema.index({ riskScore: -1, createdAt: -1 });

const WireTransfer = mongoose.model('WireTransfer', wireTransferSchema);

export default WireTransfer;

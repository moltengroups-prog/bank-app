import mongoose from 'mongoose';

// ── ID generator ───────────────────────────────────────────────────
function genEntryId() {
  return (
    'LE' +
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).substring(2, 7).toUpperCase()
  );
}

const ENTRY_TYPES  = ['debit', 'credit'];
const ENTRY_STATUS = ['pending', 'completed', 'failed', 'reversed', 'flagged'];

const ledgerEntrySchema = new mongoose.Schema(
  {
    entryId: {
      type:     String,
      unique:   true,
      required: true,
      default:  genEntryId,
    },

    // ── Core references ──────────────────────────────────────────────
    transactionId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Transaction',
      required: true,
    },
    account: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'BankAccount',
      required: true,
    },
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    // ── Double-entry fields ──────────────────────────────────────────
    type: {
      type:     String,
      enum:     ENTRY_TYPES,
      required: true,
    },
    amount: {
      type:     Number,
      required: true,
      min:      [0.01, 'Amount must be positive'],
    },
    balanceBefore: {
      type:     Number,
      required: true,
    },
    balanceAfter: {
      type:     Number,
      required: true,
    },

    // ── Descriptive fields ───────────────────────────────────────────
    description: {
      type:    String,
      trim:    true,
      default: '',
    },
    status: {
      type:    String,
      enum:    ENTRY_STATUS,
      default: 'completed',
    },
    createdBy: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },

    // ── Reversal linkage (write-once; reversal creates a new entry) ──
    reversalOf: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'LedgerEntry',
      default: null,
    },

    // ── Flexible extra data ──────────────────────────────────────────
    metadata: {
      type:    mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    // No updatedAt — ledger entries are write-once.
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

// ── Indexes ────────────────────────────────────────────────────────
ledgerEntrySchema.index({ transactionId: 1 });
ledgerEntrySchema.index({ account: 1, createdAt: -1 });
ledgerEntrySchema.index({ user: 1, createdAt: -1 });
ledgerEntrySchema.index({ reversalOf: 1 }, { sparse: true });

// ── Immutability — every write path is blocked after creation ──────
const E_IMMUTABLE  = 'LedgerEntry records are immutable and cannot be modified.';
const E_NO_DELETE  = 'LedgerEntry records cannot be deleted.';

ledgerEntrySchema.pre('save', function () {
  if (!this.isNew) throw new Error(E_IMMUTABLE);
});

ledgerEntrySchema.pre(
  ['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne'],
  function () { throw new Error(E_IMMUTABLE); }
);

ledgerEntrySchema.pre(
  ['deleteOne', 'deleteMany', 'findOneAndDelete'],
  function () { throw new Error(E_NO_DELETE); }
);

const LedgerEntry = mongoose.model('LedgerEntry', ledgerEntrySchema);

export default LedgerEntry;

import mongoose from 'mongoose';

const bankAccountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    accountName: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
    },
    accountType: {
      type: String,
      enum: ['checking', 'savings', 'credit', 'investment'],
      required: [true, 'Account type is required'],
    },
    // Full number is never returned by default
    accountNumber: {
      type: String,
      required: [true, 'Account number is required'],
      select: false,
    },
    // Last 4 digits — safe to expose publicly
    last4: {
      type: String,
    },
    routingNumber: {
      type: String,
      required: [true, 'Routing number is required'],
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    availableBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'frozen', 'closed'],
      default: 'active',
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────
bankAccountSchema.index({ user: 1 });
bankAccountSchema.index({ user: 1, status: 1 });

// ── Auto-derive last4 from accountNumber on every save ────────────
bankAccountSchema.pre('save', function () {
  if (this.accountNumber) {
    this.last4 = this.accountNumber.slice(-4);
  }
});

// ── Instance method: return publicly safe masked number ───────────
bankAccountSchema.methods.getMaskedAccountNumber = function () {
  return `••••${this.last4}`;
};

const BankAccount = mongoose.model('BankAccount', bankAccountSchema);

export default BankAccount;

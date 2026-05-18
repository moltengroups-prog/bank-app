import mongoose from 'mongoose';

function genRecipientId() {
  return (
    'WR' +
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).substring(2, 6).toUpperCase()
  );
}

const wireRecipientSchema = new mongoose.Schema(
  {
    recipientId: {
      type:     String,
      unique:   true,
      required: true,
      default:  genRecipientId,
    },

    // ── Ownership ────────────────────────────────────────────────────
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    // ── Display ──────────────────────────────────────────────────────
    nickname: {
      type:    String,
      trim:    true,
      default: '',
    },

    // ── Geography & currency ─────────────────────────────────────────
    country: {
      type:      String,
      uppercase: true,
      trim:      true,
      default:   'US',
    },
    currency: {
      type:      String,
      uppercase: true,
      trim:      true,
      default:   'USD',
    },

    // ── Recipient classification ──────────────────────────────────────
    recipientType: {
      type:    String,
      enum:    ['individual', 'business'],
      default: 'individual',
    },
    ownershipType: {
      type:    String,
      enum:    ['personal', 'business'],
      default: 'personal',
    },

    // ── Person name (individual) ─────────────────────────────────────
    firstName: {
      type:    String,
      trim:    true,
      default: '',
    },
    lastName: {
      type:    String,
      trim:    true,
      default: '',
    },

    // ── Business name ────────────────────────────────────────────────
    businessName: {
      type:    String,
      trim:    true,
      default: '',
    },

    // ── Banking info ─────────────────────────────────────────────────
    bankName: {
      type:    String,
      trim:    true,
      default: '',
    },
    routingNumber: {
      type:    String,
      trim:    true,
      default: '',
    },
    swiftCode: {
      type:    String,
      trim:    true,
      uppercase: true,
      default: '',
    },

    // Raw account number is NEVER stored in plaintext.
    // accountNumberEncrypted: AES-256-GCM ciphertext (iv:tag:data, all hex)
    // accountNumberMasked:    "••••1234" — safe to expose in UI
    accountNumberEncrypted: {
      type:   String,
      select: false, // excluded from queries by default
    },
    accountNumberMasked: {
      type:    String,
      default: '',
    },

    // ── Address ──────────────────────────────────────────────────────
    recipientAddress: {
      type:    String,
      trim:    true,
      default: '',
    },
    city: {
      type:    String,
      trim:    true,
      default: '',
    },
    state: {
      type:    String,
      trim:    true,
      default: '',
    },
    postalCode: {
      type:    String,
      trim:    true,
      default: '',
    },

    // ── Verification ─────────────────────────────────────────────────
    isVerified: {
      type:    Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────
wireRecipientSchema.index({ user: 1, createdAt: -1 });
wireRecipientSchema.index({ user: 1, recipientId: 1 });

const WireRecipient = mongoose.model('WireRecipient', wireRecipientSchema);

export default WireRecipient;

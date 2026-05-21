import mongoose from 'mongoose';

// ── Action catalog ─────────────────────────────────────────────────
// Keep as a frozen object so callers use constants, not magic strings.
export const AUDIT_ACTIONS = Object.freeze({
  // Auth
  ADMIN_LOGIN:           'admin.login',
  ADMIN_LOGOUT:          'admin.logout',
  ADMIN_LOGIN_FAILED:    'admin.login.failed',

  // Account lifecycle
  ACCOUNT_FREEZE:        'account.freeze',
  ACCOUNT_UNFREEZE:      'account.unfreeze',
  ACCOUNT_CLOSE:         'account.close',

  // Balance operations
  BALANCE_ADJUSTMENT:    'balance.adjustment',

  // Transfer lifecycle
  TRANSFER_INITIATED:    'transfer.initiated',
  TRANSFER_APPROVED:     'transfer.approved',
  TRANSFER_REJECTED:     'transfer.rejected',
  TRANSACTION_REVERSED:  'transaction.reversed',

  // Fraud / Security
  FRAUD_FLAG_RAISED:     'fraud.flag.raised',
  FRAUD_REVIEW_APPROVED: 'fraud.review.approved',
  FRAUD_REVIEW_REJECTED: 'fraud.review.rejected',
  FRAUD_ACCOUNT_BLOCKED: 'fraud.account.blocked',

  // User management
  USER_CREATED:          'user.created',
  USER_UPDATED:          'user.updated',
  USER_SUSPENDED:        'user.suspended',
  USER_VERIFIED:         'user.verified',

  // Support operations
  SUPPORT_TICKET_OPENED: 'support.ticket.opened',
  SUPPORT_TICKET_CLOSED: 'support.ticket.closed',
  SUPPORT_MESSAGE_SENT:  'support.message.sent',
  SUPPORT_ESCALATED:     'support.escalated',

  // Wire transfers
  WIRE_SUBMITTED:        'wire.submitted',
  WIRE_APPROVED:         'wire.approved',
  WIRE_SETTLED:          'wire.settled',
  WIRE_REJECTED:         'wire.rejected',
  WIRE_BLOCKED:          'wire.blocked',
  WIRE_CANCELLED:        'wire.cancelled',

  // Bill Pay
  BILLPAY_SCHEDULED:     'billpay.scheduled',
  BILLPAY_PROCESSED:     'billpay.processed',
  BILLPAY_FAILED:        'billpay.failed',
  BILLPAY_CANCELLED:     'billpay.cancelled',
  BILLPAY_REFUNDED:      'billpay.refunded',

  // Account Operations
  STATEMENT_DOWNLOADED:  'account.statement.downloaded',

  // System
  DATA_EXPORT:           'data.export',
});

// ── ID generator ───────────────────────────────────────────────────
function genLogId() {
  return (
    'AL' +
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).substring(2, 7).toUpperCase()
  );
}

const SEVERITIES = ['info', 'warning', 'critical'];

const auditLogSchema = new mongoose.Schema(
  {
    logId: {
      type:     String,
      unique:   true,
      required: true,
      default:  genLogId,
    },

    // ── Who performed the action ─────────────────────────────────────
    actor: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },
    // Denormalized — survives user deletion
    actorEmail: {
      type:    String,
      default: 'system',
    },
    actorRole: {
      type:    String,
      default: 'system',
    },

    // ── What happened ────────────────────────────────────────────────
    action: {
      type:     String,
      required: true,
      enum:     Object.values(AUDIT_ACTIONS),
    },

    // ── What was affected ────────────────────────────────────────────
    targetUser: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },
    targetAccount: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'BankAccount',
      default: null,
    },
    targetTransaction: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Transaction',
      default: null,
    },

    // ── State snapshots ──────────────────────────────────────────────
    beforeState: {
      type:    mongoose.Schema.Types.Mixed,
      default: null,
    },
    afterState: {
      type:    mongoose.Schema.Types.Mixed,
      default: null,
    },

    // ── Request context ──────────────────────────────────────────────
    ipAddress: {
      type:    String,
      default: null,
    },
    userAgent: {
      type:    String,
      default: null,
    },

    // ── Classification ───────────────────────────────────────────────
    severity: {
      type:    String,
      enum:    SEVERITIES,
      default: 'info',
    },
    metadata: {
      type:    mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

// ── Indexes ────────────────────────────────────────────────────────
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetUser: 1, createdAt: -1 });
auditLogSchema.index({ targetAccount: 1, createdAt: -1 });
auditLogSchema.index({ targetTransaction: 1, createdAt: -1 });
auditLogSchema.index({ severity: 1, createdAt: -1 });

// ── Immutability ───────────────────────────────────────────────────
const E_IMMUTABLE = 'AuditLog records are immutable and cannot be modified.';
const E_NO_DELETE = 'AuditLog records cannot be deleted.';

auditLogSchema.pre('save', function () {
  if (!this.isNew) throw new Error(E_IMMUTABLE);
});

auditLogSchema.pre(
  ['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne'],
  function () { throw new Error(E_IMMUTABLE); }
);

auditLogSchema.pre(
  ['deleteOne', 'deleteMany', 'findOneAndDelete'],
  function () { throw new Error(E_NO_DELETE); }
);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;

/**
 * Audit Service — immutable admin action log.
 *
 * This module NEVER throws. Audit failures are written to stderr so
 * they never interrupt the business operation being logged.
 *
 * Usage:
 *   import * as audit from '../services/auditService.js';
 *   await audit.logAccountFreeze({ admin: req.user, account, reason, ipAddress });
 */

import AuditLog from '../models/AuditLog.js';
export { AUDIT_ACTIONS } from '../models/AuditLog.js';

// ── Core writer ────────────────────────────────────────────────────

/**
 * Write a single audit log entry.
 * Safe to call without await — failures are swallowed after stderr log.
 */
export async function log({
  actor             = null,
  actorEmail        = 'system',
  actorRole         = 'system',
  action,
  targetUser        = null,
  targetAccount     = null,
  targetTransaction = null,
  beforeState       = null,
  afterState        = null,
  ipAddress         = null,
  userAgent         = null,
  severity          = 'info',
  metadata          = {},
}) {
  try {
    await AuditLog.create({
      actor,
      actorEmail,
      actorRole,
      action,
      targetUser,
      targetAccount,
      targetTransaction,
      beforeState,
      afterState,
      ipAddress,
      userAgent,
      severity,
      metadata,
    });
  } catch (err) {
    console.error('[AuditService] Failed to write log entry:', err.message, { action, actorEmail });
  }
}

// ── Extract IP from Express request ───────────────────────────────
function ip(req) {
  return req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
    ?? req?.ip
    ?? null;
}

function ua(req) {
  return req?.headers?.['user-agent'] ?? null;
}

// ── Convenience wrappers ───────────────────────────────────────────
// Each wrapper is typed to a specific action so callers pass structured
// data rather than raw { action, before, after } every time.

import { AUDIT_ACTIONS } from '../models/AuditLog.js';

/** Admin successfully logged in. */
export async function logAdminLogin({ admin, req }) {
  return log({
    actor:      admin._id,
    actorEmail: admin.email,
    actorRole:  admin.role,
    action:     AUDIT_ACTIONS.ADMIN_LOGIN,
    severity:   'info',
    ipAddress:  ip(req),
    userAgent:  ua(req),
  });
}

/** Failed admin login attempt (wrong password / invalid account). */
export async function logAdminLoginFailed({ email, req }) {
  return log({
    actorEmail: email ?? 'unknown',
    action:     AUDIT_ACTIONS.ADMIN_LOGIN_FAILED,
    severity:   'warning',
    ipAddress:  ip(req),
    userAgent:  ua(req),
    metadata:   { attemptedEmail: email },
  });
}

/** Admin logged out. */
export async function logAdminLogout({ admin, req }) {
  return log({
    actor:      admin._id,
    actorEmail: admin.email,
    actorRole:  admin.role,
    action:     AUDIT_ACTIONS.ADMIN_LOGOUT,
    severity:   'info',
    ipAddress:  ip(req),
    userAgent:  ua(req),
  });
}

/** Account frozen by admin or fraud system. */
export async function logAccountFreeze({ admin, account, reason, req }) {
  return log({
    actor:         admin._id,
    actorEmail:    admin.email,
    actorRole:     admin.role,
    action:        AUDIT_ACTIONS.ACCOUNT_FREEZE,
    targetUser:    account.user,
    targetAccount: account._id,
    beforeState:   { status: account.status },
    afterState:    { status: 'frozen' },
    severity:      'warning',
    ipAddress:     ip(req),
    userAgent:     ua(req),
    metadata:      { reason, accountLast4: account.last4 },
  });
}

/** Account unfrozen by admin. */
export async function logAccountUnfreeze({ admin, account, reason, req }) {
  return log({
    actor:         admin._id,
    actorEmail:    admin.email,
    actorRole:     admin.role,
    action:        AUDIT_ACTIONS.ACCOUNT_UNFREEZE,
    targetUser:    account.user,
    targetAccount: account._id,
    beforeState:   { status: account.status },
    afterState:    { status: 'active' },
    severity:      'info',
    ipAddress:     ip(req),
    userAgent:     ua(req),
    metadata:      { reason, accountLast4: account.last4 },
  });
}

/**
 * Admin applied a manual balance adjustment.
 * Pass the result object returned by bankingEngine.applyAdminAdjustment().
 */
export async function logBalanceAdjustment({ admin, account, adjustment, reason, req }) {
  return log({
    actor:         admin._id,
    actorEmail:    admin.email,
    actorRole:     admin.role,
    action:        AUDIT_ACTIONS.BALANCE_ADJUSTMENT,
    targetUser:    account.user?._id ?? account.user,
    targetAccount: account._id,
    targetTransaction: adjustment.transaction._id,
    beforeState:   { balance: adjustment.balanceBefore },
    afterState:    { balance: adjustment.balanceAfter },
    severity:      'warning',
    ipAddress:     ip(req),
    userAgent:     ua(req),
    metadata:      {
      reason,
      adjustmentAmount: adjustment.adjustment,
      accountLast4:     account.last4,
    },
  });
}

/** Admin approved a pending-review transfer and it was executed. */
export async function logTransferApproval({ admin, transaction, req }) {
  return log({
    actor:             admin._id,
    actorEmail:        admin.email,
    actorRole:         admin.role,
    action:            AUDIT_ACTIONS.TRANSFER_APPROVED,
    targetUser:        transaction.user,
    targetTransaction: transaction._id,
    beforeState:       { fraudStatus: transaction.fraudStatus, status: transaction.status },
    afterState:        { fraudStatus: 'approved',              status: 'completed' },
    severity:          'warning',
    ipAddress:         ip(req),
    userAgent:         ua(req),
    metadata:          { amount: transaction.amount, referenceNumber: transaction.referenceNumber },
  });
}

/** Admin rejected a pending-review transfer. */
export async function logTransferRejection({ admin, transaction, reason, req }) {
  return log({
    actor:             admin._id,
    actorEmail:        admin.email,
    actorRole:         admin.role,
    action:            AUDIT_ACTIONS.TRANSFER_REJECTED,
    targetUser:        transaction.user,
    targetTransaction: transaction._id,
    beforeState:       { fraudStatus: transaction.fraudStatus, status: transaction.status },
    afterState:        { fraudStatus: 'rejected',              status: 'failed', reason },
    severity:          'warning',
    ipAddress:         ip(req),
    userAgent:         ua(req),
    metadata:          { reason, amount: transaction.amount },
  });
}

/**
 * Admin reversed a transaction.
 * Pass the result object returned by bankingEngine.reverseTransaction().
 */
export async function logTransactionReversal({ admin, originalTransaction, reversalResult, req }) {
  return log({
    actor:             admin._id,
    actorEmail:        admin.email,
    actorRole:         admin.role,
    action:            AUDIT_ACTIONS.TRANSACTION_REVERSED,
    targetUser:        originalTransaction.user,
    targetTransaction: originalTransaction._id,
    beforeState:       { status: originalTransaction.status, amount: originalTransaction.amount },
    afterState:        { status: 'reversed', reason: reversalResult.reason },
    severity:          'critical',
    ipAddress:         ip(req),
    userAgent:         ua(req),
    metadata:          {
      reason:        reversalResult.reason,
      reversalCount: reversalResult.reversals?.length ?? 1,
    },
  });
}

/** Fraud flags were raised on a transaction by the engine or routing layer. */
export async function logFraudFlag({ transaction, flags, riskScore }) {
  return log({
    action:            AUDIT_ACTIONS.FRAUD_FLAG_RAISED,
    targetUser:        transaction.user,
    targetTransaction: transaction._id,
    beforeState:       { fraudStatus: 'clean' },
    afterState:        { fraudStatus: 'monitoring', flags, riskScore },
    severity:          riskScore >= 70 ? 'critical' : 'warning',
    metadata:          { flags, riskScore },
  });
}

/** Admin reviewed a fraud case and approved it. */
export async function logFraudApproval({ admin, transaction, req }) {
  return log({
    actor:             admin._id,
    actorEmail:        admin.email,
    actorRole:         admin.role,
    action:            AUDIT_ACTIONS.FRAUD_REVIEW_APPROVED,
    targetUser:        transaction.user,
    targetTransaction: transaction._id,
    beforeState:       { fraudStatus: transaction.fraudStatus },
    afterState:        { fraudStatus: 'approved' },
    severity:          'critical',
    ipAddress:         ip(req),
    userAgent:         ua(req),
    metadata:          { amount: transaction.amount, referenceNumber: transaction.referenceNumber },
  });
}

/** Admin reviewed a fraud case and rejected it. */
export async function logFraudRejection({ admin, transaction, reason, req }) {
  return log({
    actor:             admin._id,
    actorEmail:        admin.email,
    actorRole:         admin.role,
    action:            AUDIT_ACTIONS.FRAUD_REVIEW_REJECTED,
    targetUser:        transaction.user,
    targetTransaction: transaction._id,
    beforeState:       { fraudStatus: transaction.fraudStatus },
    afterState:        { fraudStatus: 'rejected', reason },
    severity:          'critical',
    ipAddress:         ip(req),
    userAgent:         ua(req),
    metadata:          { reason, amount: transaction.amount },
  });
}

/** Account frozen during fraud review. */
export async function logFraudAccountFreeze({ admin, account, transaction, reason, req }) {
  return log({
    actor:             admin._id,
    actorEmail:        admin.email,
    actorRole:         admin.role,
    action:            AUDIT_ACTIONS.FRAUD_ACCOUNT_BLOCKED,
    targetUser:        account.user,
    targetAccount:     account._id,
    targetTransaction: transaction._id,
    beforeState:       { status: account.status, fraudStatus: transaction.fraudStatus },
    afterState:        { status: 'frozen' },
    severity:          'critical',
    ipAddress:         ip(req),
    userAgent:         ua(req),
    metadata:          { reason, accountLast4: account.last4 },
  });
}

/** User submitted a wire transfer. */
export async function logWireSubmit({ user, wire, req }) {
  return log({
    actor:      user._id,
    actorEmail: user.email,
    actorRole:  user.role,
    action:     AUDIT_ACTIONS.WIRE_SUBMITTED,
    targetUser: user._id,
    severity:   wire.riskLevel === 'HIGH' || wire.riskLevel === 'CRITICAL' ? 'warning' : 'info',
    ipAddress:  ip(req),
    userAgent:  ua(req),
    metadata:   { wireId: String(wire._id), referenceNumber: wire.referenceNumber, amount: wire.amount, status: wire.status, riskScore: wire.riskScore },
  });
}

/** Admin approved a pending-review wire. */
export async function logWireApproval({ admin, wire, req }) {
  return log({
    actor:      admin._id,
    actorEmail: admin.email,
    actorRole:  admin.role,
    action:     AUDIT_ACTIONS.WIRE_APPROVED,
    targetUser: wire.user?._id ?? wire.user,
    beforeState: { status: 'pending-review' },
    afterState:  { status: 'processing' },
    severity:   'critical',
    ipAddress:  ip(req),
    userAgent:  ua(req),
    metadata:   { wireId: String(wire._id), referenceNumber: wire.referenceNumber, amount: wire.amount },
  });
}

/** Admin rejected a pending-review wire. */
export async function logWireRejection({ admin, wire, reason, req }) {
  return log({
    actor:      admin._id,
    actorEmail: admin.email,
    actorRole:  admin.role,
    action:     AUDIT_ACTIONS.WIRE_REJECTED,
    targetUser: wire.user?._id ?? wire.user,
    beforeState: { status: 'pending-review' },
    afterState:  { status: 'rejected', reason },
    severity:   'critical',
    ipAddress:  ip(req),
    userAgent:  ua(req),
    metadata:   { wireId: String(wire._id), referenceNumber: wire.referenceNumber, amount: wire.amount, reason },
  });
}

/** Wire was auto-blocked by fraud engine. */
export async function logWireBlocked({ user, wire, req }) {
  return log({
    actor:      user._id,
    actorEmail: user.email,
    actorRole:  user.role,
    action:     AUDIT_ACTIONS.WIRE_BLOCKED,
    targetUser: user._id,
    severity:   'critical',
    ipAddress:  ip(req),
    userAgent:  ua(req),
    metadata:   { wireId: String(wire._id), referenceNumber: wire.referenceNumber, amount: wire.amount, fraudFlags: wire.fraudFlags, riskScore: wire.riskScore },
  });
}

/** Admin settled (completed) a processing wire. */
export async function logWireSettlement({ admin, wire, req }) {
  return log({
    actor:       admin._id,
    actorEmail:  admin.email,
    actorRole:   admin.role,
    action:      AUDIT_ACTIONS.WIRE_SETTLED,
    targetUser:  wire.user?._id ?? wire.user,
    beforeState: { status: 'processing' },
    afterState:  { status: 'completed', settledAt: wire.settledAt },
    severity:    'info',
    ipAddress:   ip(req),
    userAgent:   ua(req),
    metadata:    { wireId: String(wire._id), referenceNumber: wire.referenceNumber, amount: wire.amount },
  });
}

/** Support agent action (ticket open/close/message/escalate). */
export async function logSupportAction({ agent, action, targetUser, conversation, metadata = {}, req }) {
  return log({
    actor:      agent._id,
    actorEmail: agent.email,
    actorRole:  agent.role,
    action,
    targetUser: targetUser?._id ?? targetUser,
    severity:   'info',
    ipAddress:  ip(req),
    userAgent:  ua(req),
    metadata:   { ...metadata, conversationId: conversation?._id?.toString() },
  });
}

/** Bill pay generic action (payee added, etc). */
export async function logBillPayAction({ user, action: actionLabel, payeeId, payeeName, req }) {
  return log({
    actor:      user._id,
    actorEmail: user.email,
    actorRole:  user.role,
    action:     AUDIT_ACTIONS.BILLPAY_SCHEDULED,
    targetUser: user._id,
    severity:   'info',
    ipAddress:  ip(req),
    userAgent:  ua(req),
    metadata:   { payeeId, payeeName, actionLabel },
  });
}

/** User scheduled a bill payment. */
export async function logBillPayScheduled({ user, payment, payee, req }) {
  return log({
    actor:      user._id,
    actorEmail: user.email,
    actorRole:  user.role,
    action:     AUDIT_ACTIONS.BILLPAY_SCHEDULED,
    targetUser: user._id,
    severity:   'info',
    ipAddress:  ip(req),
    userAgent:  ua(req),
    metadata:   {
      paymentId:          String(payment._id),
      confirmationNumber: payment.confirmationNumber,
      amount:             payment.amount,
      payeeName:          payee.name,
      scheduledDate:      payment.scheduledDate,
      isRecurring:        payment.isRecurring,
      recurringRule:      payment.recurringRule,
    },
  });
}

/** Bill payment was processed (completed or failed). */
export async function logBillPayProcessed({ payment, payee, success, reason }) {
  return log({
    action:     success ? AUDIT_ACTIONS.BILLPAY_PROCESSED : AUDIT_ACTIONS.BILLPAY_FAILED,
    targetUser: payment.user,
    severity:   success ? 'info' : 'warning',
    metadata:   {
      paymentId:          String(payment._id),
      confirmationNumber: payment.confirmationNumber,
      amount:             payment.amount,
      payeeName:          payee?.name ?? '',
      reason:             reason ?? '',
    },
  });
}

/** User cancelled a pending bill payment. */
export async function logBillPayCancelled({ user, payment, req }) {
  return log({
    actor:      user._id,
    actorEmail: user.email,
    actorRole:  user.role,
    action:     AUDIT_ACTIONS.BILLPAY_CANCELLED,
    targetUser: user._id,
    severity:   'info',
    ipAddress:  ip(req),
    userAgent:  ua(req),
    metadata:   { paymentId: String(payment._id), confirmationNumber: payment.confirmationNumber, amount: payment.amount },
  });
}

/** Admin refunded a completed bill payment. */
export async function logBillPayRefunded({ admin, payment, req }) {
  return log({
    actor:      admin._id,
    actorEmail: admin.email,
    actorRole:  admin.role,
    action:     AUDIT_ACTIONS.BILLPAY_REFUNDED,
    targetUser: payment.user?._id ?? payment.user,
    severity:   'warning',
    ipAddress:  ip(req),
    userAgent:  ua(req),
    metadata:   { paymentId: String(payment._id), confirmationNumber: payment.confirmationNumber, amount: payment.amount },
  });
}

// ── OTP / Auth events ──────────────────────────────────────────────

/** OTP code was generated and sent to a user. */
export async function logOTPSent({ user, deliveryMethod = 'email', req }) {
  return log({
    actor:      user._id,
    actorEmail: user.email,
    actorRole:  user.role ?? 'user',
    action:     AUDIT_ACTIONS.OTP_SENT,
    targetUser: user._id,
    severity:   'info',
    ipAddress:  ip(req),
    userAgent:  ua(req),
    metadata:   { deliveryMethod },
  });
}

/** OTP verified successfully — full session issued. */
export async function logOTPVerified({ user, req }) {
  return log({
    actor:      user._id,
    actorEmail: user.email,
    actorRole:  user.role ?? 'user',
    action:     AUDIT_ACTIONS.OTP_VERIFIED,
    targetUser: user._id,
    severity:   'info',
    ipAddress:  ip(req),
    userAgent:  ua(req),
  });
}

/** OTP verification attempt failed (wrong code). */
export async function logOTPFailed({ userId, email, attemptsLeft, req }) {
  return log({
    actorEmail: email ?? 'unknown',
    action:     AUDIT_ACTIONS.OTP_FAILED,
    targetUser: userId ?? null,
    severity:   attemptsLeft <= 1 ? 'warning' : 'info',
    ipAddress:  ip(req),
    userAgent:  ua(req),
    metadata:   { attemptsLeft },
  });
}

/** OTP code was resent to a user. */
export async function logOTPResent({ user, req }) {
  return log({
    actor:      user._id,
    actorEmail: user.email,
    actorRole:  user.role ?? 'user',
    action:     AUDIT_ACTIONS.OTP_RESENT,
    targetUser: user._id,
    severity:   'info',
    ipAddress:  ip(req),
    userAgent:  ua(req),
  });
}

/** Admin manually issued a fallback OTP for a user. */
export async function logOTPAdminIssued({ admin, targetUser, req }) {
  return log({
    actor:      admin._id,
    actorEmail: admin.email,
    actorRole:  admin.role,
    action:     AUDIT_ACTIONS.OTP_ADMIN_ISSUED,
    targetUser: targetUser._id,
    severity:   'warning',
    ipAddress:  ip(req),
    userAgent:  ua(req),
    metadata:   { targetEmail: targetUser.email },
  });
}

/** Admin revoked all pending OTPs for a user. */
export async function logOTPRevoked({ admin, targetUser, req }) {
  return log({
    actor:      admin._id,
    actorEmail: admin.email,
    actorRole:  admin.role,
    action:     AUDIT_ACTIONS.OTP_REVOKED,
    targetUser: targetUser._id,
    severity:   'warning',
    ipAddress:  ip(req),
    userAgent:  ua(req),
    metadata:   { targetEmail: targetUser.email },
  });
}

// ── Admin 2FA PIN events ───────────────────────────────────────────

/** Admin successfully passed 2FA PIN check. */
export async function logAdmin2FAVerified({ admin, req }) {
  return log({
    actor:      admin._id,
    actorEmail: admin.email,
    actorRole:  admin.role,
    action:     AUDIT_ACTIONS.ADMIN_2FA_VERIFIED,
    severity:   'info',
    ipAddress:  ip(req),
    userAgent:  ua(req),
  });
}

/** Admin 2FA PIN attempt failed (wrong PIN). */
export async function logAdmin2FAFailed({ email, userId, attemptsLeft, req }) {
  return log({
    actorEmail: email ?? 'unknown',
    action:     AUDIT_ACTIONS.ADMIN_2FA_FAILED,
    targetUser: userId ?? null,
    severity:   attemptsLeft <= 1 ? 'warning' : 'info',
    ipAddress:  ip(req),
    userAgent:  ua(req),
    metadata:   { attemptsLeft },
  });
}

/** Admin PIN was reset by a superadmin. */
export async function logAdminPinReset({ admin, targetUser, req }) {
  return log({
    actor:      admin._id,
    actorEmail: admin.email,
    actorRole:  admin.role,
    action:     AUDIT_ACTIONS.ADMIN_PIN_RESET,
    targetUser: targetUser._id,
    severity:   'warning',
    ipAddress:  ip(req),
    userAgent:  ua(req),
    metadata:   { targetEmail: targetUser.email },
  });
}

// ── Wire transfer OTP events ───────────────────────────────────────

/** Wire OTP was sent to a user before submission. */
export async function logWireOTPSent({ user, req }) {
  return log({
    actor:      user._id,
    actorEmail: user.email,
    actorRole:  user.role ?? 'user',
    action:     AUDIT_ACTIONS.WIRE_OTP_SENT,
    targetUser: user._id,
    severity:   'info',
    ipAddress:  ip(req),
    userAgent:  ua(req),
  });
}

/** User verified a wire OTP — transfer allowed to proceed. */
export async function logWireOTPVerified({ user, req }) {
  return log({
    actor:      user._id,
    actorEmail: user.email,
    actorRole:  user.role ?? 'user',
    action:     AUDIT_ACTIONS.WIRE_OTP_VERIFIED,
    targetUser: user._id,
    severity:   'info',
    ipAddress:  ip(req),
    userAgent:  ua(req),
  });
}

/** Wire OTP verification attempt failed (wrong code). */
export async function logWireOTPFailed({ userId, email, attemptsLeft, req }) {
  return log({
    actorEmail: email ?? 'unknown',
    action:     AUDIT_ACTIONS.WIRE_OTP_FAILED,
    targetUser: userId ?? null,
    severity:   attemptsLeft <= 1 ? 'warning' : 'info',
    ipAddress:  ip(req),
    userAgent:  ua(req),
    metadata:   { attemptsLeft },
  });
}

/** User downloaded/viewed a statement. */
export async function logStatementDownload({ user, account, period, req }) {
  return log({
    actor:         user._id,
    actorEmail:    user.email,
    actorRole:     user.role,
    action:        AUDIT_ACTIONS.STATEMENT_DOWNLOADED,
    targetUser:    user._id,
    targetAccount: account._id,
    severity:      'info',
    ipAddress:     ip(req),
    userAgent:     ua(req),
    metadata:      { accountLast4: account.last4, period },
  });
}

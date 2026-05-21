import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getUsers,
  getUserById,
  getAdminAccounts,
  updateAccountStatus,
  adjustBalance,
  getAdminTransfers,
  reverseAdminTransaction,
  getAnalyticsOverview,
  getConversations,
  getConversationMessages,
  postAgentMessage,
  assignConversation,
  closeConversation,
  getAuditLogs,
  getLedgerEntries,
} from '../controllers/adminController.js';
import {
  adminGetPayments,
  adminGetFailedPayments,
  adminRetryPayment,
  adminRefundPayment,
} from '../controllers/billPayController.js';
import {
  getPendingFraud,
  getFraudHistory,
  getFraudStats,
  approveFraud,
  rejectFraud,
  freezeAccountForFraud,
} from '../controllers/fraudController.js';
import {
  getPendingWires,
  getWireHistory,
  approveWire,
  rejectWire,
  settleWire,
} from '../controllers/wireTransferController.js';

const router = Router();

// All admin routes require auth + admin or support-agent role
router.use(protect, authorize('admin', 'support-agent'));

// Shorthand: admin-only guard applied inline on mutation routes
const adminOnly = authorize('admin');

// ── User management (read: both roles | mutations: admin only) ────
router.get('/users',     getUsers);
router.get('/users/:id', getUserById);

// ── Account management ────────────────────────────────────────────
router.get('/accounts',                  getAdminAccounts);
router.patch('/accounts/:id/status',     adminOnly, updateAccountStatus);
router.patch('/accounts/:id/balance',    adminOnly, adjustBalance);

// ── Transfer monitoring ───────────────────────────────────────────
router.get('/transfers',                       getAdminTransfers);
router.post('/transactions/:id/reverse',       adminOnly, reverseAdminTransaction);

// ── Analytics ─────────────────────────────────────────────────────
router.get('/analytics/overview',        getAnalyticsOverview);

// ── Support queue (both roles can read and message) ───────────────
router.get('/conversations',                      getConversations);
router.get('/conversations/:id/messages',         getConversationMessages);
router.post('/conversations/:id/message',         postAgentMessage);
router.patch('/conversations/:id/assign',         assignConversation);
router.patch('/conversations/:id/close',          closeConversation);

// ── Fraud review (read: both | actions: admin only) ───────────────
router.get('/fraud/pending',              getPendingFraud);
router.get('/fraud/history',              getFraudHistory);
router.get('/fraud/stats',                getFraudStats);
router.post('/fraud/:id/approve',         adminOnly, approveFraud);
router.post('/fraud/:id/reject',          adminOnly, rejectFraud);
router.post('/fraud/:id/freeze-account',  adminOnly, freezeAccountForFraud);

// ── Wire transfer review (read: both | actions: admin only) ───────
router.get('/wire-transfers/pending',        getPendingWires);
router.get('/wire-transfers',                getWireHistory);
router.post('/wire-transfers/:id/approve',   adminOnly, approveWire);
router.post('/wire-transfers/:id/reject',    adminOnly, rejectWire);
router.post('/wire-transfers/:id/settle',    adminOnly, settleWire);

// ── Audit logs (read-only for both roles) ─────────────────────────
router.get('/audit-logs',                  getAuditLogs);

// ── Ledger (read-only for both roles) ────────────────────────────
router.get('/ledger',                      getLedgerEntries);

// ── Bill pay admin (read: both | mutations: admin only) ──────────
router.get ('/bill-pay/payments',                adminGetPayments);
router.get ('/bill-pay/payments/failed',         adminGetFailedPayments);
router.post('/bill-pay/payments/:id/retry',      adminOnly, adminRetryPayment);
router.post('/bill-pay/payments/:id/refund',     adminOnly, adminRefundPayment);

export default router;

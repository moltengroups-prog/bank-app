import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getUsers,
  getUserById,
  getAdminAccounts,
  updateAccountStatus,
  adjustBalance,
  getAdminTransfers,
  getAnalyticsOverview,
  getConversations,
  getConversationMessages,
  postAgentMessage,
  assignConversation,
  closeConversation,
} from '../controllers/adminController.js';
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
} from '../controllers/wireTransferController.js';

const router = Router();

// All admin routes require auth + admin or support-agent role
router.use(protect, authorize('admin', 'support-agent'));

// ── User management ───────────────────────────────────────────────
router.get('/users',     getUsers);
router.get('/users/:id', getUserById);

// ── Account management ────────────────────────────────────────────
router.get('/accounts',                  getAdminAccounts);
router.patch('/accounts/:id/status',     updateAccountStatus);
router.patch('/accounts/:id/balance',    adjustBalance);

// ── Transfer monitoring ───────────────────────────────────────────
router.get('/transfers',                 getAdminTransfers);

// ── Analytics ────────────────────────────────────────────────────
router.get('/analytics/overview',        getAnalyticsOverview);

// ── Support queue ─────────────────────────────────────────────────
router.get('/conversations',                      getConversations);
router.get('/conversations/:id/messages',         getConversationMessages);
router.post('/conversations/:id/message',         postAgentMessage);
router.patch('/conversations/:id/assign',         assignConversation);
router.patch('/conversations/:id/close',          closeConversation);

// ── Fraud review ──────────────────────────────────────────────────
router.get('/fraud/pending',              getPendingFraud);
router.get('/fraud/history',             getFraudHistory);
router.get('/fraud/stats',                getFraudStats);
router.post('/fraud/:id/approve',         approveFraud);
router.post('/fraud/:id/reject',          rejectFraud);
router.post('/fraud/:id/freeze-account',  freezeAccountForFraud);

// ── Wire transfer review ──────────────────────────────────────────
router.get('/wire-transfers/pending',       getPendingWires);
router.get('/wire-transfers',               getWireHistory);
router.post('/wire-transfers/:id/approve',  approveWire);
router.post('/wire-transfers/:id/reject',   rejectWire);

export default router;

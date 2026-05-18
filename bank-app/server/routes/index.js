import { Router } from 'express';
import healthRouter          from './health.js';
import authRouter            from './auth.js';
import dashboardRouter       from './dashboard.js';
import transfersRouter       from './transfers.js';
import notificationsRouter   from './notifications.js';
import adminRouter           from './admin.js';
import supportRouter         from './support.js';
import wireRecipientsRouter  from './wireRecipients.js';
import wireTransfersRouter   from './wireTransfers.js';
import { requireDB }         from '../middleware/requireDB.js';

const router = Router();

// ── Active routes ─────────────────────────────────────────────────
// /health is intentionally BEFORE requireDB so it stays reachable
// even when the database is down.
router.use('/health',           healthRouter);

// All routes below require an active MongoDB connection.
// Returns 503 immediately instead of hanging 30 s.
router.use(requireDB);

router.use('/auth',             authRouter);
router.use('/dashboard',        dashboardRouter);
router.use('/transfers',        transfersRouter);
router.use('/notifications',    notificationsRouter);
router.use('/admin',            adminRouter);
router.use('/support',          supportRouter);
router.use('/wire-recipients',  wireRecipientsRouter);
router.use('/wire-transfers',   wireTransfersRouter);

// ── Future routes (uncomment as each feature is built) ───────────
// import authRouter          from './auth.js'; // done
// import usersRouter         from './users.js';
// import accountsRouter      from './accounts.js';
// import transactionsRouter  from './transactions.js';
// import billPayRouter       from './billPay.js';
// import wireTransfersRouter from './wireTransfers.js';
// import notificationsRouter from './notifications.js';
// import chatRouter          from './chat.js';

// router.use('/auth',           authRouter);
// router.use('/users',          usersRouter);
// router.use('/accounts',       accountsRouter);
// router.use('/transactions',   transactionsRouter);
// router.use('/bill-pay',       billPayRouter);
// router.use('/wire-transfers', wireTransfersRouter);
// router.use('/notifications',  notificationsRouter);
// router.use('/chat',           chatRouter);

export default router;

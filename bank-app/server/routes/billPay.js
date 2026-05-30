import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  requestBillPayOTP,
  addPayee,
  getPayees,
  getPayee,
  updatePayee,
  deactivatePayee,
  schedulePayment,
  getPayments,
  getUpcomingPayments,
  getPayment,
  cancelPayment,
} from '../controllers/billPayController.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(protect);

// Payees
router.post  ('/payees',      addPayee);
router.get   ('/payees',      getPayees);
router.get   ('/payees/:id',  getPayee);
router.patch ('/payees/:id',  updatePayee);
router.delete('/payees/:id',  deactivatePayee);

// Payments — static paths before /:id
router.post('/payments/request-otp',  authLimiter, requestBillPayOTP);
router.post('/payments',              schedulePayment);
router.get ('/payments/upcoming',     getUpcomingPayments);
router.get ('/payments',              getPayments);
router.get ('/payments/:id',          getPayment);
router.post('/payments/:id/cancel',   cancelPayment);

export default router;

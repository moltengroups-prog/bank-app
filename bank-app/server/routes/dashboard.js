import { Router } from 'express';
import { getAccounts, getTransactions, getFullAccountNumber } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// All dashboard routes require authentication
router.use(protect);

router.get('/accounts',            getAccounts);
router.get('/accounts/:id/number', getFullAccountNumber);
router.get('/transactions',        getTransactions);

export default router;

import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  getAccounts,
  getAccountTransactions,
  getPendingTransactions,
  getStatement,
  getStatementPDF,
  getAccountSummary,
  getAccountLedger,
} from '../controllers/accountController.js';

const router = Router();

router.use(protect);

router.get('/',                           getAccounts);
router.get('/:id/transactions',           getAccountTransactions);
router.get('/:id/transactions/pending',   getPendingTransactions);
router.get('/:id/statement/:period',      getStatement);
router.get('/:id/statement/:period/pdf',  getStatementPDF);
router.get('/:id/summary',                getAccountSummary);
router.get('/:id/ledger',                 getAccountLedger);

export default router;

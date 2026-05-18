import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { internalTransfer } from '../controllers/transferController.js';

const router = Router();

router.use(protect);

router.post('/internal', internalTransfer);

export default router;

import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { transferLimiter } from '../middleware/rateLimiter.js';
import { internalTransfer, crossUserTransfer } from '../controllers/transferController.js';

const router = Router();

router.use(protect);

router.post('/internal', transferLimiter, internalTransfer);
router.post('/external', transferLimiter, crossUserTransfer);

export default router;

import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { getActiveAlerts, getAlertById } from '../controllers/securityAlertController.js';

const router = Router();
router.use(protect);

router.get('/active', getActiveAlerts);
router.get('/:id',    getAlertById);

export default router;

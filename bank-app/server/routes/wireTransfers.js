import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { wireLimiter, authLimiter } from '../middleware/rateLimiter.js';
import {
  requestWireOTP,
  submitWire,
  listWires,
  getWire,
} from '../controllers/wireTransferController.js';

const router = Router();

router.use(protect);

router.post('/request-otp', authLimiter, requestWireOTP);
router.post('/',            wireLimiter, submitWire);
router.get('/',             listWires);
router.get('/:id',          getWire);

export default router;

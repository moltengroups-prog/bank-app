import { Router } from 'express';
import { adminLogin, adminVerifyPin } from '../controllers/adminAuthController.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/login',      authLimiter, adminLogin);
router.post('/verify-pin', authLimiter, adminVerifyPin);

export default router;

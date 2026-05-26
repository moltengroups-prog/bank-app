import { Router } from 'express';
import { register, login, getMe, logout, verifyOTP, resendOTP } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register',    authLimiter, register);
router.post('/login',       authLimiter, login);
router.post('/otp/verify',  authLimiter, verifyOTP);
router.post('/otp/resend',  authLimiter, resendOTP);
router.get('/me',           protect, getMe);
router.post('/logout',      protect, logout);

export default router;

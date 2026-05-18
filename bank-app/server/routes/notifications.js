import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  getNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
} from '../controllers/notificationController.js';

const router = Router();

router.use(protect);

router.get('/',             getNotifications);
router.get('/unread-count', getUnreadCount);

// /read-all MUST be registered before /:id/read to avoid Express treating
// the literal string "read-all" as a dynamic :id segment.
router.patch('/read-all',   markAllRead);
router.patch('/:id/read',   markRead);

export default router;

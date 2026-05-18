import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  startConversation,
  addMessage,
  getMyConversations,
  getConversationMessages,
} from '../controllers/supportController.js';

const router = Router();

router.use(protect);

router.post('/conversations',                    startConversation);
router.get('/conversations',                     getMyConversations);
router.get('/conversations/:id/messages',        getConversationMessages);
router.post('/conversations/:id/message',        addMessage);

export default router;

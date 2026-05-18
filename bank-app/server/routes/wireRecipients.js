import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  createRecipient,
  getRecipients,
  getRecipientById,
  updateRecipient,
  deleteRecipient,
} from '../controllers/wireRecipientController.js';

const router = Router();

router.use(protect);

router.post('/',    createRecipient);
router.get('/',     getRecipients);
router.get('/:id',  getRecipientById);
router.patch('/:id', updateRecipient);
router.delete('/:id', deleteRecipient);

export default router;

import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  submitWire,
  listWires,
  getWire,
} from '../controllers/wireTransferController.js';

const router = Router();

router.use(protect);

router.post('/',    submitWire);
router.get('/',     listWires);
router.get('/:id',  getWire);

export default router;

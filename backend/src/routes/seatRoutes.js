import { Router } from 'express';
import { listSeats } from '../controllers/seatController.js';

const router = Router();
router.get('/', listSeats);
export default router;

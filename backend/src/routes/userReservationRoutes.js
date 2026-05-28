import { Router } from 'express';
import { myReservations } from '../controllers/reservationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticate, myReservations);

export default router;

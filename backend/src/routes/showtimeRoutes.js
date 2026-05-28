import { Router } from 'express';
import { addShowtime, deleteShowtime, editShowtime, listShowtimes } from '../controllers/showController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', listShowtimes);
router.post('/', authenticate, authorize('admin'), addShowtime);
router.put('/:id', authenticate, authorize('admin'), editShowtime);
router.delete('/:id', authenticate, authorize('admin'), deleteShowtime);

export default router;

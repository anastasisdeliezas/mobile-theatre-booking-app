import { Router } from 'express';
import { addTheatre, deleteTheatre, editTheatre, listTheatres } from '../controllers/theatreController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = Router();
router.get('/', listTheatres);
router.post('/', authenticate, authorize('admin'), addTheatre);
router.put('/:id', authenticate, authorize('admin'), editTheatre);
router.delete('/:id', authenticate, authorize('admin'), deleteTheatre);
export default router;

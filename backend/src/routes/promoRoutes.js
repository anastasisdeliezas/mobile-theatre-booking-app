import { Router } from 'express';
import {
  createPromo,
  listPromos,
  removePromo,
  updatePromo,
  validatePromo
} from '../controllers/promoController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/validate', authenticate, validatePromo);

router.get('/', authenticate, authorize('admin'), listPromos);
router.post('/', authenticate, authorize('admin'), createPromo);
router.put('/:id', authenticate, authorize('admin'), updatePromo);
router.delete('/:id', authenticate, authorize('admin'), removePromo);

export default router;
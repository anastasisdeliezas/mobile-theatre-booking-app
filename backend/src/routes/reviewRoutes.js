import { Router } from 'express';
import {
  addShowReview,
  deleteOwnReview,
  listShowReviews,
  updateOwnReview
} from '../controllers/reviewController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/show/:showId', listShowReviews);
router.post('/show/:showId', authenticate, addShowReview);
router.put('/:reviewId', authenticate, updateOwnReview);
router.delete('/:reviewId', authenticate, deleteOwnReview);

export default router;

import { Router } from 'express';
import {
  createUser,
  deleteNewsletterSubscriber,
  deleteReview,
  deleteUser,
  listNewsletterSubscribers,
  listReservations,
  listReviews,
  listUsers,
  stats,
  updateNewsletterSubscriber,
  updateReview,
  updateUser,
  userReservations
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/stats', authenticate, authorize('admin'), stats);

router.get('/reservations', authenticate, authorize('admin'), listReservations);

router.get('/users', authenticate, authorize('admin'), listUsers);
router.post('/users', authenticate, authorize('admin'), createUser);
router.put('/users/:id', authenticate, authorize('admin'), updateUser);
router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);
router.get('/users/:id/reservations', authenticate, authorize('admin'), userReservations);

router.get('/newsletter', authenticate, authorize('admin'), listNewsletterSubscribers);
router.put('/newsletter/:id', authenticate, authorize('admin'), updateNewsletterSubscriber);
router.delete('/newsletter/:id', authenticate, authorize('admin'), deleteNewsletterSubscriber);

router.get('/reviews', authenticate, authorize('admin'), listReviews);
router.put('/reviews/:id', authenticate, authorize('admin'), updateReview);
router.delete('/reviews/:id', authenticate, authorize('admin'), deleteReview);

export default router;

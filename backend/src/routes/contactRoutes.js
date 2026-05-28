import { Router } from 'express';
import {
  changeMessageStatus,
  createAdminReply,
  createMessage,
  createUserReply,
  getAdminMessageThread,
  getUserMessageThread,
  listMessages,
  listUserMessages
} from '../controllers/contactController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { contactLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

router.post('/', contactLimiter, createMessage);

/* User app */
router.get('/user', authenticate, listUserMessages);
router.get('/user/messages', authenticate, listUserMessages);
router.get('/user/:id', authenticate, getUserMessageThread);
router.get('/user/:id/thread', authenticate, getUserMessageThread);
router.get('/user/:id/replies', authenticate, getUserMessageThread);
router.post('/user/:id/replies', authenticate, createUserReply);
router.post('/user/:id/reply', authenticate, createUserReply);

/* Admin panel */
router.get('/admin', authenticate, authorize('admin'), listMessages);
router.get('/admin/:id', authenticate, authorize('admin'), getAdminMessageThread);
router.get('/admin/:id/thread', authenticate, authorize('admin'), getAdminMessageThread);
router.get('/admin/:id/replies', authenticate, authorize('admin'), getAdminMessageThread);
router.post('/admin/:id/replies', authenticate, authorize('admin'), createAdminReply);
router.post('/admin/:id/reply', authenticate, authorize('admin'), createAdminReply);
router.patch('/admin/:id/status', authenticate, authorize('admin'), changeMessageStatus);

export default router;
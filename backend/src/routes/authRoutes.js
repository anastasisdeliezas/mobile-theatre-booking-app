import { Router } from 'express';
import {
  login,
  logout,
  me,
  profile,
  refresh,
  register,
  update,
  updatePassword
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authLimiter, uploadLimiter } from '../middleware/rateLimitMiddleware.js';
import { imageUpload, uploadImageForUser } from '../controllers/uploadController.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.get('/profile', authenticate, profile);
router.put('/profile', authenticate, update);
router.put('/password', authenticate, updatePassword);
router.post('/upload', uploadLimiter, authenticate, imageUpload.single('image'), uploadImageForUser);

export default router;

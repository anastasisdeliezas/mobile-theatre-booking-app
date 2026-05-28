import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { uploadLimiter } from '../middleware/rateLimitMiddleware.js';
import { imageUpload, uploadImageForUser } from '../controllers/uploadController.js';

const router = Router();

router.post(
  '/image',
  uploadLimiter,
  authenticate,
  imageUpload.single('image'),
  uploadImageForUser
);

router.post(
  '/admin-image',
  uploadLimiter,
  authenticate,
  authorize('admin'),
  imageUpload.single('image'),
  uploadImageForUser
);

export default router;
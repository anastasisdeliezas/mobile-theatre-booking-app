import { Router } from 'express';
import {
  cancel,
  confirmModification,
  downloadReceiptPdf,
  modify,
  myReservations,
  previewModification,
  reserve,
  resendReceipt,
  verifyTicket
} from '../controllers/reservationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/ticket/verify/:token', verifyTicket);

router.post('/', authenticate, reserve);
router.get('/user/reservations', authenticate, myReservations);
router.get('/:id/receipt-pdf', authenticate, downloadReceiptPdf);
router.post('/:id/modification-preview', authenticate, previewModification);
router.post('/:id/modification-confirm', authenticate, confirmModification);
router.patch('/:id', authenticate, modify);
router.patch('/:id/cancel', authenticate, cancel);
router.post('/:id/resend-receipt', authenticate, resendReceipt);

export default router;

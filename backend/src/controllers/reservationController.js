import { z } from 'zod';
import {
  cancelReservation,
  confirmReservationModification,
  createReservation,
  getTicketVerificationByToken,
  getUserReservations,
  previewReservationModification,
  updateReservation
} from '../services/reservationService.js';
import {
  generateReservationReceiptPdf,
  sendReservationReceipt
} from '../services/receiptService.js';

const reserveSchema = z.object({
  showtime_id: z.coerce.number().int().positive(),
  seat_ids: z.array(z.coerce.number().int().positive()).min(1),
  payment_method: z.string().trim().max(50).optional(),
  card_last4: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'Το card_last4 πρέπει να έχει 4 ψηφία.')
    .optional(),
  promo_code: z.string().trim().max(80).optional(),
  discount_amount: z.coerce.number().min(0).optional(),
  final_price: z.coerce.number().min(0).optional()
});

const updateSchema = z.object({
  showtime_id: z.coerce.number().int().positive().optional(),
  seat_ids: z.array(z.coerce.number().int().positive()).min(1),
  promo_code: z.string().trim().max(80).optional(),
  discount_amount: z.coerce.number().optional(),
  final_price: z.coerce.number().min(0).optional(),
  payment_method: z.string().trim().max(50).optional(),
  card_last4: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'Το card_last4 πρέπει να έχει 4 ψηφία.')
    .optional()
});

const idSchema = z.coerce.number().int().positive();
const ticketTokenSchema = z.string().trim().min(6).max(255);

export async function reserve(req, res, next) {
  try {
    const data = reserveSchema.parse(req.body);

    const result = await createReservation({
      userId: req.user.userId,
      showtime_id: data.showtime_id,
      seat_ids: data.seat_ids,
      payment_method: data.payment_method || null,
      card_last4: data.card_last4 || null,
      promo_code: data.promo_code || null,
      discount_amount: data.discount_amount ?? 0,
      final_price: data.final_price ?? null
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function myReservations(req, res, next) {
  try {
    res.json(await getUserReservations(req.user.userId));
  } catch (error) {
    next(error);
  }
}

export async function previewModification(req, res, next) {
  try {
    const reservationId = idSchema.parse(req.params.id);
    const data = updateSchema.parse(req.body);

    res.json(
      await previewReservationModification({
        reservationId,
        userId: req.user.userId,
        isAdmin: req.user.role === 'admin',
        showtime_id: data.showtime_id,
        seat_ids: data.seat_ids,
        promo_code: data.promo_code ?? null,
        discount_amount: data.discount_amount ?? 0,
        final_price: data.final_price ?? null
      })
    );
  } catch (error) {
    next(error);
  }
}

export async function confirmModification(req, res, next) {
  try {
    const reservationId = idSchema.parse(req.params.id);
    const data = updateSchema.parse(req.body);

    res.json(
      await confirmReservationModification({
        reservationId,
        userId: req.user.userId,
        isAdmin: req.user.role === 'admin',
        showtime_id: data.showtime_id,
        seat_ids: data.seat_ids,
        promo_code: data.promo_code ?? null,
        discount_amount: data.discount_amount ?? 0,
        final_price: data.final_price ?? null,
        payment_method: data.payment_method ?? null,
        card_last4: data.card_last4 ?? null
      })
    );
  } catch (error) {
    next(error);
  }
}

export async function modify(req, res, next) {
  try {
    const reservationId = idSchema.parse(req.params.id);
    const data = updateSchema.parse(req.body);

    res.json(
      await updateReservation({
        reservationId,
        userId: req.user.userId,
        isAdmin: req.user.role === 'admin',
        showtime_id: data.showtime_id,
        seat_ids: data.seat_ids,
        promo_code: data.promo_code ?? null,
        discount_amount: data.discount_amount ?? 0,
        final_price: data.final_price ?? null,
        payment_method: data.payment_method ?? null,
        card_last4: data.card_last4 ?? null
      })
    );
  } catch (error) {
    next(error);
  }
}

export async function cancel(req, res, next) {
  try {
    const reservationId = idSchema.parse(req.params.id);

    res.json(
      await cancelReservation({
        reservationId,
        userId: req.user.userId,
        isAdmin: req.user.role === 'admin'
      })
    );
  } catch (error) {
    next(error);
  }
}

export async function resendReceipt(req, res, next) {
  try {
    const reservationId = idSchema.parse(req.params.id);

    res.json(
      await sendReservationReceipt(
        reservationId,
        req.user.role === 'admin' ? null : req.user.userId
      )
    );
  } catch (error) {
    next(error);
  }
}

export async function downloadReceiptPdf(req, res, next) {
  try {
    const reservationId = idSchema.parse(req.params.id);

    const { filename, buffer } = await generateReservationReceiptPdf(
      reservationId,
      req.user.role === 'admin' ? null : req.user.userId
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

export async function verifyTicket(req, res, next) {
  try {
    const token = ticketTokenSchema.parse(req.params.token);
    res.json(await getTicketVerificationByToken(token));
  } catch (error) {
    next(error);
  }
}

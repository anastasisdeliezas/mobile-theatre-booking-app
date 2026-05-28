import { z } from 'zod';
import {
  createPromoCode,
  deletePromoCode,
  getPromoCodes,
  updatePromoCode,
  validatePromoCode
} from '../services/promoService.js';

const promoSchema = z.object({
  code: z.string().min(2).max(80),
  title: z.string().min(2).max(160),
  description: z.string().max(2000).optional().or(z.literal('')),
  discount_type: z.enum(['percent', 'fixed']),
  discount_value: z.coerce.number().min(0),
  is_active: z.coerce.boolean()
});

const validateSchema = z.object({
  code: z.string().trim().min(2).max(80),
  base_amount: z.coerce.number().min(0)
});

export async function listPromos(req, res, next) {
  try {
    res.json(
      await getPromoCodes({
        q: req.query.q || '',
        status: req.query.status || 'all'
      })
    );
  } catch (error) {
    next(error);
  }
}

export async function createPromo(req, res, next) {
  try {
    const data = promoSchema.parse(req.body);
    res.status(201).json(await createPromoCode(data));
  } catch (error) {
    next(error);
  }
}

export async function updatePromo(req, res, next) {
  try {
    const data = promoSchema.parse(req.body);
    res.json(await updatePromoCode(Number(req.params.id), data));
  } catch (error) {
    next(error);
  }
}

export async function removePromo(req, res, next) {
  try {
    res.json(await deletePromoCode(Number(req.params.id)));
  } catch (error) {
    next(error);
  }
}

export async function validatePromo(req, res, next) {
  try {
    const data = validateSchema.parse(req.body);
    res.json(
      await validatePromoCode({
        code: data.code,
        baseAmount: data.base_amount
      })
    );
  } catch (error) {
    next(error);
  }
}
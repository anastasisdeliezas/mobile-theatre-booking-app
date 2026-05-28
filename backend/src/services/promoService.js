import { pool } from '../config/db.js';

export async function getPromoCodes(filters = {}) {
  const { q = '', status = 'all' } = filters;

  const clauses = [];
  const params = [];

  if (q) {
    clauses.push(`(code LIKE ? OR title LIKE ? OR COALESCE(description, '') LIKE ?)`);
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  if (status === 'active') {
    clauses.push(`is_active = 1`);
  }

  if (status === 'inactive') {
    clauses.push(`is_active = 0`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `
      SELECT *
      FROM promo_codes
      ${where}
      ORDER BY created_at DESC, promo_id DESC
    `,
    params
  );

  return rows;
}

export async function createPromoCode(payload) {
  const {
    code,
    title,
    description,
    discount_type,
    discount_value,
    is_active
  } = payload;

  const [result] = await pool.query(
    `
      INSERT INTO promo_codes
      (code, title, description, discount_type, discount_value, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      code.trim().toUpperCase(),
      title,
      description || null,
      discount_type,
      Number(discount_value),
      is_active ? 1 : 0
    ]
  );

  const [rows] = await pool.query(
    `SELECT * FROM promo_codes WHERE promo_id = ?`,
    [result.insertId]
  );

  return rows[0];
}

export async function updatePromoCode(promoId, payload) {
  const {
    code,
    title,
    description,
    discount_type,
    discount_value,
    is_active
  } = payload;

  await pool.query(
    `
      UPDATE promo_codes
      SET code = ?,
          title = ?,
          description = ?,
          discount_type = ?,
          discount_value = ?,
          is_active = ?
      WHERE promo_id = ?
    `,
    [
      code.trim().toUpperCase(),
      title,
      description || null,
      discount_type,
      Number(discount_value),
      is_active ? 1 : 0,
      promoId
    ]
  );

  const [rows] = await pool.query(
    `SELECT * FROM promo_codes WHERE promo_id = ?`,
    [promoId]
  );

  return rows[0];
}

export async function deletePromoCode(promoId) {
  await pool.query(`DELETE FROM promo_codes WHERE promo_id = ?`, [promoId]);
  return { success: true };
}

export async function getActivePromoByCode(code) {
  if (!code?.trim()) return null;

  const [rows] = await pool.query(
    `
      SELECT *
      FROM promo_codes
      WHERE code = ?
        AND is_active = 1
      LIMIT 1
    `,
    [code.trim().toUpperCase()]
  );

  return rows[0] || null;
}

export function calculatePromoDiscount(baseAmount, promo) {
  const amount = Number(baseAmount || 0);

  if (!promo || amount <= 0) {
    return {
      discount_amount: 0,
      final_price: amount
    };
  }

  let discount = 0;

  if (promo.discount_type === 'percent') {
    discount = (amount * Number(promo.discount_value || 0)) / 100;
  } else if (promo.discount_type === 'fixed') {
    discount = Number(promo.discount_value || 0);
  }

  discount = Math.max(0, discount);
  discount = Math.min(amount, discount);

  const finalPrice = Math.max(0, amount - discount);

  return {
    discount_amount: Number(discount.toFixed(2)),
    final_price: Number(finalPrice.toFixed(2))
  };
}

export async function validatePromoCode({ code, baseAmount }) {
  const promo = await getActivePromoByCode(code);

  if (!promo) {
    const error = new Error('Το promo code δεν είναι έγκυρο ή δεν είναι ενεργό.');
    error.status = 404;
    throw error;
  }

  const totals = calculatePromoDiscount(baseAmount, promo);

  return {
    valid: true,
    promo: {
      promo_id: promo.promo_id,
      code: promo.code,
      title: promo.title,
      description: promo.description,
      discount_type: promo.discount_type,
      discount_value: Number(promo.discount_value || 0)
    },
    ...totals
  };
}
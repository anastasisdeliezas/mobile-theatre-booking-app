import { pool } from '../config/db.js';

export async function createNewsletterSubscription({ email, source = 'mobile_app' }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    const error = new Error('Το email είναι υποχρεωτικό.');
    error.status = 400;
    throw error;
  }

  const [existingRows] = await pool.query(
    `
      SELECT subscriber_id, email, status
      FROM newsletter_subscribers
      WHERE email = ?
      LIMIT 1
    `,
    [normalizedEmail]
  );

  const existing = existingRows[0];

  if (existing) {
    if (existing.status === 'active') {
      return {
        success: true,
        already_exists: true,
        message: 'Το email είναι ήδη εγγεγραμμένο στο newsletter.'
      };
    }

    await pool.query(
      `
        UPDATE newsletter_subscribers
        SET status = 'active',
            source = ?,
            unsubscribed_at = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE subscriber_id = ?
      `,
      [source, existing.subscriber_id]
    );

    return {
      success: true,
      reactivated: true,
      message: 'Η εγγραφή στο newsletter ενεργοποιήθηκε ξανά.'
    };
  }

  const [result] = await pool.query(
    `
      INSERT INTO newsletter_subscribers (email, source, status)
      VALUES (?, ?, 'active')
    `,
    [normalizedEmail, source]
  );

  return {
    success: true,
    subscriber_id: result.insertId,
    message: 'Η εγγραφή στο newsletter ολοκληρώθηκε επιτυχώς.'
  };
}

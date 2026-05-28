import { pool } from '../config/db.js';

function resolveAuthUserId(user) {
  const candidate =
    user?.user_id ??
    user?.userId ??
    user?.id ??
    user?.sub ??
    null;

  const numeric = Number(candidate);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function isAdmin(user) {
  return String(user?.role || '').toLowerCase() === 'admin';
}

async function getExistingReview(showId, userId) {
  const [rows] = await pool.query(
    `
      SELECT *
      FROM show_reviews
      WHERE show_id = ?
        AND user_id = ?
      LIMIT 1
    `,
    [showId, userId]
  );

  return rows[0] || null;
}

async function hasConfirmedReservationForShow(showId, userId) {
  const [rows] = await pool.query(
    `
      SELECT r.reservation_id
      FROM reservations r
      JOIN showtimes st ON st.showtime_id = r.showtime_id
      WHERE r.user_id = ?
        AND st.show_id = ?
        AND r.status = 'confirmed'
      LIMIT 1
    `,
    [userId, showId]
  );

  return Boolean(rows.length);
}

async function getReviewById(reviewId) {
  const [rows] = await pool.query(
    `
      SELECT *
      FROM show_reviews
      WHERE review_id = ?
      LIMIT 1
    `,
    [reviewId]
  );

  return rows[0] || null;
}

async function getReviewOutput(reviewId) {
  const [rows] = await pool.query(
    `
      SELECT
        r.review_id,
        r.show_id,
        r.user_id,
        r.reviewer_name,
        r.reviewer_email,
        r.rating,
        r.title,
        r.comment,
        r.status,
        r.created_at,
        COALESCE(u.name, r.reviewer_name, 'Χρήστης') AS display_name
      FROM show_reviews r
      LEFT JOIN users u ON u.user_id = r.user_id
      WHERE r.review_id = ?
      LIMIT 1
    `,
    [reviewId]
  );

  return rows[0] || null;
}

export async function getShowReviews(showId) {
  const [reviews] = await pool.query(
    `
      SELECT
        r.review_id,
        r.show_id,
        r.user_id,
        r.reviewer_name,
        r.reviewer_email,
        r.rating,
        r.title,
        r.comment,
        r.status,
        r.created_at,
        COALESCE(u.name, r.reviewer_name, 'Χρήστης') AS display_name
      FROM show_reviews r
      LEFT JOIN users u ON u.user_id = r.user_id
      WHERE r.show_id = ?
        AND r.status = 'approved'
      ORDER BY r.created_at DESC, r.review_id DESC
    `,
    [showId]
  );

  const [[summary]] = await pool.query(
    `
      SELECT
        COUNT(*) AS total_reviews,
        COALESCE(ROUND(AVG(rating), 1), 0) AS average_rating
      FROM show_reviews
      WHERE show_id = ?
        AND status = 'approved'
    `,
    [showId]
  );

  return {
    reviews,
    summary: {
      total_reviews: Number(summary?.total_reviews || 0),
      average_rating: Number(summary?.average_rating || 0)
    }
  };
}

export async function createShowReview(showId, user, payload = {}) {
  const authUserId = resolveAuthUserId(user);
  const rating = Number(payload.rating || 0);
  const title = String(payload.title || '').trim() || null;
  const comment = String(payload.comment || '').trim();

  if (!showId) {
    const error = new Error('Μη έγκυρο show id.');
    error.status = 400;
    throw error;
  }

  if (!authUserId) {
    const error = new Error('Πρέπει να είσαι συνδεδεμένος για να αφήσεις κριτική.');
    error.status = 401;
    throw error;
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    const error = new Error('Η βαθμολογία πρέπει να είναι από 1 έως 5.');
    error.status = 400;
    throw error;
  }

  if (!comment || comment.length < 10) {
    const error = new Error('Η κριτική πρέπει να έχει τουλάχιστον 10 χαρακτήρες.');
    error.status = 400;
    throw error;
  }

  const [showRows] = await pool.query(
    'SELECT show_id FROM shows WHERE show_id = ? LIMIT 1',
    [showId]
  );

  if (!showRows.length) {
    const error = new Error('Η παράσταση δεν βρέθηκε.');
    error.status = 404;
    throw error;
  }

  const [userRows] = await pool.query(
    `
      SELECT user_id, name, email
      FROM users
      WHERE user_id = ?
      LIMIT 1
    `,
    [authUserId]
  );

  if (!userRows.length) {
    const error = new Error('Ο λογαριασμός χρήστη δεν βρέθηκε.');
    error.status = 404;
    throw error;
  }

  const allowed = await hasConfirmedReservationForShow(showId, authUserId);
  if (!allowed) {
    const error = new Error(
      'Μπορείς να αφήσεις κριτική μόνο αν έχεις ολοκληρωμένη κράτηση για αυτή την παράσταση.'
    );
    error.status = 403;
    throw error;
  }

  const existing = await getExistingReview(showId, authUserId);
  if (existing) {
    const error = new Error(
      'Έχεις ήδη αφήσει κριτική για αυτή την παράσταση. Μπορείς να την επεξεργαστείς.'
    );
    error.status = 409;
    throw error;
  }

  const dbUser = userRows[0];

  const reviewerName =
    String(dbUser.name || user?.name || '').trim() ||
    String(dbUser.email || user?.email || '').trim() ||
    'Χρήστης';

  const reviewerEmail =
    String(dbUser.email || user?.email || '').trim() || null;

  const [result] = await pool.query(
    `
      INSERT INTO show_reviews
      (
        show_id,
        user_id,
        reviewer_name,
        reviewer_email,
        rating,
        title,
        comment,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')
    `,
    [
      showId,
      authUserId,
      reviewerName,
      reviewerEmail,
      rating,
      title,
      comment
    ]
  );

  return getReviewOutput(result.insertId);
}

export async function updateShowReview(reviewId, user, payload = {}) {
  const authUserId = resolveAuthUserId(user);
  const rating = Number(payload.rating || 0);
  const title = String(payload.title || '').trim() || null;
  const comment = String(payload.comment || '').trim();

  if (!authUserId) {
    const error = new Error('Πρέπει να είσαι συνδεδεμένος.');
    error.status = 401;
    throw error;
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    const error = new Error('Η βαθμολογία πρέπει να είναι από 1 έως 5.');
    error.status = 400;
    throw error;
  }

  if (!comment || comment.length < 10) {
    const error = new Error('Η κριτική πρέπει να έχει τουλάχιστον 10 χαρακτήρες.');
    error.status = 400;
    throw error;
  }

  const review = await getReviewById(reviewId);
  if (!review) {
    const error = new Error('Η κριτική δεν βρέθηκε.');
    error.status = 404;
    throw error;
  }

  if (!isAdmin(user) && Number(review.user_id) !== Number(authUserId)) {
    const error = new Error('Δεν επιτρέπεται η επεξεργασία αυτής της κριτικής.');
    error.status = 403;
    throw error;
  }

  await pool.query(
    `
      UPDATE show_reviews
      SET rating = ?,
          title = ?,
          comment = ?,
          status = 'approved'
      WHERE review_id = ?
    `,
    [rating, title, comment, reviewId]
  );

  return getReviewOutput(reviewId);
}

export async function deleteShowReview(reviewId, user) {
  const authUserId = resolveAuthUserId(user);

  if (!authUserId) {
    const error = new Error('Πρέπει να είσαι συνδεδεμένος.');
    error.status = 401;
    throw error;
  }

  const review = await getReviewById(reviewId);
  if (!review) {
    const error = new Error('Η κριτική δεν βρέθηκε.');
    error.status = 404;
    throw error;
  }

  if (!isAdmin(user) && Number(review.user_id) !== Number(authUserId)) {
    const error = new Error('Δεν επιτρέπεται η διαγραφή αυτής της κριτικής.');
    error.status = 403;
    throw error;
  }

  await pool.query('DELETE FROM show_reviews WHERE review_id = ?', [reviewId]);

  return { success: true };
}

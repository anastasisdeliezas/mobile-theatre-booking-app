import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

const EMAIL_REGEX = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/i;
const LETTERS_AND_SPACES_REGEX = /^[\p{L} ]+$/u;
const GREEK_MOBILE_REGEX = /^69\d{8}$/;

function assertSafeName(name) {
  if (!name || name.length < 2 || !LETTERS_AND_SPACES_REGEX.test(name)) {
    const error = new Error('Το ονοματεπώνυμο πρέπει να περιέχει μόνο γράμματα, χωρίς αριθμούς ή σύμβολα.');
    error.status = 400;
    throw error;
  }
}

function assertSafeEmail(email) {
  if (!EMAIL_REGEX.test(email)) {
    const error = new Error('Συμπλήρωσε έγκυρο email.');
    error.status = 400;
    throw error;
  }
}

function assertStrongPassword(password, required = true) {
  if (!password && !required) return;
  if (
    !password ||
    password.length < 8 ||
    password.length > 100 ||
    /\s/.test(password) ||
    !/[A-ZΑ-Ω]/.test(password) ||
    !/[a-zα-ω]/.test(password) ||
    !/\d/.test(password)
  ) {
    const error = new Error('Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες, κεφαλαίο, μικρό γράμμα και αριθμό.');
    error.status = 400;
    throw error;
  }
}

function assertOptionalPhone(phone) {
  if (!phone) return;
  if (!/^\d+$/.test(phone) || phone.length !== 10 || !GREEK_MOBILE_REGEX.test(phone)) {
    const error = new Error('Το κινητό πρέπει να έχει ακριβώς 10 ψηφία, μόνο αριθμούς και μορφή 69xxxxxxxx.');
    error.status = 400;
    throw error;
  }
}

function assertOptionalUrl(url) {
  if (!url) return;
  if (url.startsWith('/uploads/')) return;
  try {
    const parsed = new URL(url);
    if (['http:', 'https:'].includes(parsed.protocol)) return;
  } catch {}

  const error = new Error('Το URL εικόνας πρέπει να είναι έγκυρο http/https ή αρχείο uploads.');
  error.status = 400;
  throw error;
}


async function hasColumn(table, column) {
  const [rows] = await pool.query(
    `
      SELECT COUNT(*) AS count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
    `,
    [table, column]
  );

  return Boolean(rows[0]?.count);
}

export async function getAdminStats() {
  const [[theatres]] = await pool.query('SELECT COUNT(*) AS total FROM theatres');
  const [[shows]] = await pool.query('SELECT COUNT(*) AS total FROM shows');
  const [[showtimes]] = await pool.query('SELECT COUNT(*) AS total FROM showtimes');
  const [[users]] = await pool.query('SELECT COUNT(*) AS total FROM users');
  const [[activePromos]] = await pool.query(
    'SELECT COUNT(*) AS total FROM promo_codes WHERE is_active = 1'
  );
  const [[newsletterSubscribers]] = await pool.query(
    "SELECT COUNT(*) AS total FROM newsletter_subscribers WHERE status = 'active'"
  );
  const [[reviewsCount]] = await pool.query(
    "SELECT COUNT(*) AS total FROM show_reviews WHERE status = 'approved'"
  );

  const messageStatusExists = await hasColumn('contact_messages', 'status');
  let unreadMessages = 0;

  if (messageStatusExists) {
    const [[messages]] = await pool.query(
      "SELECT COUNT(*) AS total FROM contact_messages WHERE status = 'new'"
    );
    unreadMessages = Number(messages.total || 0);
  } else {
    const [[messages]] = await pool.query(
      'SELECT COUNT(*) AS total FROM contact_messages'
    );
    unreadMessages = Number(messages.total || 0);
  }

  const reservationStatusExists = await hasColumn('reservations', 'status');
  const reservationCreatedAtExists = await hasColumn('reservations', 'created_at');

  const revenueColumn =
    (await hasColumn('reservations', 'final_price')) ? 'final_price'
      : (await hasColumn('reservations', 'total_price')) ? 'total_price'
      : (await hasColumn('reservations', 'total_amount')) ? 'total_amount'
      : (await hasColumn('reservations', 'amount_paid')) ? 'amount_paid'
      : null;

  const revenueExpression = revenueColumn ? `r.${revenueColumn}` : '0';

  let confirmedReservations = 0;
  let cancelledReservations = 0;
  let pendingReservations = 0;
  let totalRevenue = 0;

  if (reservationStatusExists) {
    const [[confirmed]] = await pool.query(
      `SELECT COUNT(*) AS total FROM reservations WHERE status = 'confirmed'`
    );
    const [[cancelled]] = await pool.query(
      `SELECT COUNT(*) AS total FROM reservations WHERE status = 'cancelled'`
    );
    const [[pending]] = await pool.query(
      `SELECT COUNT(*) AS total FROM reservations WHERE status = 'pending'`
    );

    confirmedReservations = Number(confirmed.total || 0);
    cancelledReservations = Number(cancelled.total || 0);
    pendingReservations = Number(pending.total || 0);
  } else {
    const [[allReservations]] = await pool.query(
      `SELECT COUNT(*) AS total FROM reservations`
    );
    confirmedReservations = Number(allReservations.total || 0);
  }

  if (revenueColumn) {
    const revenueWhere = reservationStatusExists
      ? `WHERE status = 'confirmed'`
      : '';

    const [[revenue]] = await pool.query(
      `SELECT COALESCE(SUM(${revenueColumn}), 0) AS total FROM reservations ${revenueWhere}`
    );

    totalRevenue = Number(revenue.total || 0);
  }

  const [[seatCapacityRow]] = await pool.query(
    'SELECT COUNT(*) AS total FROM seats'
  );
  const seatCapacityPerShowtime = Number(seatCapacityRow.total || 0);

  const [[soldSeatsRow]] = await pool.query(
    `
      SELECT COUNT(rs.reservation_seat_id) AS total
      FROM reservation_seats rs
      JOIN reservations r ON r.reservation_id = rs.reservation_id
      ${reservationStatusExists ? "WHERE r.status = 'confirmed'" : ''}
    `
  );

  const soldSeats = Number(soldSeatsRow.total || 0);
  const potentialSeats = seatCapacityPerShowtime * Number(showtimes.total || 0);
  const occupancyRate = potentialSeats > 0
    ? Math.round((soldSeats / potentialSeats) * 100)
    : 0;

  const [popularShows] = await pool.query(
    `
      SELECT
        sh.title,
        COUNT(rs.reservation_seat_id) AS booked_seats
      FROM shows sh
      JOIN showtimes st ON st.show_id = sh.show_id
      LEFT JOIN reservations r ON r.showtime_id = st.showtime_id
      LEFT JOIN reservation_seats rs
        ON rs.reservation_id = r.reservation_id
        ${reservationStatusExists ? "AND r.status = 'confirmed'" : ''}
      GROUP BY sh.show_id, sh.title
      ORDER BY booked_seats DESC, sh.title ASC
      LIMIT 5
    `
  );

  const recentReservationsQuery = reservationCreatedAtExists
    ? `
        SELECT
          r.reservation_id,
          r.status,
          r.created_at,
          u.name AS customer_name,
          u.email AS customer_email,
          sh.title AS show_title
        FROM reservations r
        LEFT JOIN users u ON u.user_id = r.user_id
        LEFT JOIN showtimes st ON st.showtime_id = r.showtime_id
        LEFT JOIN shows sh ON sh.show_id = st.show_id
        ORDER BY r.created_at DESC, r.reservation_id DESC
        LIMIT 5
      `
    : `
        SELECT
          r.reservation_id,
          r.status,
          NULL AS created_at,
          u.name AS customer_name,
          u.email AS customer_email,
          sh.title AS show_title
        FROM reservations r
        LEFT JOIN users u ON u.user_id = r.user_id
        LEFT JOIN showtimes st ON st.showtime_id = r.showtime_id
        LEFT JOIN shows sh ON sh.show_id = st.show_id
        ORDER BY r.reservation_id DESC
        LIMIT 5
      `;

  const [recentReservations] = await pool.query(recentReservationsQuery);

  const [upcomingShowtimes] = await pool.query(
    `
      SELECT
        st.showtime_id,
        st.start_time,
        st.hall_name,
        st.base_price,
        sh.title,
        t.name AS theatre_name,
        COUNT(rs.reservation_seat_id) AS booked_seats
      FROM showtimes st
      JOIN shows sh ON sh.show_id = st.show_id
      JOIN theatres t ON t.theatre_id = sh.theatre_id
      LEFT JOIN reservations r ON r.showtime_id = st.showtime_id
      LEFT JOIN reservation_seats rs
        ON rs.reservation_id = r.reservation_id
        ${reservationStatusExists ? "AND r.status = 'confirmed'" : ''}
      WHERE st.start_time >= NOW()
      GROUP BY st.showtime_id, st.start_time, st.hall_name, st.base_price, sh.title, t.name
      ORDER BY st.start_time ASC
      LIMIT 6
    `
  );

  const [statusBreakdown] = await pool.query(
    reservationStatusExists
      ? `
          SELECT status, COUNT(*) AS total
          FROM reservations
          GROUP BY status
          ORDER BY total DESC, status ASC
        `
      : `
          SELECT 'confirmed' AS status, COUNT(*) AS total
          FROM reservations
        `
  );

  const [monthlyActivity] = await pool.query(
    reservationCreatedAtExists
      ? `
          SELECT
            DATE_FORMAT(r.created_at, '%Y-%m-01') AS month_key,
            COUNT(*) AS reservations,
            COALESCE(SUM(${revenueExpression}), 0) AS revenue
          FROM reservations r
          ${reservationStatusExists ? "WHERE r.status = 'confirmed'" : ''}
          GROUP BY DATE_FORMAT(r.created_at, '%Y-%m-01')
          ORDER BY month_key DESC
          LIMIT 6
        `
      : `SELECT NULL AS month_key, 0 AS reservations, 0 AS revenue LIMIT 0`
  );

  const [topTheatres] = await pool.query(
    `
      SELECT
        t.theatre_id,
        t.name,
        COUNT(DISTINCT r.reservation_id) AS reservations,
        COUNT(rs.reservation_seat_id) AS seats,
        COALESCE(SUM(${revenueExpression}), 0) AS revenue
      FROM theatres t
      LEFT JOIN shows sh ON sh.theatre_id = t.theatre_id
      LEFT JOIN showtimes st ON st.show_id = sh.show_id
      LEFT JOIN reservations r
        ON r.showtime_id = st.showtime_id
        ${reservationStatusExists ? "AND r.status = 'confirmed'" : ''}
      LEFT JOIN reservation_seats rs ON rs.reservation_id = r.reservation_id
      GROUP BY t.theatre_id, t.name
      ORDER BY revenue DESC, reservations DESC, t.name ASC
      LIMIT 5
    `
  );

  return {
    totals: {
      theatres: Number(theatres.total || 0),
      shows: Number(shows.total || 0),
      showtimes: Number(showtimes.total || 0),
      reservations: Number(confirmedReservations || 0),
      cancelledReservations: Number(cancelledReservations || 0),
      pendingReservations: Number(pendingReservations || 0),
      revenue: Number(totalRevenue || 0),
      users: Number(users.total || 0),
      activePromos: Number(activePromos.total || 0),
      unreadMessages,
      newsletterSubscribers: Number(newsletterSubscribers.total || 0),
      reviews: Number(reviewsCount.total || 0),
      seatCapacityPerShowtime,
      soldSeats,
      occupancyRate
    },
    popularShows,
    recentReservations,
    upcomingShowtimes,
    statusBreakdown,
    monthlyActivity: monthlyActivity.reverse(),
    topTheatres
  };
}

export async function getAdminReservations(filters = {}) {
  const { q = '', status = 'all', showId = 'all', date = '' } = filters;

  const clauses = [];
  const params = [];

  if (q) {
    clauses.push(
      `(u.name LIKE ? OR u.email LIKE ? OR r.booking_code LIKE ? OR sh.title LIKE ? OR th.name LIKE ?)`
    );
    const like = `%${q}%`;
    params.push(like, like, like, like, like);
  }

  if (status !== 'all') {
    clauses.push(`r.status = ?`);
    params.push(status);
  }

  if (showId !== 'all') {
    clauses.push(`sh.show_id = ?`);
    params.push(Number(showId));
  }

  if (date) {
    clauses.push(`DATE(st.start_time) = ?`);
    params.push(date);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `
      SELECT
        r.reservation_id,
        r.booking_code,
        r.status,
        r.created_at,
        r.payment_method,
        r.card_last4,
        r.discount_amount,
        r.final_price,
        u.user_id,
        u.name AS customer_name,
        u.email AS customer_email,
        st.showtime_id,
        st.start_time,
        st.hall_name,
        st.base_price,
        sh.show_id,
        sh.title AS show_title,
        th.name AS theatre_name,
        th.location,
        GROUP_CONCAT(
          CONCAT(se.row_label, se.seat_number)
          ORDER BY se.row_label, se.seat_number
          SEPARATOR ', '
        ) AS seats,
        GROUP_CONCAT(
          se.seat_id
          ORDER BY se.row_label, se.seat_number
          SEPARATOR ','
        ) AS seat_ids
      FROM reservations r
      JOIN users u ON u.user_id = r.user_id
      JOIN showtimes st ON st.showtime_id = r.showtime_id
      JOIN shows sh ON sh.show_id = st.show_id
      JOIN theatres th ON th.theatre_id = sh.theatre_id
      LEFT JOIN reservation_seats rs ON rs.reservation_id = r.reservation_id
      LEFT JOIN seats se ON se.seat_id = rs.seat_id
      ${where}
      GROUP BY
        r.reservation_id,
        r.booking_code,
        r.status,
        r.created_at,
        r.payment_method,
        r.card_last4,
        r.discount_amount,
        r.final_price,
        u.user_id,
        u.name,
        u.email,
        st.showtime_id,
        st.start_time,
        st.hall_name,
        st.base_price,
        sh.show_id,
        sh.title,
        th.name,
        th.location
      ORDER BY r.created_at DESC, r.reservation_id DESC
    `,
    params
  );

  return rows;
}

export async function getAdminUsers(filters = {}) {
  const { q = '', role = 'all' } = filters;

  const clauses = [];
  const params = [];

  if (q) {
    clauses.push(`(u.name LIKE ? OR u.email LIKE ? OR COALESCE(u.phone, '') LIKE ?)`);
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  if (role !== 'all') {
    clauses.push(`u.role = ?`);
    params.push(role);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `
      SELECT
        u.user_id,
        u.name,
        u.email,
        u.role,
        u.phone,
        u.avatar_url,
        u.bio,
        u.created_at,
        COUNT(r.reservation_id) AS reservations_count,
        MAX(r.created_at) AS last_reservation_at
      FROM users u
      LEFT JOIN reservations r ON r.user_id = u.user_id
      ${where}
      GROUP BY
        u.user_id,
        u.name,
        u.email,
        u.role,
        u.phone,
        u.avatar_url,
        u.bio,
        u.created_at
      ORDER BY u.created_at DESC, u.user_id DESC
    `,
    params
  );

  return rows;
}

export async function getAdminUserReservations(userId) {
  const [rows] = await pool.query(
    `
      SELECT
        r.reservation_id,
        r.booking_code,
        r.status,
        r.created_at,
        st.showtime_id,
        st.start_time,
        st.hall_name,
        st.base_price,
        sh.title AS show_title,
        th.name AS theatre_name,
        th.location,
        GROUP_CONCAT(
          CONCAT(se.row_label, se.seat_number)
          ORDER BY se.row_label, se.seat_number
          SEPARATOR ', '
        ) AS seats,
        GROUP_CONCAT(
          se.seat_id
          ORDER BY se.row_label, se.seat_number
          SEPARATOR ','
        ) AS seat_ids
      FROM reservations r
      JOIN showtimes st ON st.showtime_id = r.showtime_id
      JOIN shows sh ON sh.show_id = st.show_id
      JOIN theatres th ON th.theatre_id = sh.theatre_id
      LEFT JOIN reservation_seats rs ON rs.reservation_id = r.reservation_id
      LEFT JOIN seats se ON se.seat_id = rs.seat_id
      WHERE r.user_id = ?
      GROUP BY
        r.reservation_id,
        r.booking_code,
        r.status,
        r.created_at,
        st.showtime_id,
        st.start_time,
        st.hall_name,
        st.base_price,
        sh.title,
        th.name,
        th.location
      ORDER BY st.start_time DESC, r.reservation_id DESC
    `,
    [userId]
  );

  return rows;
}

export async function getAdminNewsletterSubscribers(filters = {}) {
  const { q = '', status = 'all' } = filters;

  const clauses = [];
  const params = [];

  if (q) {
    clauses.push(`ns.email LIKE ?`);
    params.push(`%${q}%`);
  }

  if (status !== 'all') {
    clauses.push(`ns.status = ?`);
    params.push(status);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `
      SELECT
        ns.subscriber_id,
        ns.email,
        ns.source,
        ns.status,
        ns.unsubscribed_at,
        ns.created_at,
        ns.updated_at
      FROM newsletter_subscribers ns
      ${where}
      ORDER BY ns.created_at DESC, ns.subscriber_id DESC
    `,
    params
  );

  return rows;
}

export async function updateAdminNewsletterSubscriber(subscriberId, payload = {}) {
  if (!subscriberId) {
    const error = new Error('Μη έγκυρο subscriber id.');
    error.status = 400;
    throw error;
  }

  const status = payload.status === 'unsubscribed' ? 'unsubscribed' : 'active';

  const [rows] = await pool.query(
    `
      SELECT subscriber_id
      FROM newsletter_subscribers
      WHERE subscriber_id = ?
      LIMIT 1
    `,
    [subscriberId]
  );

  if (!rows.length) {
    const error = new Error('Η εγγραφή newsletter δεν βρέθηκε.');
    error.status = 404;
    throw error;
  }

  await pool.query(
    `
      UPDATE newsletter_subscribers
      SET status = ?,
          unsubscribed_at = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE subscriber_id = ?
    `,
    [status, status === 'unsubscribed' ? new Date() : null, subscriberId]
  );

  const [updatedRows] = await pool.query(
    `
      SELECT
        subscriber_id,
        email,
        source,
        status,
        unsubscribed_at,
        created_at,
        updated_at
      FROM newsletter_subscribers
      WHERE subscriber_id = ?
      LIMIT 1
    `,
    [subscriberId]
  );

  return updatedRows[0];
}

export async function deleteAdminNewsletterSubscriber(subscriberId) {
  if (!subscriberId) {
    const error = new Error('Μη έγκυρο subscriber id.');
    error.status = 400;
    throw error;
  }

  const [rows] = await pool.query(
    `
      SELECT subscriber_id
      FROM newsletter_subscribers
      WHERE subscriber_id = ?
      LIMIT 1
    `,
    [subscriberId]
  );

  if (!rows.length) {
    const error = new Error('Η εγγραφή newsletter δεν βρέθηκε.');
    error.status = 404;
    throw error;
  }

  await pool.query(
    `DELETE FROM newsletter_subscribers WHERE subscriber_id = ?`,
    [subscriberId]
  );

  return { success: true };
}

export async function getAdminReviews(filters = {}) {
  const { q = '', status = 'all', showId = 'all' } = filters;

  const clauses = [];
  const params = [];

  if (q) {
    clauses.push(
      `(COALESCE(r.reviewer_name, '') LIKE ? OR COALESCE(r.reviewer_email, '') LIKE ? OR COALESCE(r.title, '') LIKE ? OR COALESCE(r.comment, '') LIKE ? OR sh.title LIKE ?)`
    );
    const like = `%${q}%`;
    params.push(like, like, like, like, like);
  }

  if (status !== 'all') {
    clauses.push('r.status = ?');
    params.push(status);
  }

  if (showId !== 'all') {
    clauses.push('r.show_id = ?');
    params.push(Number(showId));
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

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
        r.updated_at,
        sh.title AS show_title,
        t.name AS theatre_name
      FROM show_reviews r
      JOIN shows sh ON sh.show_id = r.show_id
      JOIN theatres t ON t.theatre_id = sh.theatre_id
      ${where}
      ORDER BY r.created_at DESC, r.review_id DESC
    `,
    params
  );

  return rows;
}

export async function updateAdminReview(reviewId, payload = {}) {
  if (!reviewId) {
    const error = new Error('Μη έγκυρο review id.');
    error.status = 400;
    throw error;
  }

  const status = payload.status === 'hidden' ? 'hidden' : 'approved';

  const [existing] = await pool.query(
    'SELECT review_id FROM show_reviews WHERE review_id = ? LIMIT 1',
    [reviewId]
  );

  if (!existing.length) {
    const error = new Error('Η κριτική δεν βρέθηκε.');
    error.status = 404;
    throw error;
  }

  await pool.query(
    `
      UPDATE show_reviews
      SET status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE review_id = ?
    `,
    [status, reviewId]
  );

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
        r.updated_at,
        sh.title AS show_title,
        t.name AS theatre_name
      FROM show_reviews r
      JOIN shows sh ON sh.show_id = r.show_id
      JOIN theatres t ON t.theatre_id = sh.theatre_id
      WHERE r.review_id = ?
      LIMIT 1
    `,
    [reviewId]
  );

  return rows[0];
}

export async function deleteAdminReview(reviewId) {
  if (!reviewId) {
    const error = new Error('Μη έγκυρο review id.');
    error.status = 400;
    throw error;
  }

  const [existing] = await pool.query(
    'SELECT review_id FROM show_reviews WHERE review_id = ? LIMIT 1',
    [reviewId]
  );

  if (!existing.length) {
    const error = new Error('Η κριτική δεν βρέθηκε.');
    error.status = 404;
    throw error;
  }

  await pool.query('DELETE FROM show_reviews WHERE review_id = ?', [reviewId]);
  return { success: true };
}

export async function createAdminUser(payload = {}) {
  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  const password = String(payload.password || '').trim();
  const role = payload.role === 'admin' ? 'admin' : 'user';
  const phone = String(payload.phone || '').trim() || null;
  const bio = String(payload.bio || '').trim() || null;
  const avatar_url = String(payload.avatar_url || '').trim() || null;

  if (!name || !email || !password) {
    const error = new Error('Όνομα, email και password είναι υποχρεωτικά.');
    error.status = 400;
    throw error;
  }

  assertSafeName(name);
  assertSafeEmail(email);
  assertStrongPassword(password, true);
  assertOptionalPhone(phone);
  assertOptionalUrl(avatar_url);

  const [existing] = await pool.query(
    'SELECT user_id FROM users WHERE email = ? LIMIT 1',
    [email]
  );

  if (existing.length) {
    const error = new Error('Υπάρχει ήδη χρήστης με αυτό το email.');
    error.status = 409;
    throw error;
  }

  const password_hash = await bcrypt.hash(password, 10);

  const [result] = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, phone, bio, avatar_url)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, email, password_hash, role, phone, bio, avatar_url]
  );

  const [rows] = await pool.query(
    `SELECT user_id, name, email, role, phone, avatar_url, bio, created_at
     FROM users
     WHERE user_id = ?`,
    [result.insertId]
  );

  return rows[0];
}

export async function updateAdminUser(userId, payload = {}) {
  if (!userId) {
    const error = new Error('Μη έγκυρο user id.');
    error.status = 400;
    throw error;
  }

  const [existingRows] = await pool.query(
    'SELECT * FROM users WHERE user_id = ? LIMIT 1',
    [userId]
  );

  const existing = existingRows[0];

  if (!existing) {
    const error = new Error('Ο χρήστης δεν βρέθηκε.');
    error.status = 404;
    throw error;
  }

  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  const password = String(payload.password || '').trim();
  const role = payload.role === 'admin' ? 'admin' : 'user';
  const phone = String(payload.phone || '').trim() || null;
  const bio = String(payload.bio || '').trim() || null;
  const avatar_url = String(payload.avatar_url || '').trim() || null;

  if (!name || !email) {
    const error = new Error('Όνομα και email είναι υποχρεωτικά.');
    error.status = 400;
    throw error;
  }

  assertSafeName(name);
  assertSafeEmail(email);
  assertStrongPassword(password, false);
  assertOptionalPhone(phone);
  assertOptionalUrl(avatar_url);

  const [duplicate] = await pool.query(
    'SELECT user_id FROM users WHERE email = ? AND user_id <> ? LIMIT 1',
    [email, userId]
  );

  if (duplicate.length) {
    const error = new Error('Υπάρχει ήδη χρήστης με αυτό το email.');
    error.status = 409;
    throw error;
  }

  let password_hash = existing.password_hash;
  if (password) {
    password_hash = await bcrypt.hash(password, 10);
  }

  await pool.query(
    `UPDATE users
        SET name = ?, email = ?, password_hash = ?, role = ?, phone = ?, bio = ?, avatar_url = ?
      WHERE user_id = ?`,
    [name, email, password_hash, role, phone, bio, avatar_url, userId]
  );

  const [rows] = await pool.query(
    `SELECT user_id, name, email, role, phone, avatar_url, bio, created_at
     FROM users
     WHERE user_id = ?`,
    [userId]
  );

  return rows[0];
}

export async function deleteAdminUser(userId) {
  if (!userId) {
    const error = new Error('Μη έγκυρο user id.');
    error.status = 400;
    throw error;
  }

  const [rows] = await pool.query(
    'SELECT user_id, role FROM users WHERE user_id = ? LIMIT 1',
    [userId]
  );

  const user = rows[0];

  if (!user) {
    const error = new Error('Ο χρήστης δεν βρέθηκε.');
    error.status = 404;
    throw error;
  }

  if (user.role === 'admin') {
    const error = new Error('Δεν επιτρέπεται η διαγραφή admin από αυτό το panel.');
    error.status = 400;
    throw error;
  }

  await pool.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);

  await pool.query(
    `DELETE rs FROM reservation_seats rs
      JOIN reservations r ON r.reservation_id = rs.reservation_id
     WHERE r.user_id = ?`,
    [userId]
  );

  await pool.query('DELETE FROM reservations WHERE user_id = ?', [userId]);
  await pool.query('DELETE FROM users WHERE user_id = ?', [userId]);
}

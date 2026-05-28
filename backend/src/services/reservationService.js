import crypto from 'crypto';
import { pool } from '../config/db.js';
import QRCode from 'qrcode';
import { sendReservationReceipt } from './receiptService.js';
import { calculatePromoDiscount, getActivePromoByCode } from './promoService.js';

const seatPrices = {
  VIP: 28,
  Regular: 22,
  Economy: 16
};

function bookingCode() {
  return `BK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function ticketToken() {
  return crypto.randomBytes(24).toString('hex');
}

function resolveSeatPrice(category, fallbackBasePrice = 0) {
  return Number(seatPrices[category] ?? fallbackBasePrice ?? 0);
}

async function getConfirmedReservationSeats(conn, reservationId) {
  const [rows] = await conn.query(
    `SELECT rs.seat_id
       FROM reservation_seats rs
       JOIN reservations r ON r.reservation_id = rs.reservation_id
      WHERE rs.reservation_id = ?
        AND r.status = 'confirmed'`,
    [reservationId]
  );
  return rows.map((row) => Number(row.seat_id));
}

async function validateShowtimeExists(conn, showtimeId) {
  const [[showtimeRow]] = await conn.query(
    `
      SELECT showtime_id, base_price, start_time
      FROM showtimes
      WHERE showtime_id = ?
      LIMIT 1
    `,
    [showtimeId]
  );

  if (!showtimeRow) {
    const error = new Error('Showtime not found');
    error.status = 404;
    throw error;
  }

  return showtimeRow;
}

async function fetchSeatsForReservation(conn, seatIds) {
  if (!seatIds.length) return [];

  const placeholders = seatIds.map(() => '?').join(',');

  const [seatRows] = await conn.query(
    `
      SELECT seat_id, row_label, seat_number, category
      FROM seats
      WHERE seat_id IN (${placeholders})
    `,
    seatIds
  );

  if (seatRows.length !== seatIds.length) {
    const error = new Error('One or more selected seats were not found');
    error.status = 404;
    throw error;
  }

  const seatMap = new Map(seatRows.map((seat) => [Number(seat.seat_id), seat]));
  return seatIds.map((seatId) => seatMap.get(Number(seatId))).filter(Boolean);
}

async function assertSeatsAvailable(conn, { showtimeId, seatIds, ignoreReservationId = null }) {
  if (!seatIds.length) {
    const error = new Error('Array must contain at least 1 element(s)');
    error.status = 400;
    throw error;
  }

  const placeholders = seatIds.map(() => '?').join(',');

  const params = [showtimeId, ...seatIds];
  let ignoreClause = '';

  if (ignoreReservationId) {
    ignoreClause = 'AND rs.reservation_id <> ?';
    params.push(ignoreReservationId);
  }

  const [taken] = await conn.query(
    `SELECT rs.seat_id
       FROM reservation_seats rs
       JOIN reservations r ON r.reservation_id = rs.reservation_id
      WHERE rs.showtime_id = ?
        AND rs.seat_id IN (${placeholders})
        AND r.status IN ('confirmed', 'pending')
        ${ignoreClause}
      FOR UPDATE`,
    params
  );

  if (taken.length) {
    const error = new Error('One or more selected seats are already reserved');
    error.status = 409;
    throw error;
  }
}

function calculateTotals({
  orderedSeats,
  basePrice,
  promo,
  discountAmount = 0,
  finalPrice = null
}) {
  const baseTotal = orderedSeats.reduce(
    (sum, seat) => sum + resolveSeatPrice(seat.category, basePrice),
    0
  );

  if (promo) {
    const totals = calculatePromoDiscount(baseTotal, promo);

    return {
      baseTotal: Number(baseTotal.toFixed(2)),
      discountAmount: Number(totals.discount_amount || 0),
      finalPrice: Number(totals.final_price || 0)
    };
  }

  return {
    baseTotal: Number(baseTotal.toFixed(2)),
    discountAmount: Number(discountAmount || 0),
    finalPrice:
      finalPrice !== null && finalPrice !== undefined
        ? Number(finalPrice)
        : Number(Math.max(baseTotal - Number(discountAmount || 0), 0).toFixed(2))
  };
}

async function loadPromo(promoCode) {
  if (!promoCode?.trim()) return null;

  const promo = await getActivePromoByCode(promoCode);
  if (!promo) {
    const error = new Error('Το promo code δεν είναι έγκυρο ή δεν είναι ενεργό.');
    error.status = 404;
    throw error;
  }

  return promo;
}

function seatLabel(seat) {
  return `${seat.row_label}${seat.seat_number}`;
}

function buildSeatSummary(seats, fallbackBasePrice = 0) {
  return seats
    .slice()
    .sort((a, b) => {
      if (String(a.row_label) === String(b.row_label)) {
        return Number(a.seat_number) - Number(b.seat_number);
      }
      return String(a.row_label).localeCompare(String(b.row_label), 'el');
    })
    .map((seat) => ({
      seat_id: Number(seat.seat_id),
      label: seatLabel(seat),
      row_label: seat.row_label,
      seat_number: seat.seat_number,
      category: seat.category,
      price: resolveSeatPrice(seat.category, fallbackBasePrice)
    }));
}

async function getReservationForModification(conn, reservationId) {
  const [reservationRows] = await conn.query(
    `SELECT r.*, st.start_time, st.base_price
       FROM reservations r
       JOIN showtimes st ON st.showtime_id = r.showtime_id
      WHERE r.reservation_id = ?
      LIMIT 1
      FOR UPDATE`,
    [reservationId]
  );

  const reservation = reservationRows[0];

  if (!reservation) {
    const error = new Error('Reservation not found');
    error.status = 404;
    throw error;
  }

  return reservation;
}

function assertReservationCanBeModified({ reservation, userId, isAdmin }) {
  if (!isAdmin && reservation.user_id !== userId) {
    const error = new Error('Forbidden');
    error.status = 403;
    throw error;
  }

  if (reservation.status !== 'confirmed') {
    const error = new Error('Only confirmed reservations can be modified');
    error.status = 400;
    throw error;
  }

  if (new Date(reservation.start_time) <= new Date()) {
    const error = new Error('Only future reservations can be modified');
    error.status = 400;
    throw error;
  }
}

async function buildModificationPreview({
  conn,
  reservationId,
  userId,
  isAdmin,
  showtime_id = null,
  seat_ids,
  promo_code = null,
  discount_amount = 0,
  final_price = null
}) {
  const reservation = await getReservationForModification(conn, reservationId);
  assertReservationCanBeModified({ reservation, userId, isAdmin });

  const targetShowtimeId = Number(showtime_id || reservation.showtime_id);
  const currentSeatIds = await getConfirmedReservationSeats(conn, reservationId);

  const normalizedCurrent = [...currentSeatIds].sort((a, b) => a - b);
  const normalizedIncoming = [...seat_ids].sort((a, b) => a - b);
  const sameShowtime = Number(targetShowtimeId) === Number(reservation.showtime_id);
  const sameSeats =
    normalizedCurrent.length === normalizedIncoming.length &&
    normalizedCurrent.every((value, index) => value === normalizedIncoming[index]);

  if (sameShowtime && sameSeats) {
    return {
      reservation,
      targetShowtimeId,
      promo: null,
      currentSeatIds,
      incomingSeatIds: seat_ids.map(Number),
      currentSeats: [],
      incomingSeats: [],
      nextTotals: {
        baseTotal: Number(reservation.final_price ?? reservation.base_price ?? 0),
        discountAmount: Number(reservation.discount_amount || 0),
        finalPrice: Number(reservation.final_price ?? reservation.base_price ?? 0)
      },
      currentTotals: {
        baseTotal: Number(reservation.final_price ?? reservation.base_price ?? 0),
        discountAmount: Number(reservation.discount_amount || 0),
        finalPrice: Number(reservation.final_price ?? reservation.base_price ?? 0)
      },
      changeSet: {
        keptSeats: [],
        addedSeats: [],
        removedSeats: []
      },
      payment: {
        amountDelta: 0,
        amountDue: 0,
        requiresPayment: false
      },
      preview: {
        reservation_id: reservationId,
        current: {
          showtime_id: Number(reservation.showtime_id),
          seat_ids: currentSeatIds,
          seats: [],
          totals: {
            base_total: Number(reservation.final_price ?? reservation.base_price ?? 0),
            discount_amount: Number(reservation.discount_amount || 0),
            final_price: Number(reservation.final_price ?? reservation.base_price ?? 0)
          }
        },
        proposed: {
          showtime_id: Number(targetShowtimeId),
          seat_ids: seat_ids.map(Number),
          seats: [],
          totals: {
            base_total: Number(reservation.final_price ?? reservation.base_price ?? 0),
            discount_amount: Number(reservation.discount_amount || 0),
            final_price: Number(reservation.final_price ?? reservation.base_price ?? 0)
          }
        },
        changes: {
          kept: [],
          added: [],
          removed: []
        },
        payment: {
          amount_delta: 0,
          amount_due: 0,
          requires_payment: false
        },
        promo: null
      }
    };
  }

  await assertSeatsAvailable(conn, {
    showtimeId: targetShowtimeId,
    seatIds: seat_ids,
    ignoreReservationId: sameShowtime ? reservationId : null
  });

  const currentShowtimeRow = await validateShowtimeExists(conn, reservation.showtime_id);
  const targetShowtimeRow = await validateShowtimeExists(conn, targetShowtimeId);

  if (new Date(targetShowtimeRow.start_time) <= new Date()) {
    const error = new Error('The selected showtime must be in the future');
    error.status = 400;
    throw error;
  }

  const currentSeats = await fetchSeatsForReservation(conn, currentSeatIds);
  const incomingSeats = await fetchSeatsForReservation(conn, seat_ids);
  const promo = await loadPromo(promo_code ?? reservation.promo_code);

  const currentBaseTotal = currentSeats.reduce(
    (sum, seat) => sum + resolveSeatPrice(seat.category, currentShowtimeRow.base_price),
    0
  );

  const currentDiscountAmount = Number(reservation.discount_amount || 0);
  const currentFinalPrice = Number(
    reservation.final_price ?? Math.max(currentBaseTotal - currentDiscountAmount, 0)
  );

  const nextTotals = calculateTotals({
    orderedSeats: incomingSeats,
    basePrice: targetShowtimeRow.base_price,
    promo,
    discountAmount: promo ? 0 : Number(discount_amount ?? reservation.discount_amount ?? 0),
    finalPrice: promo ? null : (final_price ?? null)
  });

  const currentIdSet = new Set(currentSeatIds.map(Number));
  const incomingIdSet = new Set(seat_ids.map(Number));

  const addedSeats = incomingSeats.filter((seat) => !currentIdSet.has(Number(seat.seat_id)));
  const removedSeats = currentSeats.filter((seat) => !incomingIdSet.has(Number(seat.seat_id)));
  const keptSeats = incomingSeats.filter((seat) => currentIdSet.has(Number(seat.seat_id)));

  const amountDelta = Number((nextTotals.finalPrice - currentFinalPrice).toFixed(2));
  const amountDue = Number(Math.max(amountDelta, 0).toFixed(2));

  return {
    reservation,
    targetShowtimeId,
    promo,
    currentSeatIds,
    incomingSeatIds: seat_ids.map(Number),
    currentSeats,
    incomingSeats,
    nextTotals,
    currentTotals: {
      baseTotal: Number(currentBaseTotal.toFixed(2)),
      discountAmount: currentDiscountAmount,
      finalPrice: currentFinalPrice
    },
    changeSet: {
      keptSeats: buildSeatSummary(keptSeats, targetShowtimeRow.base_price),
      addedSeats: buildSeatSummary(addedSeats, targetShowtimeRow.base_price),
      removedSeats: buildSeatSummary(removedSeats, currentShowtimeRow.base_price)
    },
    payment: {
      amountDelta,
      amountDue,
      requiresPayment: amountDue > 0
    },
    preview: {
      reservation_id: reservationId,
      current: {
        showtime_id: Number(reservation.showtime_id),
        seat_ids: currentSeatIds,
        seats: buildSeatSummary(currentSeats, currentShowtimeRow.base_price),
        totals: {
          base_total: Number(currentBaseTotal.toFixed(2)),
          discount_amount: currentDiscountAmount,
          final_price: currentFinalPrice
        }
      },
      proposed: {
        showtime_id: Number(targetShowtimeId),
        seat_ids: seat_ids.map(Number),
        seats: buildSeatSummary(incomingSeats, targetShowtimeRow.base_price),
        totals: {
          base_total: nextTotals.baseTotal,
          discount_amount: nextTotals.discountAmount,
          final_price: nextTotals.finalPrice
        }
      },
      changes: {
        kept: buildSeatSummary(keptSeats, targetShowtimeRow.base_price),
        added: buildSeatSummary(addedSeats, targetShowtimeRow.base_price),
        removed: buildSeatSummary(removedSeats, currentShowtimeRow.base_price)
      },
      payment: {
        amount_delta: amountDelta,
        amount_due: amountDue,
        requires_payment: amountDue > 0
      },
      promo: promo
        ? {
            promo_id: promo.promo_id,
            code: promo.code,
            title: promo.title,
            discount_type: promo.discount_type,
            discount_value: Number(promo.discount_value || 0)
          }
        : null
    }
  };
}

function resolveTicketState(row) {
  if (!row) return 'not_found';
  if (row.status === 'cancelled') return 'cancelled';
  if (row.checked_in_at) return 'used';
  return 'valid';
}

export async function previewReservationModification({
  reservationId,
  userId,
  isAdmin,
  showtime_id = null,
  seat_ids,
  promo_code = null,
  discount_amount = 0,
  final_price = null
}) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();
    const result = await buildModificationPreview({
      conn,
      reservationId,
      userId,
      isAdmin,
      showtime_id,
      seat_ids,
      promo_code,
      discount_amount,
      final_price
    });
    await conn.rollback();
    return result.preview;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function confirmReservationModification({
  reservationId,
  userId,
  isAdmin,
  showtime_id = null,
  seat_ids,
  promo_code = null,
  discount_amount = 0,
  final_price = null,
  payment_method = null,
  card_last4 = null
}) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const result = await buildModificationPreview({
      conn,
      reservationId,
      userId,
      isAdmin,
      showtime_id,
      seat_ids,
      promo_code,
      discount_amount,
      final_price
    });

    if (result.payment.requiresPayment) {
      if (payment_method !== 'card_demo') {
        const error = new Error('Για την επιπλέον χρέωση απαιτείται πληρωμή με κάρτα.');
        error.status = 400;
        throw error;
      }

      if (!String(card_last4 || '').match(/^\d{4}$/)) {
        const error = new Error('Το card_last4 πρέπει να έχει 4 ψηφία.');
        error.status = 400;
        throw error;
      }
    }

    await conn.query('DELETE FROM reservation_seats WHERE reservation_id = ?', [reservationId]);

    for (const seatId of result.incomingSeatIds) {
      await conn.query(
        `INSERT INTO reservation_seats (reservation_id, showtime_id, seat_id)
         VALUES (?, ?, ?)`,
        [reservationId, result.targetShowtimeId, seatId]
      );
    }

    await conn.query(
      `UPDATE reservations
          SET showtime_id = ?,
              promo_id = ?,
              promo_code = ?,
              discount_amount = ?,
              final_price = ?,
              payment_method = ?,
              card_last4 = ?
        WHERE reservation_id = ?`,
      [
        result.targetShowtimeId,
        result.promo?.promo_id || null,
        result.promo?.code || null,
        result.nextTotals.discountAmount,
        result.nextTotals.finalPrice,
        result.payment.requiresPayment ? payment_method : result.reservation.payment_method,
        result.payment.requiresPayment ? card_last4 : result.reservation.card_last4,
        reservationId
      ]
    );

    await conn.commit();

    await sendReservationReceipt(reservationId, result.reservation.user_id).catch(() => null);

    return {
      success: true,
      reservation_id: reservationId,
      payment: {
        amount_delta: result.payment.amountDelta,
        amount_due: result.payment.amountDue,
        requires_payment: result.payment.requiresPayment,
        paid_with: result.payment.requiresPayment ? 'card_demo' : null
      },
      totals: {
        base_total: result.nextTotals.baseTotal,
        discount_amount: result.nextTotals.discountAmount,
        final_price: result.nextTotals.finalPrice
      },
      seats: buildSeatSummary(result.incomingSeats),
      changes: result.changeSet
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function createReservation({
  userId,
  showtime_id,
  seat_ids,
  payment_method = null,
  card_last4 = null,
  promo_code = null,
  discount_amount = 0,
  final_price = null
}) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    await assertSeatsAvailable(conn, { showtimeId: showtime_id, seatIds: seat_ids });

    const showtimeRow = await validateShowtimeExists(conn, showtime_id);
    const orderedSeats = await fetchSeatsForReservation(conn, seat_ids);
    const promo = await loadPromo(promo_code);
    const totals = calculateTotals({
      orderedSeats,
      basePrice: showtimeRow.base_price,
      promo,
      discountAmount: discount_amount,
      finalPrice: final_price
    });

    const code = bookingCode();
    const secureTicketToken = ticketToken();

    const [reservationResult] = await conn.query(
      `INSERT INTO reservations (
         user_id,
         showtime_id,
         booking_code,
         ticket_token,
         status,
         payment_method,
         card_last4,
         promo_id,
         promo_code,
         discount_amount,
         final_price
       )
       VALUES (?, ?, ?, ?, 'confirmed', ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        showtime_id,
        code,
        secureTicketToken,
        payment_method,
        card_last4,
        promo?.promo_id || null,
        promo?.code || null,
        totals.discountAmount,
        totals.finalPrice
      ]
    );

    const reservationId = reservationResult.insertId;

    for (const seatId of seat_ids) {
      await conn.query(
        `INSERT INTO reservation_seats (reservation_id, showtime_id, seat_id)
         VALUES (?, ?, ?)`,
        [reservationId, showtime_id, seatId]
      );
    }

    await conn.commit();

    const qr_code_data_url = await QRCode.toDataURL(secureTicketToken);
    const receipt = await sendReservationReceipt(reservationId, userId).catch((error) => ({
      success: false,
      message: error.message
    }));

    return {
      reservation_id: reservationId,
      booking_code: code,
      ticket_token: secureTicketToken,
      qr_code_data_url,
      totals: {
        base_total: totals.baseTotal,
        discount_amount: totals.discountAmount,
        final_price: totals.finalPrice
      },
      promo: promo
        ? {
            promo_id: promo.promo_id,
            code: promo.code,
            title: promo.title,
            discount_type: promo.discount_type,
            discount_value: Number(promo.discount_value || 0)
          }
        : null,
      receipt
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function getUserReservations(userId) {
  const [rows] = await pool.query(
    `SELECT r.reservation_id, r.booking_code, r.ticket_token, r.checked_in_at, r.status, r.created_at,
            r.payment_method, r.card_last4,
            r.promo_code, r.discount_amount, r.final_price,
            st.showtime_id, st.start_time, st.hall_name, st.base_price,
            sh.show_id, sh.title, th.name AS theatre_name,
            GROUP_CONCAT(CONCAT(se.row_label, se.seat_number) ORDER BY se.row_label, se.seat_number SEPARATOR ', ') AS seats,
            GROUP_CONCAT(se.seat_id ORDER BY se.row_label, se.seat_number SEPARATOR ',') AS seat_ids,
            SUM(
              CASE
                WHEN se.category = 'VIP' THEN 28
                WHEN se.category = 'Economy' THEN 16
                WHEN se.category = 'Regular' THEN 22
                ELSE st.base_price
              END
            ) AS calculated_base_total
     FROM reservations r
     JOIN showtimes st ON st.showtime_id = r.showtime_id
     JOIN shows sh ON sh.show_id = st.show_id
     JOIN theatres th ON th.theatre_id = sh.theatre_id
     LEFT JOIN reservation_seats rs ON rs.reservation_id = r.reservation_id
     LEFT JOIN seats se ON se.seat_id = rs.seat_id
     WHERE r.user_id = ?
     GROUP BY r.reservation_id
     ORDER BY st.start_time DESC`,
    [userId]
  );

  return rows.map((row) => ({
    ...row,
    ticket_status: resolveTicketState(row),
    ticket_token: row.ticket_token || row.booking_code
  }));
}

export async function getTicketVerificationByToken(token) {
  const normalizedToken = String(token || '').trim();

  if (!normalizedToken) {
    const error = new Error('Μη έγκυρο token εισιτηρίου.');
    error.status = 400;
    throw error;
  }

  const [rows] = await pool.query(
    `
      SELECT
        r.reservation_id,
        r.booking_code,
        r.ticket_token,
        r.status,
        r.checked_in_at,
        r.created_at,
        r.final_price,
        st.showtime_id,
        st.start_time,
        st.hall_name,
        sh.show_id,
        sh.title AS show_title,
        th.name AS theatre_name,
        th.location,
        GROUP_CONCAT(
          CONCAT(se.row_label, se.seat_number)
          ORDER BY se.row_label, se.seat_number
          SEPARATOR ', '
        ) AS seats
      FROM reservations r
      JOIN showtimes st ON st.showtime_id = r.showtime_id
      JOIN shows sh ON sh.show_id = st.show_id
      JOIN theatres th ON th.theatre_id = sh.theatre_id
      LEFT JOIN reservation_seats rs ON rs.reservation_id = r.reservation_id
      LEFT JOIN seats se ON se.seat_id = rs.seat_id
      WHERE r.ticket_token = ?
         OR r.booking_code = ?
      GROUP BY r.reservation_id
      LIMIT 1
    `,
    [normalizedToken, normalizedToken]
  );

  const row = rows[0];

  if (!row) {
    return {
      valid: false,
      ticket_state: 'not_found',
      status_label: 'Δεν βρέθηκε',
      message: 'Το εισιτήριο δεν βρέθηκε.'
    };
  }

  const ticketState = resolveTicketState(row);

  const statusLabelMap = {
    valid: 'Έγκυρο εισιτήριο',
    cancelled: 'Ακυρωμένο εισιτήριο',
    used: 'Χρησιμοποιημένο εισιτήριο',
    not_found: 'Δεν βρέθηκε'
  };

  return {
    valid: ticketState === 'valid',
    ticket_state: ticketState,
    status_label: statusLabelMap[ticketState] || 'Άγνωστη κατάσταση',
    reservation: {
      reservation_id: row.reservation_id,
      booking_code: row.booking_code,
      show_id: row.show_id,
      showtime_id: row.showtime_id,
      title: row.show_title,
      theatre_name: row.theatre_name,
      location: row.location,
      start_time: row.start_time,
      hall_name: row.hall_name,
      seats: row.seats || '—',
      final_price: row.final_price,
      checked_in_at: row.checked_in_at
    }
  };
}

export async function updateReservation({
  reservationId,
  userId,
  isAdmin,
  showtime_id = null,
  seat_ids,
  promo_code = null,
  discount_amount = 0,
  final_price = null,
  payment_method = null,
  card_last4 = null
}) {
  return confirmReservationModification({
    reservationId,
    userId,
    isAdmin,
    showtime_id,
    seat_ids,
    promo_code,
    discount_amount,
    final_price,
    payment_method,
    card_last4
  });
}

export async function cancelReservation({ reservationId, userId, isAdmin }) {
  const [rows] = await pool.query(
    `SELECT r.*, st.start_time
       FROM reservations r
       JOIN showtimes st ON st.showtime_id = r.showtime_id
      WHERE r.reservation_id = ?`,
    [reservationId]
  );

  const reservation = rows[0];

  if (!reservation) {
    const error = new Error('Reservation not found');
    error.status = 404;
    throw error;
  }

  if (!isAdmin && reservation.user_id !== userId) {
    const error = new Error('Forbidden');
    error.status = 403;
    throw error;
  }

  if (reservation.status === 'cancelled') {
    return { success: true, already_cancelled: true };
  }

  if (new Date(reservation.start_time) <= new Date()) {
    const error = new Error('Only future reservations can be cancelled');
    error.status = 400;
    throw error;
  }

  await pool.query(
    "UPDATE reservations SET status = 'cancelled' WHERE reservation_id = ?",
    [reservationId]
  );

  return { success: true };
}

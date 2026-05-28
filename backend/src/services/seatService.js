import { pool } from '../config/db.js';

export async function getSeatsByShowtime(showtimeId) {
  const [rows] = await pool.query(
    `SELECT
        s.seat_id,
        s.row_label,
        s.seat_number,
        s.category,
        CASE
          WHEN r.reservation_id IS NOT NULL THEN 1
          ELSE 0
        END AS is_reserved
     FROM seats s
     LEFT JOIN reservation_seats rs
       ON rs.seat_id = s.seat_id
      AND rs.showtime_id = ?
     LEFT JOIN reservations r
       ON r.reservation_id = rs.reservation_id
      AND r.status IN ('confirmed', 'pending')
     ORDER BY s.row_label, s.seat_number`,
    [showtimeId]
  );

  return rows;
}
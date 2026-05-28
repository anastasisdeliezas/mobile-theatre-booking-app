import { pool } from '../config/db.js';

export async function getShows(filters = {}) {
  const { theatreId, title, date } = filters;
  const clauses = [];
  const params = [];

  if (theatreId) {
    clauses.push('s.theatre_id = ?');
    params.push(theatreId);
  }

  if (title) {
    clauses.push('s.title LIKE ?');
    params.push(`%${title}%`);
  }

  if (date) {
    clauses.push('DATE(st.start_time) = ?');
    params.push(date);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `
      SELECT DISTINCT
        s.*,
        t.name AS theatre_name,
        t.location
      FROM shows s
      JOIN theatres t ON t.theatre_id = s.theatre_id
      LEFT JOIN showtimes st ON st.show_id = s.show_id
      ${where}
      ORDER BY s.title ASC
    `,
    params
  );

  return rows;
}

export async function getShowById(showId) {
  const [rows] = await pool.query(
    `
      SELECT
        s.*,
        t.name AS theatre_name,
        t.location,
        t.description AS theatre_description
      FROM shows s
      JOIN theatres t ON t.theatre_id = s.theatre_id
      WHERE s.show_id = ?
    `,
    [showId]
  );

  return rows[0];
}

export async function createShow(payload) {
  const {
    theatre_id,
    title,
    genre,
    description,
    duration_minutes,
    age_rating,
    poster_url,
    hero_image_url,
    trailer_url,
    overview_text,
    cast_text,
    creatives_text,
    highlights_text,
    audience_text,
    content_warnings_text
  } = payload;

  const [result] = await pool.query(
    `
      INSERT INTO shows
      (
        theatre_id,
        title,
        genre,
        description,
        duration_minutes,
        age_rating,
        poster_url,
        hero_image_url,
        trailer_url,
        overview_text,
        cast_text,
        creatives_text,
        highlights_text,
        audience_text,
        content_warnings_text
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      theatre_id,
      title,
      genre || null,
      description,
      duration_minutes,
      age_rating,
      poster_url || null,
      hero_image_url || null,
      trailer_url || null,
      overview_text || null,
      cast_text || null,
      creatives_text || null,
      highlights_text || null,
      audience_text || null,
      content_warnings_text || null
    ]
  );

  return { show_id: result.insertId, ...payload };
}

export async function updateShow(showId, payload) {
  const {
    theatre_id,
    title,
    genre,
    description,
    duration_minutes,
    age_rating,
    poster_url,
    hero_image_url,
    trailer_url,
    overview_text,
    cast_text,
    creatives_text,
    highlights_text,
    audience_text,
    content_warnings_text
  } = payload;

  await pool.query(
    `
      UPDATE shows
      SET theatre_id = ?,
          title = ?,
          genre = ?,
          description = ?,
          duration_minutes = ?,
          age_rating = ?,
          poster_url = ?,
          hero_image_url = ?,
          trailer_url = ?,
          overview_text = ?,
          cast_text = ?,
          creatives_text = ?,
          highlights_text = ?,
          audience_text = ?,
          content_warnings_text = ?
      WHERE show_id = ?
    `,
    [
      theatre_id,
      title,
      genre || null,
      description,
      duration_minutes,
      age_rating,
      poster_url || null,
      hero_image_url || null,
      trailer_url || null,
      overview_text || null,
      cast_text || null,
      creatives_text || null,
      highlights_text || null,
      audience_text || null,
      content_warnings_text || null,
      showId
    ]
  );

  return getShowById(showId);
}

export async function removeShow(showId) {
  await pool.query('DELETE FROM shows WHERE show_id = ?', [showId]);
  return { success: true };
}

export async function getShowtimes(showId = null) {
  if (showId) {
    const [rows] = await pool.query(
      `
        SELECT
          st.*,
          s.title AS show_title,
          s.theatre_id,
          t.name AS theatre_name,
          t.location
        FROM showtimes st
        JOIN shows s ON s.show_id = st.show_id
        JOIN theatres t ON t.theatre_id = s.theatre_id
        WHERE st.show_id = ?
        ORDER BY st.start_time ASC
      `,
      [showId]
    );
    return rows;
  }

  const [rows] = await pool.query(
    `
      SELECT
        st.*,
        s.title AS show_title,
        s.theatre_id,
        t.name AS theatre_name,
        t.location
      FROM showtimes st
      JOIN shows s ON s.show_id = st.show_id
      JOIN theatres t ON t.theatre_id = s.theatre_id
      WHERE st.start_time >= NOW()
      ORDER BY st.start_time ASC
    `
  );

  return rows;
}

export async function createShowtime(payload) {
  const { show_id, hall_name, start_time, base_price } = payload;

  const [result] = await pool.query(
    `
      INSERT INTO showtimes (show_id, hall_name, start_time, base_price)
      VALUES (?, ?, ?, ?)
    `,
    [show_id, hall_name, start_time, base_price]
  );

  return { showtime_id: result.insertId, ...payload };
}

export async function updateShowtime(showtimeId, payload) {
  const { show_id, hall_name, start_time, base_price } = payload;

  await pool.query(
    `
      UPDATE showtimes
      SET show_id = ?, hall_name = ?, start_time = ?, base_price = ?
      WHERE showtime_id = ?
    `,
    [show_id, hall_name, start_time, base_price, showtimeId]
  );

  const [rows] = await pool.query(
    `
      SELECT
        st.*,
        s.title AS show_title,
        s.theatre_id,
        t.name AS theatre_name,
        t.location
      FROM showtimes st
      JOIN shows s ON s.show_id = st.show_id
      JOIN theatres t ON t.theatre_id = s.theatre_id
      WHERE st.showtime_id = ?
    `,
    [showtimeId]
  );

  return rows[0];
}

export async function removeShowtime(showtimeId) {
  await pool.query('DELETE FROM showtimes WHERE showtime_id = ?', [showtimeId]);
  return { success: true };
}
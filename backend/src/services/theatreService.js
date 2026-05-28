import { pool } from '../config/db.js';

export async function getTheatres({ search, location }) {
  const clauses = [];
  const params = [];

  if (search) {
    clauses.push(
      '(name LIKE ? OR description LIKE ? OR intro_text LIKE ? OR space_overview LIKE ? OR booking_info LIKE ?)'
    );
    params.push(
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`
    );
  }

  if (location) {
    clauses.push('location LIKE ?');
    params.push(`%${location}%`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT * FROM theatres ${where} ORDER BY name ASC`,
    params
  );
  return rows;
}

export async function createTheatre(payload) {
  const {
    name,
    location,
    description,
    avatar_url,
    intro_text,
    space_overview,
    booking_info
  } = payload;

  const [result] = await pool.query(
    `
      INSERT INTO theatres
      (name, location, description, avatar_url, intro_text, space_overview, booking_info)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      name,
      location,
      description || '',
      avatar_url || null,
      intro_text || '',
      space_overview || '',
      booking_info || ''
    ]
  );

  const [rows] = await pool.query(
    'SELECT * FROM theatres WHERE theatre_id = ?',
    [result.insertId]
  );

  return rows[0];
}

export async function updateTheatre(theatreId, payload) {
  const {
    name,
    location,
    description,
    avatar_url,
    intro_text,
    space_overview,
    booking_info
  } = payload;

  await pool.query(
    `
      UPDATE theatres
      SET name = ?,
          location = ?,
          description = ?,
          avatar_url = ?,
          intro_text = ?,
          space_overview = ?,
          booking_info = ?
      WHERE theatre_id = ?
    `,
    [
      name,
      location,
      description || '',
      avatar_url || null,
      intro_text || '',
      space_overview || '',
      booking_info || '',
      theatreId
    ]
  );

  const [rows] = await pool.query(
    'SELECT * FROM theatres WHERE theatre_id = ?',
    [theatreId]
  );

  return rows[0];
}

export async function removeTheatre(theatreId) {
  await pool.query('DELETE FROM theatres WHERE theatre_id = ?', [theatreId]);
  return { success: true };
}
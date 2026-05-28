import { pool } from '../config/db.js';

function getUserId(user) {
  return user?.user_id || user?.id || null;
}

function getUserEmail(user) {
  return String(user?.email || '').trim().toLowerCase();
}

export async function createContactMessage({ name, email, subject, message }) {
  const [result] = await pool.query(
    `
      INSERT INTO contact_messages (name, email, subject, message)
      VALUES (?, ?, ?, ?)
    `,
    [name, email, subject || null, message]
  );

  return {
    message_id: result.insertId,
    success: true
  };
}

export async function getAdminContactMessages(filters = {}) {
  const { q = '', status = 'all' } = filters;

  const clauses = [];
  const params = [];

  if (q) {
    clauses.push(
      `(cm.name LIKE ? OR cm.email LIKE ? OR COALESCE(cm.subject, '') LIKE ? OR cm.message LIKE ?)`
    );
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }

  if (status !== 'all') {
    clauses.push(`cm.status = ?`);
    params.push(status);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `
      SELECT
        cm.*,
        (
          SELECT COUNT(*)
          FROM contact_message_replies cmr
          WHERE cmr.message_id = cm.message_id
        ) AS reply_count,
        (
          SELECT MAX(cmr.created_at)
          FROM contact_message_replies cmr
          WHERE cmr.message_id = cm.message_id
        ) AS last_reply_at
      FROM contact_messages cm
      ${where}
      ORDER BY cm.created_at DESC, cm.message_id DESC
    `,
    params
  );

  return rows;
}

export async function updateContactMessageStatus(messageId, status) {
  await pool.query(
    `UPDATE contact_messages SET status = ? WHERE message_id = ?`,
    [status, messageId]
  );

  const [rows] = await pool.query(
    `SELECT * FROM contact_messages WHERE message_id = ?`,
    [messageId]
  );

  return rows[0];
}

export async function getUserContactMessages(user) {
  const email = getUserEmail(user);

  const [rows] = await pool.query(
    `
      SELECT
        cm.*,
        (
          SELECT COUNT(*)
          FROM contact_message_replies cmr
          WHERE cmr.message_id = cm.message_id
        ) AS reply_count,
        (
          SELECT MAX(cmr.created_at)
          FROM contact_message_replies cmr
          WHERE cmr.message_id = cm.message_id
        ) AS last_reply_at
      FROM contact_messages cm
      WHERE LOWER(cm.email) = ?
      ORDER BY cm.created_at DESC, cm.message_id DESC
    `,
    [email]
  );

  return rows;
}

async function getMessageById(messageId) {
  const [rows] = await pool.query(
    `SELECT * FROM contact_messages WHERE message_id = ?`,
    [messageId]
  );

  return rows[0] || null;
}

async function assertUserCanAccessMessage(messageId, user) {
  const email = getUserEmail(user);
  const message = await getMessageById(messageId);

  if (!message) {
    const error = new Error('Το μήνυμα δεν βρέθηκε.');
    error.status = 404;
    throw error;
  }

  if (String(message.email || '').trim().toLowerCase() !== email) {
    const error = new Error('Δεν έχεις πρόσβαση σε αυτό το μήνυμα.');
    error.status = 403;
    throw error;
  }

  return message;
}

export async function getContactMessageThreadForAdmin(messageId) {
  const message = await getMessageById(messageId);

  if (!message) {
    const error = new Error('Το μήνυμα δεν βρέθηκε.');
    error.status = 404;
    throw error;
  }

  const [replies] = await pool.query(
    `
      SELECT *
      FROM contact_message_replies
      WHERE message_id = ?
      ORDER BY created_at ASC, reply_id ASC
    `,
    [messageId]
  );

  return {
    message,
    replies
  };
}

export async function getContactMessageThreadForUser(messageId, user) {
  const message = await assertUserCanAccessMessage(messageId, user);

  const [replies] = await pool.query(
    `
      SELECT *
      FROM contact_message_replies
      WHERE message_id = ?
      ORDER BY created_at ASC, reply_id ASC
    `,
    [messageId]
  );

  return {
    message,
    replies
  };
}

export async function createAdminContactReply(messageId, user, body) {
  const message = await getMessageById(messageId);

  if (!message) {
    const error = new Error('Το μήνυμα δεν βρέθηκε.');
    error.status = 404;
    throw error;
  }

  const senderId = getUserId(user);

  const [result] = await pool.query(
    `
      INSERT INTO contact_message_replies (message_id, sender_type, sender_id, body)
      VALUES (?, 'admin', ?, ?)
    `,
    [messageId, senderId, body]
  );

  await pool.query(
    `UPDATE contact_messages SET status = 'replied' WHERE message_id = ?`,
    [messageId]
  );

  const [rows] = await pool.query(
    `SELECT * FROM contact_message_replies WHERE reply_id = ?`,
    [result.insertId]
  );

  return rows[0];
}

export async function createUserContactReply(messageId, user, body) {
  await assertUserCanAccessMessage(messageId, user);

  const senderId = getUserId(user);

  const [result] = await pool.query(
    `
      INSERT INTO contact_message_replies (message_id, sender_type, sender_id, body)
      VALUES (?, 'user', ?, ?)
    `,
    [messageId, senderId, body]
  );

  await pool.query(
    `UPDATE contact_messages SET status = 'new' WHERE message_id = ?`,
    [messageId]
  );

  const [rows] = await pool.query(
    `SELECT * FROM contact_message_replies WHERE reply_id = ?`,
    [result.insertId]
  );

  return rows[0];
}
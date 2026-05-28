import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import {
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken
} from '../utils/jwt.js';

const REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 30);

function safeUser(user) {
  return {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    avatar_url: user.avatar_url || '',
    bio: user.bio || '',
    created_at: user.created_at
  };
}

function refreshExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);
  return expiresAt;
}

async function persistRefreshToken(userId, token, conn = pool) {
  const tokenHash = hashRefreshToken(token);
  const expiresAt = refreshExpiryDate();

  await conn.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [userId, tokenHash, expiresAt]
  );

  return {
    refresh_token: token,
    refresh_token_expires_at: expiresAt
  };
}

async function buildAuthResponse(user, conn = pool) {
  const payload = safeUser(user);
  const accessToken = signAccessToken(payload);
  const refresh = await persistRefreshToken(payload.user_id, generateRefreshToken(), conn);

  return {
    user: payload,
    token: accessToken,
    access_token: accessToken,
    refresh_token: refresh.refresh_token,
    refresh_token_expires_at: refresh.refresh_token_expires_at
  };
}

export async function registerUser({ name, email, password, role = 'user' }) {
  const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
  if (existing.length) {
    const error = new Error('Email already exists');
    error.status = 409;
    throw error;
  }

  const hashed = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, hashed, role]
  );

  const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [result.insertId]);
  return buildAuthResponse(rows[0]);
}

export async function loginUser({ email, password }) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  const user = rows[0];
  if (!user) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  return buildAuthResponse(user);
}

export async function refreshUserToken(refreshToken) {
  if (!refreshToken?.trim()) {
    const error = new Error('Refresh token is required');
    error.status = 400;
    throw error;
  }

  const tokenHash = hashRefreshToken(refreshToken.trim());

  const [rows] = await pool.query(
    `SELECT rt.refresh_token_id, rt.user_id, rt.expires_at, rt.revoked_at,
            u.*
       FROM refresh_tokens rt
       JOIN users u ON u.user_id = rt.user_id
      WHERE rt.token_hash = ?
      LIMIT 1`,
    [tokenHash]
  );

  const record = rows[0];

  if (!record || record.revoked_at || new Date(record.expires_at) < new Date()) {
    const error = new Error('Refresh token is invalid or expired');
    error.status = 401;
    throw error;
  }

  await pool.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE refresh_token_id = ?', [
    record.refresh_token_id
  ]);

  return buildAuthResponse(record);
}

export async function revokeRefreshToken(refreshToken) {
  if (!refreshToken?.trim()) return { success: true };

  await pool.query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ? AND revoked_at IS NULL',
    [hashRefreshToken(refreshToken.trim())]
  );

  return { success: true };
}

export async function getProfile(userId) {
  const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [userId]);
  return safeUser(rows[0]);
}

export async function updateProfile(userId, { name, email, phone, avatar_url, bio }) {
  const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ? AND user_id <> ?', [email, userId]);
  if (existing.length) {
    const error = new Error('Email already exists');
    error.status = 409;
    throw error;
  }

  await pool.query(
    'UPDATE users SET name = ?, email = ?, phone = ?, avatar_url = ?, bio = ? WHERE user_id = ?',
    [name, email, phone || null, avatar_url || null, bio || null, userId]
  );

  return { user: await getProfile(userId) };
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [userId]);
  const user = rows[0];
  const ok = await bcrypt.compare(currentPassword, user.password_hash);
  if (!ok) {
    const error = new Error('Current password is incorrect');
    error.status = 400;
    throw error;
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [hashed, userId]);
  return { success: true };
}

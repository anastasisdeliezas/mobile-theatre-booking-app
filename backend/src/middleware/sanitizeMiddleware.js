const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const TAGS = /<[^>]*>?/g;
const SKIP_KEYS = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'token',
  'refresh_token',
  'access_token'
]);

function sanitizeString(value, key = '') {
  if (SKIP_KEYS.has(key)) {
    return String(value || '').replace(CONTROL_CHARS, '').slice(0, 1000);
  }

  return String(value || '')
    .replace(CONTROL_CHARS, '')
    .replace(TAGS, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 10000);
}

function sanitizeDeep(value, key = '') {
  if (typeof value === 'string') return sanitizeString(value, key);
  if (Array.isArray(value)) return value.map((item) => sanitizeDeep(item, key));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        sanitizeDeep(childValue, childKey)
      ])
    );
  }
  return value;
}

export function sanitizeRequest(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeDeep(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeDeep(req.query);
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeDeep(req.params);
  }

  next();
}

const EMAIL_REGEX = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/i;
const URL_REGEX = /^https?:\/\/[\w.-]+(?:\.[\w.-]+)+(?:[\w\-._~:/?#[\]@!$&'()*+,;=.]+)?$/i;
const LETTERS_AND_SPACES_REGEX = /^[\p{L} ]+$/u;
const MOBILE_DIGITS_REGEX = /^69\d{8}$/;

export function sanitizeText(value, maxLength = 255, options = {}) {
  const { preserveNewLines = false } = options;
  let output = String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .slice(0, maxLength);

  if (!preserveNewLines) {
    output = output.replace(/\s+/g, ' ');
  } else {
    output = output
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{4,}/g, '\n\n\n');
  }

  return output.trimStart();
}

export function normalizeEmail(value) {
  return sanitizeText(value, 180).trim().toLowerCase();
}

export function isValidEmail(value) {
  return EMAIL_REGEX.test(normalizeEmail(value));
}

export function validateEmail(value) {
  const email = normalizeEmail(value);
  if (!email) return 'Το email είναι υποχρεωτικό.';
  if (!isValidEmail(email)) return 'Συμπλήρωσε έγκυρο email.';
  return '';
}

export function normalizeName(value, maxLength = 120) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/[^\p{L} ]/gu, '')
    .replace(/\s+/g, ' ')
    .slice(0, maxLength);
}

export function validateName(value, label = 'Το όνομα') {
  const name = sanitizeText(value, 120).trim();
  if (!name) return `${label} είναι υποχρεωτικό.`;
  if (name.length < 2) return `${label} πρέπει να έχει τουλάχιστον 2 χαρακτήρες.`;
  if (!LETTERS_AND_SPACES_REGEX.test(name)) {
    return `${label} πρέπει να περιέχει μόνο γράμματα, χωρίς αριθμούς ή σύμβολα.`;
  }
  return '';
}

export function normalizePhone(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, 10);
}

export function validateOptionalPhone(value) {
  const phone = String(value ?? '').trim();
  if (!phone) return '';
  if (!/^\d+$/.test(phone)) return 'Το κινητό πρέπει να περιέχει μόνο αριθμούς.';
  if (phone.length !== 10) return 'Το κινητό πρέπει να έχει ακριβώς 10 ψηφία.';
  if (!MOBILE_DIGITS_REGEX.test(phone)) return 'Το κινητό πρέπει να ξεκινά με 69 και να έχει μορφή 69xxxxxxxx.';
  return '';
}

export function validatePassword(value, { required = true } = {}) {
  const password = String(value ?? '');
  if (!password && !required) return '';
  if (!password) return 'Ο κωδικός είναι υποχρεωτικός.';
  if (password.length < 8) return 'Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες.';
  if (password.length > 100) return 'Ο κωδικός είναι πολύ μεγάλος.';
  if (/\s/.test(password)) return 'Ο κωδικός δεν πρέπει να περιέχει κενά.';
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return 'Ο κωδικός χρειάζεται κεφαλαίο, μικρό και αριθμό.';
  }
  return '';
}

export function validateOptionalUrl(value) {
  const url = sanitizeText(value, 500).trim();
  if (!url) return '';
  if (!URL_REGEX.test(url) && !url.startsWith('/uploads/')) return 'Το URL δεν είναι έγκυρο.';
  return '';
}

export function validateMessage(value, { min = 2, max = 2000, label = 'Το κείμενο' } = {}) {
  const text = sanitizeText(value, max, { preserveNewLines: true }).trim();
  if (!text) return `${label} είναι υποχρεωτικό.`;
  if (text.length < min) return `${label} πρέπει να έχει τουλάχιστον ${min} χαρακτήρες.`;
  if (text.length > max) return `${label} πρέπει να είναι έως ${max} χαρακτήρες.`;
  return '';
}

export function cleanPromoCode(value) {
  return sanitizeText(value, 32).toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32);
}

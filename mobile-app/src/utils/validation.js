const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const TAGS = /<[^>]*>?/g;
const SPACES = /\s+/g;
const EMAIL_REGEX = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/i;
const LETTERS_AND_SPACES_REGEX = /^[\p{L} ]+$/u;
const MOBILE_DIGITS_REGEX = /^69\d{8}$/;

export function sanitizeText(value = '', maxLength = 500, { preserveNewLines = false } = {}) {
  let clean = String(value || '')
    .replace(CONTROL_CHARS, '')
    .replace(TAGS, '')
    .replace(/[<>]/g, '')
    .trim();

  if (!preserveNewLines) {
    clean = clean.replace(SPACES, ' ');
  } else {
    clean = clean
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  return clean.slice(0, maxLength);
}

export function normalizeEmail(value = '') {
  return sanitizeText(value, 190).toLowerCase();
}

export function isValidEmail(value = '') {
  return EMAIL_REGEX.test(normalizeEmail(value));
}

export function validateEmail(value = '', label = 'email') {
  const email = normalizeEmail(value);
  if (!email) return `Συμπλήρωσε ${label}.`;
  if (!isValidEmail(email)) return `Συμπλήρωσε έγκυρο ${label}.`;
  return '';
}

export function normalizeName(value = '', maxLength = 100) {
  return String(value || '')
    .replace(CONTROL_CHARS, '')
    .replace(TAGS, '')
    .replace(/[<>]/g, '')
    .replace(/[^\p{L} ]/gu, '')
    .replace(SPACES, ' ')
    .slice(0, maxLength);
}

export function validateName(value = '', label = 'ονοματεπώνυμο', minLength = 2) {
  const name = sanitizeText(value, 100);
  if (!name) return `Συμπλήρωσε ${label}.`;
  if (name.length < minLength) return `Το ${label} πρέπει να έχει τουλάχιστον ${minLength} χαρακτήρες.`;
  if (!LETTERS_AND_SPACES_REGEX.test(name)) {
    return `Το ${label} πρέπει να περιέχει μόνο γράμματα, χωρίς αριθμούς ή σύμβολα.`;
  }
  return '';
}

export function normalizePhone(value = '') {
  return String(value || '').replace(/\D/g, '').slice(0, 10);
}

export function validateOptionalPhone(value = '') {
  const phone = String(value || '').trim();
  if (!phone) return '';
  if (!/^\d+$/.test(phone)) return 'Το κινητό πρέπει να περιέχει μόνο αριθμούς.';
  if (phone.length !== 10) return 'Το κινητό πρέπει να έχει ακριβώς 10 ψηφία.';
  if (!MOBILE_DIGITS_REGEX.test(phone)) return 'Το κινητό πρέπει να ξεκινά με 69 και να έχει μορφή 69xxxxxxxx.';
  return '';
}

export function validatePassword(value = '', label = 'κωδικός') {
  const password = String(value || '');
  if (!password) return `Συμπλήρωσε ${label}.`;
  if (password.length < 8) return `Ο ${label} πρέπει να έχει τουλάχιστον 8 χαρακτήρες.`;
  if (password.length > 100) return `Ο ${label} είναι πολύ μεγάλος.`;
  if (/\s/.test(password)) return `Ο ${label} δεν πρέπει να περιέχει κενά.`;
  if (!/[A-ZΑ-Ω]/.test(password) || !/[a-zα-ω]/.test(password) || !/\d/.test(password)) {
    return `Ο ${label} πρέπει να έχει κεφαλαίο, μικρό γράμμα και αριθμό.`;
  }
  return '';
}

export function passwordStrength(value = '') {
  const password = String(value || '');
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-ZΑ-Ω]/.test(password) && /[a-zα-ω]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-zΑ-Ωα-ω0-9]/.test(password)) score += 1;

  if (!password) return { score: 0, label: 'Πληκτρολόγησε κωδικό', tone: 'muted' };
  if (score <= 2) return { score, label: 'Αδύναμος κωδικός', tone: 'danger' };
  if (score <= 4) return { score, label: 'Καλός κωδικός', tone: 'warning' };
  return { score, label: 'Ισχυρός κωδικός', tone: 'success' };
}

export function cleanPromoCode(value = '') {
  return sanitizeText(value, 80).toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 80);
}

export function validateMessage(value = '', label = 'μήνυμα', minLength = 5, maxLength = 4000) {
  const message = sanitizeText(value, maxLength, { preserveNewLines: true });
  if (!message) return `Συμπλήρωσε ${label}.`;
  if (message.length < minLength) return `Το ${label} πρέπει να έχει τουλάχιστον ${minLength} χαρακτήρες.`;
  if (message.length > maxLength) return `Το ${label} είναι πολύ μεγάλο.`;
  return '';
}

export function validateOptionalUrl(value = '', label = 'URL') {
  const url = sanitizeText(value, 500);
  if (!url) return '';
  if (url.startsWith('/uploads/')) return '';
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return `Το ${label} πρέπει να ξεκινά με http ή https.`;
    }
    return '';
  } catch {
    return `Το ${label} δεν είναι έγκυρο.`;
  }
}

export function luhnValid(value = '') {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export function validateExpiry(value = '') {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length !== 4) return 'Η ημερομηνία λήξης πρέπει να είναι στη μορφή MM/YY.';

  const month = Number(digits.slice(0, 2));
  const year = Number(`20${digits.slice(2)}`);
  if (month < 1 || month > 12) return 'Ο μήνας λήξης πρέπει να είναι από 01 έως 12.';

  const now = new Date();
  const expiryEnd = new Date(year, month, 0, 23, 59, 59);
  if (expiryEnd < now) return 'Η κάρτα φαίνεται ληγμένη.';

  return '';
}

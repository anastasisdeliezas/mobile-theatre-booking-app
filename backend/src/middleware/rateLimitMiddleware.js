import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Πάρα πολλές προσπάθειες σύνδεσης. Δοκίμασε ξανά σε λίγο.'
  }
});

export const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Έστειλες πάρα πολλά μηνύματα επικοινωνίας. Δοκίμασε ξανά αργότερα.'
  }
});

export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Έγιναν πάρα πολλές μεταφορτώσεις. Δοκίμασε ξανά αργότερα.'
  }
});
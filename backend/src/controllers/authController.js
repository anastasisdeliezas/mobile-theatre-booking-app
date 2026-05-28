import { z } from 'zod';
import {
  changePassword,
  getProfile,
  loginUser,
  refreshUserToken,
  registerUser,
  revokeRefreshToken,
  updateProfile
} from '../services/authService.js';

const LETTERS_AND_SPACES_REGEX = /^[\p{L} ]+$/u;
const GREEK_MOBILE_REGEX = /^69\d{8}$/;

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Συμπλήρωσε έγκυρο email.')
  .max(190, 'Το email είναι πολύ μεγάλο.');

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Το ονοματεπώνυμο πρέπει να έχει τουλάχιστον 2 χαρακτήρες.')
  .max(100, 'Το ονοματεπώνυμο είναι πολύ μεγάλο.')
  .refine((value) => LETTERS_AND_SPACES_REGEX.test(value), {
    message: 'Το ονοματεπώνυμο πρέπει να περιέχει μόνο γράμματα, χωρίς αριθμούς ή σύμβολα.'
  });

const strongPasswordSchema = z
  .string()
  .min(8, 'Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες.')
  .max(100, 'Ο κωδικός είναι πολύ μεγάλος.')
  .refine((value) => !/\s/.test(value), {
    message: 'Ο κωδικός δεν πρέπει να περιέχει κενά.'
  })
  .refine((value) => /[A-ZΑ-Ω]/.test(value) && /[a-zα-ω]/.test(value) && /\d/.test(value), {
    message: 'Ο κωδικός πρέπει να έχει κεφαλαίο, μικρό γράμμα και αριθμό.'
  });

const optionalUrlSchema = z
  .string()
  .trim()
  .max(500, 'Το URL είναι πολύ μεγάλο.')
  .optional()
  .or(z.literal(''))
  .refine(
    (value) => {
      if (!value) return true;
      if (value.startsWith('/uploads/')) return true;
      try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol);
      } catch {
        return false;
      }
    },
    { message: 'Το URL πρέπει να είναι έγκυρο http/https ή αρχείο uploads.' }
  );

const phoneSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .refine((value) => !value || /^\d+$/.test(value), {
    message: 'Το κινητό πρέπει να περιέχει μόνο αριθμούς.'
  })
  .refine((value) => !value || value.length === 10, {
    message: 'Το κινητό πρέπει να έχει ακριβώς 10 ψηφία.'
  })
  .refine((value) => !value || GREEK_MOBILE_REGEX.test(value), {
    message: 'Το κινητό πρέπει να ξεκινά με 69 και να έχει μορφή 69xxxxxxxx.'
  });

const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: strongPasswordSchema
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Συμπλήρωσε τον κωδικό σου.').max(100)
});

const refreshSchema = z.object({
  refresh_token: z.string().trim().min(20)
});

const profileSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  avatar_url: optionalUrlSchema,
  bio: z.string().trim().max(500).optional().or(z.literal(''))
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Συμπλήρωσε τον τρέχοντα κωδικό.').max(100),
    newPassword: strongPasswordSchema
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Ο νέος κωδικός πρέπει να είναι διαφορετικός από τον τρέχοντα.',
    path: ['newPassword']
  });

function resolveAuthUserId(user) {
  return user?.user_id ?? user?.userId ?? user?.id ?? user?.sub ?? null;
}

export async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);
    const result = await registerUser(data);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);
    const result = await loginUser(data);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    const data = refreshSchema.parse(req.body);
    res.json(await refreshUserToken(data.refresh_token));
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    const data = refreshSchema.parse(req.body);
    res.json(await revokeRefreshToken(data.refresh_token));
  } catch (error) {
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    res.json({ user: await getProfile(resolveAuthUserId(req.user)) });
  } catch (error) {
    next(error);
  }
}

export async function profile(req, res, next) {
  try {
    res.json({ user: await getProfile(resolveAuthUserId(req.user)) });
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const data = profileSchema.parse(req.body);
    res.json(await updateProfile(resolveAuthUserId(req.user), data));
  } catch (error) {
    next(error);
  }
}

export async function updatePassword(req, res, next) {
  try {
    const data = passwordSchema.parse(req.body);
    res.json(await changePassword(resolveAuthUserId(req.user), data));
  } catch (error) {
    next(error);
  }
}

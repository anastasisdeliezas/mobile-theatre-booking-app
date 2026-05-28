import { z } from 'zod';
import {
  createAdminContactReply,
  createContactMessage,
  createUserContactReply,
  getAdminContactMessages,
  getContactMessageThreadForAdmin,
  getContactMessageThreadForUser,
  getUserContactMessages,
  updateContactMessageStatus
} from '../services/contactService.js';

const LETTERS_AND_SPACES_REGEX = /^[\p{L} ]+$/u;

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Το ονοματεπώνυμο πρέπει να έχει τουλάχιστον 2 χαρακτήρες.')
    .max(120, 'Το ονοματεπώνυμο είναι πολύ μεγάλο.')
    .refine((value) => LETTERS_AND_SPACES_REGEX.test(value), {
      message: 'Το ονοματεπώνυμο πρέπει να περιέχει μόνο γράμματα, χωρίς αριθμούς ή σύμβολα.'
    }),
  email: z
    .string()
    .trim()
    .email('Το email δεν είναι έγκυρο.')
    .toLowerCase(),
  subject: z
    .string()
    .trim()
    .max(160, 'Το θέμα είναι πολύ μεγάλο.')
    .optional()
    .or(z.literal('')),
  message: z
    .string()
    .trim()
    .min(5, 'Το μήνυμα πρέπει να έχει τουλάχιστον 5 χαρακτήρες.')
    .max(4000, 'Το μήνυμα είναι πολύ μεγάλο.')
});

const statusSchema = z.object({
  status: z.enum(['new', 'read', 'replied'])
});

const replySchema = z.object({
  body: z
    .string()
    .trim()
    .min(2, 'Η απάντηση πρέπει να έχει τουλάχιστον 2 χαρακτήρες.')
    .max(4000, 'Η απάντηση είναι πολύ μεγάλη.')
});

export async function createMessage(req, res, next) {
  try {
    const data = contactSchema.parse(req.body);
    res.status(201).json(await createContactMessage(data));
  } catch (error) {
    next(error);
  }
}

export async function listMessages(req, res, next) {
  try {
    res.json(
      await getAdminContactMessages({
        q: req.query.q || '',
        status: req.query.status || 'all'
      })
    );
  } catch (error) {
    next(error);
  }
}

export async function changeMessageStatus(req, res, next) {
  try {
    const data = statusSchema.parse(req.body);
    res.json(await updateContactMessageStatus(Number(req.params.id), data.status));
  } catch (error) {
    next(error);
  }
}

export async function listUserMessages(req, res, next) {
  try {
    res.json(await getUserContactMessages(req.user));
  } catch (error) {
    next(error);
  }
}

export async function getAdminMessageThread(req, res, next) {
  try {
    res.json(await getContactMessageThreadForAdmin(Number(req.params.id)));
  } catch (error) {
    next(error);
  }
}

export async function getUserMessageThread(req, res, next) {
  try {
    res.json(
      await getContactMessageThreadForUser(Number(req.params.id), req.user)
    );
  } catch (error) {
    next(error);
  }
}

export async function createAdminReply(req, res, next) {
  try {
    const data = replySchema.parse(req.body);
    res
      .status(201)
      .json(await createAdminContactReply(Number(req.params.id), req.user, data.body));
  } catch (error) {
    next(error);
  }
}

export async function createUserReply(req, res, next) {
  try {
    const data = replySchema.parse(req.body);
    res
      .status(201)
      .json(await createUserContactReply(Number(req.params.id), req.user, data.body));
  } catch (error) {
    next(error);
  }
}
import { z } from 'zod';
import { createNewsletterSubscription } from '../services/newsletterService.js';

const subscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(190),
  source: z.string().trim().max(40).optional()
});

export async function subscribeNewsletter(req, res, next) {
  try {
    const data = subscribeSchema.parse(req.body || {});

    const result = await createNewsletterSubscription({
      email: data.email,
      source: data.source || 'mobile_app'
    });

    res.status(result.already_exists ? 200 : 201).json(result);
  } catch (error) {
    next(error);
  }
}

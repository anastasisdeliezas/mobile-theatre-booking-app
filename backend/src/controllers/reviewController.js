import { z } from 'zod';
import {
  createShowReview,
  deleteShowReview,
  getShowReviews,
  updateShowReview
} from '../services/reviewService.js';

const idSchema = z.coerce.number().int().positive();

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(160).optional().or(z.literal('')),
  comment: z.string().trim().min(10).max(2000)
});

export async function listShowReviews(req, res, next) {
  try {
    const showId = idSchema.parse(req.params.showId);
    res.json(await getShowReviews(showId));
  } catch (error) {
    next(error);
  }
}

export async function addShowReview(req, res, next) {
  try {
    const showId = idSchema.parse(req.params.showId);
    const payload = reviewSchema.parse(req.body || {});
    const review = await createShowReview(showId, req.user, payload);
    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
}

export async function updateOwnReview(req, res, next) {
  try {
    const reviewId = idSchema.parse(req.params.reviewId);
    const payload = reviewSchema.parse(req.body || {});
    res.json(await updateShowReview(reviewId, req.user, payload));
  } catch (error) {
    next(error);
  }
}

export async function deleteOwnReview(req, res, next) {
  try {
    const reviewId = idSchema.parse(req.params.reviewId);
    res.json(await deleteShowReview(reviewId, req.user));
  } catch (error) {
    next(error);
  }
}

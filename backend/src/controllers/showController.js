import { z } from 'zod';
import {
  createShow,
  createShowtime,
  getShowById,
  getShows,
  getShowtimes,
  removeShow,
  removeShowtime,
  updateShow,
  updateShowtime
} from '../services/showService.js';

const idSchema = z.coerce.number().int().positive();

const showSchema = z.object({
  theatre_id: z.coerce.number().int().positive(),
  title: z.string().trim().min(1).max(200),
  genre: z.string().trim().max(80).optional().or(z.literal('')),
  description: z.string().trim().max(4000).optional().or(z.literal('')),
  duration_minutes: z.coerce.number().int().min(1).max(1000),
  age_rating: z.string().trim().min(1).max(20),
  poster_url: z.string().trim().max(500).optional().or(z.literal('')),
  hero_image_url: z.string().trim().max(500).optional().or(z.literal('')),
  trailer_url: z.string().trim().max(1000).optional().or(z.literal('')),
  overview_text: z.string().trim().max(6000).optional().or(z.literal('')),
  cast_text: z.string().trim().max(6000).optional().or(z.literal('')),
  creatives_text: z.string().trim().max(6000).optional().or(z.literal('')),
  highlights_text: z.string().trim().max(6000).optional().or(z.literal('')),
  audience_text: z.string().trim().max(6000).optional().or(z.literal('')),
  content_warnings_text: z.string().trim().max(3000).optional().or(z.literal(''))
});

const showtimeSchema = z.object({
  show_id: z.coerce.number().int().positive(),
  hall_name: z.string().trim().min(1).max(100),
  start_time: z.string().trim().min(1),
  base_price: z.coerce.number().min(0).max(10000)
});

export async function listShows(req, res, next) {
  try {
    res.json(await getShows(req.query));
  } catch (error) {
    next(error);
  }
}

export async function getShow(req, res, next) {
  try {
    const id = idSchema.parse(req.params.id);
    const show = await getShowById(id);

    if (!show) {
      return res.status(404).json({ message: 'Η παράσταση δεν βρέθηκε' });
    }

    res.json(show);
  } catch (error) {
    next(error);
  }
}

export async function addShow(req, res, next) {
  try {
    const data = showSchema.parse(req.body);
    res.status(201).json(await createShow(data));
  } catch (error) {
    next(error);
  }
}

export async function editShow(req, res, next) {
  try {
    const id = idSchema.parse(req.params.id);
    const data = showSchema.parse(req.body);
    res.json(await updateShow(id, data));
  } catch (error) {
    next(error);
  }
}

export async function deleteShow(req, res, next) {
  try {
    const id = idSchema.parse(req.params.id);
    res.json(await removeShow(id));
  } catch (error) {
    next(error);
  }
}

export async function listShowtimes(req, res, next) {
  try {
    const showId = req.query.showId ? idSchema.parse(req.query.showId) : null;
    res.json(await getShowtimes(showId));
  } catch (error) {
    next(error);
  }
}

export async function addShowtime(req, res, next) {
  try {
    const data = showtimeSchema.parse(req.body);
    res.status(201).json(await createShowtime(data));
  } catch (error) {
    next(error);
  }
}

export async function editShowtime(req, res, next) {
  try {
    const id = idSchema.parse(req.params.id);
    const data = showtimeSchema.parse(req.body);
    res.json(await updateShowtime(id, data));
  } catch (error) {
    next(error);
  }
}

export async function deleteShowtime(req, res, next) {
  try {
    const id = idSchema.parse(req.params.id);
    res.json(await removeShowtime(id));
  } catch (error) {
    next(error);
  }
}
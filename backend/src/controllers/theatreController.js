import { z } from 'zod';
import {
  createTheatre,
  getTheatres,
  removeTheatre,
  updateTheatre
} from '../services/theatreService.js';

const theatreSchema = z.object({
  name: z.string().trim().min(2).max(120),
  location: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  avatar_url: z.string().trim().max(500).optional().or(z.literal('')),
  intro_text: z.string().trim().max(2500).optional().or(z.literal('')),
  space_overview: z.string().trim().max(2500).optional().or(z.literal('')),
  booking_info: z.string().trim().max(2500).optional().or(z.literal(''))
});

const idSchema = z.coerce.number().int().positive();

export async function listTheatres(req, res, next) {
  try {
    res.json(await getTheatres(req.query));
  } catch (error) {
    next(error);
  }
}

export async function addTheatre(req, res, next) {
  try {
    const data = theatreSchema.parse(req.body);
    res.status(201).json(await createTheatre(data));
  } catch (error) {
    next(error);
  }
}

export async function editTheatre(req, res, next) {
  try {
    const id = idSchema.parse(req.params.id);
    const data = theatreSchema.parse(req.body);
    res.json(await updateTheatre(id, data));
  } catch (error) {
    next(error);
  }
}

export async function deleteTheatre(req, res, next) {
  try {
    const id = idSchema.parse(req.params.id);
    res.json(await removeTheatre(id));
  } catch (error) {
    next(error);
  }
}
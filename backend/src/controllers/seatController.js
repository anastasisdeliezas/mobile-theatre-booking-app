import { z } from 'zod';
import { getSeatsByShowtime } from '../services/seatService.js';

const querySchema = z.object({
  showtimeId: z.coerce.number().int().positive()
});

export async function listSeats(req, res, next) {
  try {
    const { showtimeId } = querySchema.parse(req.query);
    res.json(await getSeatsByShowtime(showtimeId));
  } catch (error) {
    next(error);
  }
}

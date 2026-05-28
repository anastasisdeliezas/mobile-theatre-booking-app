import { ZodError } from 'zod';
import multer from 'multer';

export function errorHandler(err, req, res, next) {
  console.error(err);

  if (res.headersSent) return next(err);

  if (err instanceof ZodError) {
    const firstIssue = err.issues?.[0];

    return res.status(400).json({
      message: firstIssue?.message || 'Μη έγκυρα δεδομένα',
      issues: err.issues || []
    });
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'Το αρχείο είναι πολύ μεγάλο. Μέγιστο μέγεθος 5MB.'
      });
    }

    return res.status(400).json({
      message: err.message || 'Σφάλμα μεταφόρτωσης αρχείου.'
    });
  }

  return res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  });
}
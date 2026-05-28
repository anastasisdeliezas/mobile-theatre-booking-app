import {
  createAdminUser,
  deleteAdminReview,
  deleteAdminUser,
  deleteAdminNewsletterSubscriber,
  getAdminReservations,
  getAdminReviews,
  getAdminStats,
  getAdminUserReservations,
  getAdminUsers,
  getAdminNewsletterSubscribers,
  updateAdminReview,
  updateAdminUser,
  updateAdminNewsletterSubscriber
} from '../services/adminService.js';

export async function stats(req, res, next) {
  try {
    res.json(await getAdminStats());
  } catch (error) {
    next(error);
  }
}

export async function listReservations(req, res, next) {
  try {
    res.json(
      await getAdminReservations({
        q: req.query.q || '',
        status: req.query.status || 'all',
        showId: req.query.showId || 'all',
        date: req.query.date || ''
      })
    );
  } catch (error) {
    next(error);
  }
}

export async function listUsers(req, res, next) {
  try {
    res.json(
      await getAdminUsers({
        q: req.query.q || '',
        role: req.query.role || 'all'
      })
    );
  } catch (error) {
    next(error);
  }
}

export async function createUser(req, res, next) {
  try {
    res.status(201).json(await createAdminUser(req.body || {}));
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    res.json(await updateAdminUser(Number(req.params.id), req.body || {}));
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    await deleteAdminUser(Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function userReservations(req, res, next) {
  try {
    res.json(await getAdminUserReservations(Number(req.params.id)));
  } catch (error) {
    next(error);
  }
}

export async function listNewsletterSubscribers(req, res, next) {
  try {
    res.json(
      await getAdminNewsletterSubscribers({
        q: req.query.q || '',
        status: req.query.status || 'all'
      })
    );
  } catch (error) {
    next(error);
  }
}

export async function updateNewsletterSubscriber(req, res, next) {
  try {
    res.json(
      await updateAdminNewsletterSubscriber(Number(req.params.id), req.body || {})
    );
  } catch (error) {
    next(error);
  }
}

export async function deleteNewsletterSubscriber(req, res, next) {
  try {
    res.json(await deleteAdminNewsletterSubscriber(Number(req.params.id)));
  } catch (error) {
    next(error);
  }
}

export async function listReviews(req, res, next) {
  try {
    res.json(
      await getAdminReviews({
        q: req.query.q || '',
        status: req.query.status || 'all',
        showId: req.query.showId || 'all'
      })
    );
  } catch (error) {
    next(error);
  }
}

export async function updateReview(req, res, next) {
  try {
    res.json(await updateAdminReview(Number(req.params.id), req.body || {}));
  } catch (error) {
    next(error);
  }
}

export async function deleteReview(req, res, next) {
  try {
    res.json(await deleteAdminReview(Number(req.params.id)));
  } catch (error) {
    next(error);
  }
}

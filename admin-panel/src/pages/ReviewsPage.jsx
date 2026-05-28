import React, { useEffect, useMemo, useState } from 'react';
import api, { getApiErrorMessage } from '../api/client';
import { sanitizeText } from '../utils/validation';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('el-GR');
  } catch {
    return value;
  }
}

function statusLabel(status) {
  return status === 'hidden' ? 'Κρυφή' : 'Εγκεκριμένη';
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [shows, setShows] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [showId, setShowId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');

      const [reviewsRes, showsRes] = await Promise.all([
        api.get('/admin/reviews', {
          params: {
            q: query,
            status,
            showId
          }
        }),
        api.get('/shows')
      ]);

      setReviews(reviewsRes.data || []);
      setShows(showsRes.data || []);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Η φόρτωση των κριτικών απέτυχε.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [query, status, showId]);

  const stats = useMemo(() => {
    return {
      total: reviews.length,
      approved: reviews.filter((item) => item.status === 'approved').length,
      hidden: reviews.filter((item) => item.status === 'hidden').length
    };
  }, [reviews]);

  const setReviewStatus = async (reviewId, nextStatus) => {
    try {
      setBusyId(reviewId);
      setError('');
      setSuccess('');

      await api.put(`/admin/reviews/${reviewId}`, {
        status: nextStatus
      });

      setReviews((prev) =>
        prev.map((item) =>
          item.review_id === reviewId ? { ...item, status: nextStatus } : item
        )
      );

      setSuccess(
        nextStatus === 'hidden'
          ? 'Η κριτική αποκρύφτηκε επιτυχώς.'
          : 'Η κριτική είναι ξανά ορατή.'
      );
    } catch (e) {
      setError(getApiErrorMessage(e, 'Η ενημέρωση της κριτικής απέτυχε.'));
    } finally {
      setBusyId(null);
    }
  };

  const removeReview = async (reviewId) => {
    const ok = window.confirm('Θέλεις σίγουρα να διαγράψεις αυτή την κριτική;');
    if (!ok) return;

    try {
      setBusyId(reviewId);
      setError('');
      setSuccess('');

      await api.delete(`/admin/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((item) => item.review_id !== reviewId));
      setSuccess('Η κριτική διαγράφηκε επιτυχώς.');
    } catch (e) {
      setError(getApiErrorMessage(e, 'Η διαγραφή της κριτικής απέτυχε.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page-stack">
      <section className="summary-strip summary-strip-3">
        <div className="glass-card summary-card">
          <span>Σύνολο κριτικών</span>
          <strong>{stats.total}</strong>
          <p>Όλες οι καταχωρήσεις που βρέθηκαν με τα τρέχοντα φίλτρα</p>
        </div>

        <div className="glass-card summary-card">
          <span>Εγκεκριμένες</span>
          <strong>{stats.approved}</strong>
          <p>Κριτικές που εμφανίζονται αυτή τη στιγμή στο mobile app</p>
        </div>

        <div className="glass-card summary-card">
          <span>Κρυφές</span>
          <strong>{stats.hidden}</strong>
          <p>Κριτικές που έχουν αφαιρεθεί από τη δημόσια προβολή</p>
        </div>
      </section>

      {error ? <div className="form-banner form-banner-error">{error}</div> : null}
      {success ? <div className="form-banner form-banner-success">{success}</div> : null}

      <section className="surface-card list-card">
        <div className="list-header">
          <div>
            <h3 className="section-heading">Λίστα κριτικών</h3>
            <p className="section-subtitle">
              Διαχειρίσου αξιολογήσεις κοινού για κάθε παράσταση.
            </p>
          </div>
        </div>

        <div className="toolbar-row">
          <input
            className="form-input toolbar-search"
            placeholder="Αναζήτηση με όνομα, email, τίτλο, σχόλιο ή παράσταση"
            value={query}
            onChange={(e) => setQuery(sanitizeText(e.target.value, 80))}
          />

          <select
            className="form-select toolbar-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">Όλες οι καταστάσεις</option>
            <option value="approved">Εγκεκριμένες</option>
            <option value="hidden">Κρυφές</option>
          </select>

          <select
            className="form-select toolbar-select"
            value={showId}
            onChange={(e) => setShowId(e.target.value)}
          >
            <option value="all">Όλες οι παραστάσεις</option>
            {shows.map((item) => (
              <option key={item.show_id} value={item.show_id}>
                {item.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="ghost-button"
            onClick={() => {
              setQuery('');
              setStatus('all');
              setShowId('all');
            }}
          >
            Καθαρισμός
          </button>
        </div>

        {loading ? (
          <div className="empty-state-card">
            <strong>Φόρτωση κριτικών...</strong>
          </div>
        ) : reviews.length ? (
          <div className="catalog-grid">
            {reviews.map((item) => {
              const isBusy = busyId === item.review_id;

              return (
                <article key={item.review_id} className="catalog-card">
                  <div className="catalog-body">
                    <div className="catalog-row-top">
                      <div>
                        <h4>{item.title || 'Χωρίς τίτλο'}</h4>
                        <span>{item.show_title} · {item.theatre_name}</span>
                      </div>

                      <span className={`status-pill ${item.status === 'hidden' ? 'danger' : 'success'}`}>
                        {statusLabel(item.status)}
                      </span>
                    </div>

                    <p className="catalog-copy">
                      {item.comment}
                    </p>

                    <div className="detail-chip-row">
                      <span className="detail-chip">Βαθμολογία: {item.rating}/5</span>
                      <span className="detail-chip">{item.reviewer_name || 'Χρήστης'}</span>
                      <span className="detail-chip">{item.reviewer_email || 'Χωρίς email'}</span>
                      <span className="detail-chip">{formatDate(item.created_at)}</span>
                    </div>

                    <div className="button-row">
                      {item.status === 'approved' ? (
                        <button
                          className="secondary-button"
                          disabled={isBusy}
                          onClick={() => setReviewStatus(item.review_id, 'hidden')}
                        >
                          Απόκρυψη
                        </button>
                      ) : (
                        <button
                          className="secondary-button"
                          disabled={isBusy}
                          onClick={() => setReviewStatus(item.review_id, 'approved')}
                        >
                          Έγκριση
                        </button>
                      )}

                      <button
                        className="danger-button"
                        disabled={isBusy}
                        onClick={() => removeReview(item.review_id)}
                      >
                        Διαγραφή
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <article className="catalog-card empty-state-card">
            <div>
              <strong>Δεν βρέθηκαν κριτικές</strong>
              <span>Δοκίμασε άλλα φίλτρα ή περίμενε νέες καταχωρήσεις από τους χρήστες.</span>
            </div>
          </article>
        )}
      </section>
    </div>
  );
}

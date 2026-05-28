import React, { useEffect, useMemo, useState } from 'react';
import api, { getApiErrorMessage } from '../api/client';
import { sanitizeText } from '../utils/validation';

const ITEMS_PER_PAGE = 12;

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('el-GR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

export default function NewsletterPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try {
      setError('');
      const { data } = await api.get('/admin/newsletter', {
        params: {
          q: query,
          status: statusFilter
        }
      });
      setItems(data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Η φόρτωση newsletter απέτυχε.'));
    }
  };

  useEffect(() => {
    load();
  }, [query, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [items, currentPage]);

  const activeCount = useMemo(
    () => items.filter((item) => item.status === 'active').length,
    [items]
  );

  const unsubscribedCount = useMemo(
    () => items.filter((item) => item.status === 'unsubscribed').length,
    [items]
  );

  const visibleStart = items.length ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const visibleEnd = items.length ? Math.min(currentPage * ITEMS_PER_PAGE, items.length) : 0;

  const updateStatus = async (subscriberId, nextStatus) => {
    try {
      setError('');
      setSuccess('');
      await api.put(`/admin/newsletter/${subscriberId}`, { status: nextStatus });
      await load();
      setSuccess(
        nextStatus === 'active'
          ? 'Η εγγραφή ενεργοποιήθηκε επιτυχώς.'
          : 'Η εγγραφή σημειώθηκε ως ανενεργή.'
      );
    } catch (err) {
      setError(getApiErrorMessage(err, 'Η ενημέρωση απέτυχε.'));
    }
  };

  const removeSubscriber = async (subscriberId) => {
    const ok = window.confirm('Θέλεις σίγουρα να διαγράψεις αυτή την εγγραφή newsletter;');
    if (!ok) return;

    try {
      setError('');
      setSuccess('');
      await api.delete(`/admin/newsletter/${subscriberId}`);
      await load();
      setSuccess('Η εγγραφή newsletter διαγράφηκε επιτυχώς.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Η διαγραφή απέτυχε.'));
    }
  };

  return (
    <div className="page-stack">
      <section className="summary-strip summary-strip-3">
        <div className="glass-card summary-card">
          <span>Σύνολο εγγραφών</span>
          <strong>{items.length}</strong>
          <p>Emails που ταιριάζουν στα ενεργά φίλτρα</p>
        </div>
        <div className="glass-card summary-card">
          <span>Ενεργές</span>
          <strong>{activeCount}</strong>
          <p>Εγγεγραμμένοι παραλήπτες newsletter</p>
        </div>
        <div className="glass-card summary-card">
          <span>Ανενεργές</span>
          <strong>{unsubscribedCount}</strong>
          <p>Εγγραφές που έχουν απενεργοποιηθεί</p>
        </div>
      </section>

      <section className="surface-card list-card">
        <div className="list-header theatres-list-header">
          <div>
            <h3 className="section-heading">Newsletter</h3>
            <p className="section-subtitle">
              Διαχείριση εγγραφών newsletter, κατάστασης παραλήπτη και ιστορικού εγγραφής.
            </p>
          </div>
          <div className="theatres-header-actions">
            <div className="muted-badge">
              {visibleStart}-{visibleEnd} από {items.length}
            </div>
          </div>
        </div>

        {error ? <div className="form-banner form-banner-error">{error}</div> : null}
        {success ? <div className="form-banner form-banner-success">{success}</div> : null}

        <div className="toolbar-row theatres-toolbar">
          <input
            className="form-input toolbar-search"
            placeholder="Αναζήτηση με email"
            value={query}
            onChange={(e) => setQuery(sanitizeText(e.target.value, 80))}
          />

          <select
            className="form-select toolbar-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Όλες οι καταστάσεις</option>
            <option value="active">Ενεργές</option>
            <option value="unsubscribed">Ανενεργές</option>
          </select>

          <button
            type="button"
            className="ghost-button"
            onClick={() => {
              setQuery('');
              setStatusFilter('all');
              setError('');
              setSuccess('');
            }}
          >
            Καθαρισμός
          </button>
        </div>

        <div className="catalog-grid users-grid">
          {paginatedItems.length ? (
            paginatedItems.map((item) => (
              <article
                key={item.subscriber_id}
                className="catalog-card user-card user-card-compact"
              >
                <div className="catalog-body">
                  <div className="user-card-top">
                    <div className="user-main-info">
                      <h4>{item.email}</h4>
                      <span>Πηγή: {item.source || '—'}</span>
                    </div>

                    <span className={`status-pill ${item.status === 'active' ? 'success' : 'muted'}`}>
                      {item.status === 'active' ? 'Ενεργή' : 'Ανενεργή'}
                    </span>
                  </div>

                  <div className="reservation-meta-grid user-meta-grid">
                    <div className="reservation-meta-chip">
                      <span>Εγγραφή</span>
                      <strong>{formatDateTime(item.created_at)}</strong>
                    </div>
                    <div className="reservation-meta-chip">
                      <span>Τελευταία ενημέρωση</span>
                      <strong>{formatDateTime(item.updated_at)}</strong>
                    </div>
                    <div className="reservation-meta-chip">
                      <span>Απενεργοποίηση</span>
                      <strong>{formatDateTime(item.unsubscribed_at)}</strong>
                    </div>
                  </div>

                  <div className="button-row user-card-actions">
                    {item.status === 'active' ? (
                      <button
                        className="secondary-button"
                        onClick={() => updateStatus(item.subscriber_id, 'unsubscribed')}
                      >
                        Απενεργοποίηση
                      </button>
                    ) : (
                      <button
                        className="secondary-button"
                        onClick={() => updateStatus(item.subscriber_id, 'active')}
                      >
                        Επανενεργοποίηση
                      </button>
                    )}

                    <button
                      className="ghost-button"
                      onClick={() => removeSubscriber(item.subscriber_id)}
                    >
                      Διαγραφή
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <article className="catalog-card empty-state-card">
              <div>
                <strong>Δεν βρέθηκαν εγγραφές</strong>
                <span>Δοκίμασε άλλη αναζήτηση ή άλλαξε το φίλτρο κατάστασης.</span>
              </div>
            </article>
          )}
        </div>

        {items.length > ITEMS_PER_PAGE ? (
          <div className="pagination-bar">
            <div className="pagination-meta">Σελίδα {currentPage} από {totalPages}</div>
            <div className="pagination-controls">
              <button
                type="button"
                className="ghost-button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Προηγούμενη
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                .map((page, index, arr) => (
                  <React.Fragment key={page}>
                    {index > 0 && arr[index - 1] !== page - 1 ? (
                      <span className="pagination-ellipsis">…</span>
                    ) : null}
                    <button
                      type="button"
                      className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}

              <button
                type="button"
                className="ghost-button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              >
                Επόμενη
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

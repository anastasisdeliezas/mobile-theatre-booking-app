import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { sanitizeText, validateMessage } from '../utils/validation';

const ITEMS_PER_PAGE = 12;

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('el-GR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function statusLabel(status) {
  if (status === 'new') return 'Νέο';
  if (status === 'read') return 'Διαβασμένο';
  if (status === 'replied') return 'Απαντημένο';
  return status || '—';
}

function statusClass(status) {
  if (status === 'new') return 'warning';
  if (status === 'read') return 'info';
  if (status === 'replied') return 'success';
  return 'muted';
}

function senderLabel(senderType) {
  if (senderType === 'admin') return 'Admin';
  if (senderType === 'user') return 'Χρήστης';
  return senderType || '—';
}

export default function MessagesPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isThreadOpen, setIsThreadOpen] = useState(false);
  const [activeMessage, setActiveMessage] = useState(null);
  const [thread, setThread] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [loadingThread, setLoadingThread] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  const load = async () => {
    const { data } = await api.get('/contact/admin', {
      params: { q: query, status: statusFilter }
    });
    setItems(data || []);
  };

  useEffect(() => {
    load();
  }, [query, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter]);

  const updateStatus = async (messageId, status) => {
    try {
      setError('');
      setSuccess('');
      await api.patch(`/contact/admin/${messageId}/status`, { status });
      setSuccess('Η κατάσταση του μηνύματος ενημερώθηκε επιτυχώς.');
      await load();
    } catch (error) {
      setError(error?.response?.data?.message || 'Η ενημέρωση κατάστασης απέτυχε.');
    }
  };

  const openThread = async (item) => {
    try {
      setError('');
      setSuccess('');
      setActiveMessage(item);
      setReplyBody('');
      setThread(null);
      setIsThreadOpen(true);
      setLoadingThread(true);

      const { data } = await api.get(`/contact/admin/${item.message_id}/replies`);
      setThread(data || null);

      if (item.status === 'new') {
        await api.patch(`/contact/admin/${item.message_id}/status`, {
          status: 'read'
        });
        await load();
      }
    } catch (error) {
      setError(error?.response?.data?.message || 'Η φόρτωση της συζήτησης απέτυχε.');
      setIsThreadOpen(false);
    } finally {
      setLoadingThread(false);
    }
  };

  const closeThread = () => {
    setIsThreadOpen(false);
    setActiveMessage(null);
    setThread(null);
    setReplyBody('');
    setLoadingThread(false);
    setSendingReply(false);
  };

  const sendReply = async () => {
    try {
      setError('');
      setSuccess('');

      if (!activeMessage?.message_id) {
        setError('Δεν βρέθηκε το μήνυμα.');
        return;
      }

      const cleanReply = sanitizeText(replyBody, 2000, { preserveNewLines: true }).trim();
      const replyError = validateMessage(cleanReply, {
        min: 2,
        max: 2000,
        label: 'Η απάντηση'
      });
      if (replyError) {
        setError(replyError);
        setReplyBody(cleanReply);
        return;
      }

      setSendingReply(true);

      await api.post(`/contact/admin/${activeMessage.message_id}/replies`, {
        body: cleanReply
      });

      setReplyBody('');
      const { data } = await api.get(`/contact/admin/${activeMessage.message_id}/replies`);
      setThread(data || null);

      await load();
      setSuccess('Η απάντηση στάλθηκε επιτυχώς.');
    } catch (error) {
      setError(error?.response?.data?.message || 'Η αποστολή απάντησης απέτυχε.');
    } finally {
      setSendingReply(false);
    }
  };

  const newCount = useMemo(
    () => items.filter((item) => item.status === 'new').length,
    [items]
  );

  const readCount = useMemo(
    () => items.filter((item) => item.status === 'read').length,
    [items]
  );

  const repliedCount = useMemo(
    () => items.filter((item) => item.status === 'replied').length,
    [items]
  );

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [items, currentPage]);

  const visibleStart = items.length ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const visibleEnd = items.length ? Math.min(currentPage * ITEMS_PER_PAGE, items.length) : 0;

  return (
    <div className="page-stack">
      <section className="summary-strip summary-strip-4">
        <div className="glass-card summary-card">
          <span>Σύνολο μηνυμάτων</span>
          <strong>{items.length}</strong>
          <p>Μηνύματα που ταιριάζουν στα ενεργά φίλτρα</p>
        </div>

        <div className="glass-card summary-card">
          <span>Νέα</span>
          <strong>{newCount}</strong>
          <p>Μηνύματα που δεν έχουν ακόμη ανοιχτεί</p>
        </div>

        <div className="glass-card summary-card">
          <span>Διαβασμένα</span>
          <strong>{readCount}</strong>
          <p>Μηνύματα που έχουν ελεγχθεί</p>
        </div>

        <div className="glass-card summary-card">
          <span>Απαντημένα</span>
          <strong>{repliedCount}</strong>
          <p>Μηνύματα που έχουν ήδη εξυπηρετηθεί</p>
        </div>
      </section>

      <section className="surface-card list-card">
        <div className="list-header theatres-list-header">
          <div>
            <h3 className="section-heading">Εισερχόμενα μηνύματα</h3>
            <p className="section-subtitle">
              Παρακολούθησε φόρμες επικοινωνίας, άνοιξε συζήτηση και απάντησε
              ώστε ο χρήστης να βλέπει την απάντηση μέσα από το app.
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
            placeholder="Αναζήτηση με όνομα, email, θέμα ή κείμενο"
            value={query}
            onChange={(e) => setQuery(sanitizeText(e.target.value, 80))}
          />

          <select
            className="form-select toolbar-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Όλες οι καταστάσεις</option>
            <option value="new">Νέα</option>
            <option value="read">Διαβασμένα</option>
            <option value="replied">Απαντημένα</option>
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

        <div className="catalog-grid catalog-grid-messages">
          {paginatedItems.length ? (
            paginatedItems.map((item) => (
              <article key={item.message_id} className="catalog-card message-card">
                <div className="catalog-body">
                  <div className="catalog-row-top">
                    <div>
                      <h4>{item.subject || 'Χωρίς θέμα'}</h4>
                      <span>{item.name} · {item.email}</span>
                    </div>

                    <span className={`status-pill ${statusClass(item.status)}`}>
                      {statusLabel(item.status)}
                    </span>
                  </div>

                  <div className="catalog-meta-row">
                    <span>Αποστολή: {formatDateTime(item.created_at)}</span>
                    <span>Κωδικός μηνύματος #{item.message_id}</span>
                    <span>Απαντήσεις: {item.reply_count || 0}</span>
                    {item.last_reply_at ? (
                      <span>Τελευταία απάντηση: {formatDateTime(item.last_reply_at)}</span>
                    ) : null}
                  </div>

                  <p className="catalog-copy message-copy">{item.message}</p>

                  <div className="button-row">
                    <button
                      className="primary-button"
                      onClick={() => openThread(item)}
                    >
                      Συζήτηση / Απάντηση
                    </button>

                    {item.status !== 'read' ? (
                      <button
                        className="secondary-button"
                        onClick={() => updateStatus(item.message_id, 'read')}
                      >
                        Σήμανση ως διαβασμένο
                      </button>
                    ) : null}

                    {item.status !== 'replied' ? (
                      <button
                        className="ghost-button"
                        onClick={() => updateStatus(item.message_id, 'replied')}
                      >
                        Σήμανση ως απαντημένο
                      </button>
                    ) : null}

                    {item.status !== 'new' ? (
                      <button
                        className="ghost-button"
                        onClick={() => updateStatus(item.message_id, 'new')}
                      >
                        Επιστροφή σε νέο
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <article className="catalog-card empty-state-card">
              <div>
                <strong>Δεν βρέθηκαν μηνύματα</strong>
                <span>Δοκίμασε άλλη αναζήτηση ή άλλαξε το φίλτρο κατάστασης.</span>
              </div>
            </article>
          )}
        </div>

        {items.length > ITEMS_PER_PAGE ? (
          <div className="pagination-bar">
            <div className="pagination-meta">
              Σελίδα {currentPage} από {totalPages}
            </div>

            <div className="pagination-controls">
              <button
                type="button"
                className="ghost-button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Προηγούμενη
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                )
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Επόμενη
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {isThreadOpen ? (
        <div className="modal-overlay" onClick={closeThread}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Συζήτηση μηνύματος"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="kicker">Μηνύματα</div>
                <h3 className="section-heading">
                  {activeMessage?.subject || 'Συζήτηση μηνύματος'}
                </h3>
                <p className="section-subtitle">
                  {activeMessage?.name} · {activeMessage?.email}
                </p>
              </div>

              <button type="button" className="modal-close" onClick={closeThread}>
                ✕
              </button>
            </div>

            {loadingThread ? (
              <div className="panel-item">
                <span>Φόρτωση συζήτησης...</span>
              </div>
            ) : (
              <>
                <div className="panel-list">
                  <div className="panel-item">
                    <div className="catalog-row-top">
                      <div>
                        <strong>Αρχικό μήνυμα χρήστη</strong>
                        <span>{formatDateTime(thread?.message?.created_at)}</span>
                      </div>
                      <span className={`status-pill ${statusClass(thread?.message?.status)}`}>
                        {statusLabel(thread?.message?.status)}
                      </span>
                    </div>

                    <p className="catalog-copy message-copy">
                      {thread?.message?.message || activeMessage?.message || '—'}
                    </p>
                  </div>

                  {thread?.replies?.length ? (
                    thread.replies.map((reply) => (
                      <div
                        key={reply.reply_id}
                        className="panel-item"
                        style={{
                          background:
                            reply.sender_type === 'admin'
                              ? '#fff7ec'
                              : '#f8fafc'
                        }}
                      >
                        <div className="catalog-row-top">
                          <div>
                            <strong>{senderLabel(reply.sender_type)}</strong>
                            <span>{formatDateTime(reply.created_at)}</span>
                          </div>

                          <span
                            className={`status-pill ${
                              reply.sender_type === 'admin' ? 'success' : 'info'
                            }`}
                          >
                            {reply.sender_type === 'admin' ? 'Απάντηση admin' : 'Απάντηση χρήστη'}
                          </span>
                        </div>

                        <p className="catalog-copy message-copy">{reply.body}</p>
                      </div>
                    ))
                  ) : (
                    <div className="panel-item">
                      <strong>Δεν υπάρχουν ακόμη απαντήσεις</strong>
                      <span>Γράψε την πρώτη απάντηση προς τον χρήστη.</span>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 18 }}>
                  <div className="form-field">
                    <label>Απάντηση προς χρήστη</label>
                    <textarea
                      className="form-textarea"
                      value={replyBody}
                      onChange={(e) => setReplyBody(sanitizeText(e.target.value, 2000, { preserveNewLines: true }))}
                      placeholder="Γράψε εδώ την απάντηση που θα εμφανιστεί στο app του χρήστη..."
                      maxLength={2000}
                    />
                  </div>

                  <div className="modal-footer">
                    <div className="button-row">
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={closeThread}
                        disabled={sendingReply}
                      >
                        Κλείσιμο
                      </button>
                    </div>

                    <div className="button-row">
                      <button
                        type="button"
                        className="primary-button"
                        onClick={sendReply}
                        disabled={sendingReply || !replyBody.trim()}
                      >
                        {sendingReply ? 'Αποστολή...' : 'Αποστολή απάντησης'}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
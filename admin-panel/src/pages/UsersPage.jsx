import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/client';
import {
  normalizeEmail,
  normalizeName,
  normalizePhone,
  sanitizeText,
  validateEmail,
  validateName,
  validateOptionalPhone,
  validateOptionalUrl,
  validatePassword
} from '../utils/validation';

const API_ORIGIN =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `http://${window.location.hostname}:4000`
    : 'http://localhost:4000';
const ITEMS_PER_PAGE = 12;

const blank = {
  name: '',
  email: '',
  password: '',
  role: 'user',
  phone: '',
  bio: '',
  avatar_url: ''
};

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('el-GR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function resolveMediaUrl(value) {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('/')) return `${API_ORIGIN}${value}`;
  return `${API_ORIGIN}/${value}`;
}

function reservationStatusLabel(status) {
  if (status === 'confirmed') return 'Επιβεβαιωμένη';
  if (status === 'cancelled') return 'Ακυρωμένη';
  if (status === 'pending') return 'Σε αναμονή';
  return status || '—';
}

function reservationStatusClass(status) {
  if (status === 'confirmed') return 'success';
  if (status === 'cancelled') return 'muted';
  return 'info';
}

export default function UsersPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [reservationMap, setReservationMap] = useState({});
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    const { data } = await api.get('/admin/users', {
      params: { q: query, role: roleFilter }
    });
    setItems(data || []);
  };

  useEffect(() => {
    load();
  }, [query, roleFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, roleFilter]);

  const totalUsers = items.length;
  const adminCount = useMemo(() => items.filter((item) => item.role === 'admin').length, [items]);
  const userCount = useMemo(() => items.filter((item) => item.role === 'user').length, [items]);
  const withAvatar = useMemo(() => items.filter((item) => item.avatar_url).length, [items]);

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [items, currentPage]);

  const visibleStart = items.length ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const visibleEnd = items.length ? Math.min(currentPage * ITEMS_PER_PAGE, items.length) : 0;

  const resetFormState = () => {
    setEditingId(null);
    setForm(blank);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError('');
    resetFormState();
    if (fileRef.current) fileRef.current.value = '';
  };

  const openCreateModal = () => {
    setSuccess('');
    setError('');
    resetFormState();
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setSuccess('');
    setError('');
    setEditingId(item.user_id);
    setForm({
      name: item.name || '',
      email: item.email || '',
      password: '',
      role: item.role || 'user',
      phone: item.phone || '',
      bio: item.bio || '',
      avatar_url: item.avatar_url || ''
    });
    setIsModalOpen(true);
  };

  const upload = async (file) => {
    try {
      setError('');
      setSuccess('');
      const data = new FormData();
      data.append('image', file);
      const res = await api.post('/upload/admin-image', data);
      setForm((prev) => ({ ...prev, avatar_url: res.data.url }));
      setSuccess('Η εικόνα μεταφορτώθηκε επιτυχώς.');
    } catch (uploadError) {
      setError(uploadError?.response?.data?.message || 'Η μεταφόρτωση εικόνας απέτυχε.');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      const cleanForm = {
        name: normalizeName(form.name, 120).trim(),
        email: normalizeEmail(form.email),
        role: form.role === 'admin' ? 'admin' : 'user',
        phone: normalizePhone(form.phone),
        bio: sanitizeText(form.bio, 600, { preserveNewLines: true }).trim(),
        avatar_url: sanitizeText(form.avatar_url, 500).trim(),
        password: String(form.password ?? '').trim()
      };

      const validationError =
        validateName(cleanForm.name) ||
        validateEmail(cleanForm.email) ||
        validateOptionalPhone(cleanForm.phone) ||
        validateOptionalUrl(cleanForm.avatar_url) ||
        validatePassword(cleanForm.password, { required: !editingId });

      if (validationError) {
        setError(validationError);
        setForm((prev) => ({ ...prev, ...cleanForm, password: prev.password }));
        return;
      }

      const payload = {
        name: cleanForm.name,
        email: cleanForm.email,
        role: cleanForm.role,
        phone: cleanForm.phone,
        bio: cleanForm.bio,
        avatar_url: cleanForm.avatar_url
      };
      if (cleanForm.password) payload.password = cleanForm.password;

      if (editingId) {
        await api.put(`/admin/users/${editingId}`, payload);
        await load();
        closeModal();
        setSuccess('Ο χρήστης ενημερώθηκε επιτυχώς.');
      } else {
        await api.post('/admin/users', payload);
        await load();
        closeModal();
        setSuccess('Ο χρήστης δημιουργήθηκε επιτυχώς.');
      }
    } catch (submitError) {
      setError(submitError?.response?.data?.message || 'Η αποθήκευση απέτυχε.');
    }
  };

  const removeUser = async (userId) => {
    const ok = window.confirm('Θέλεις σίγουρα να διαγράψεις αυτόν τον χρήστη;');
    if (!ok) return;
    try {
      setError('');
      setSuccess('');
      await api.delete(`/admin/users/${userId}`);
      await load();
      closeModal();
      setSuccess('Ο χρήστης διαγράφηκε επιτυχώς.');
    } catch (removeError) {
      setError(removeError?.response?.data?.message || 'Η διαγραφή απέτυχε.');
    }
  };

  const toggleReservations = async (userId) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(userId);
    if (!reservationMap[userId]) {
      try {
        setError('');
        setLoadingReservations(true);
        const { data } = await api.get(`/admin/users/${userId}/reservations`);
        setReservationMap((prev) => ({ ...prev, [userId]: data || [] }));
      } catch (reservationError) {
        setError(reservationError?.response?.data?.message || 'Η φόρτωση κρατήσεων απέτυχε.');
      } finally {
        setLoadingReservations(false);
      }
    }
  };

  return (
    <div className="page-stack">
      <section className="summary-strip summary-strip-4">
        <div className="glass-card summary-card">
          <span>Σύνολο χρηστών</span>
          <strong>{totalUsers}</strong>
          <p>Χρήστες που ταιριάζουν στα τρέχοντα φίλτρα</p>
        </div>
        <div className="glass-card summary-card">
          <span>Απλοί χρήστες</span>
          <strong>{userCount}</strong>
          <p>Λογαριασμοί με ρόλο user</p>
        </div>
        <div className="glass-card summary-card">
          <span>Διαχειριστές</span>
          <strong>{adminCount}</strong>
          <p>Λογαριασμοί με ρόλο admin</p>
        </div>
        <div className="glass-card summary-card">
          <span>Με avatar</span>
          <strong>{withAvatar}</strong>
          <p>Προφίλ με εικόνα χρήστη</p>
        </div>
      </section>

      {error && !isModalOpen ? <div className="form-banner form-banner-error">{error}</div> : null}
      {success && !isModalOpen ? <div className="form-banner form-banner-success">{success}</div> : null}

      <section className="surface-card list-card">
        <div className="list-header theatres-list-header">
          <div>
            <h3 className="section-heading">Διαχείριση χρηστών</h3>
            <p className="section-subtitle">CRUD με modal, pagination και ιστορικό κρατήσεων χωρίς να σπάει η σελίδα.</p>
          </div>
          <div className="theatres-header-actions">
            <div className="muted-badge">{visibleStart}-{visibleEnd} από {items.length}</div>
            <button type="button" className="primary-button" onClick={openCreateModal}>Προσθήκη χρήστη</button>
          </div>
        </div>

        <div className="toolbar-row theatres-toolbar">
          <input
            className="form-input toolbar-search"
            placeholder="Αναζήτηση με όνομα, email ή κινητό"
            value={query}
            onChange={(e) => setQuery(sanitizeText(e.target.value, 80))}
          />
          <select className="form-select toolbar-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">Όλοι οι ρόλοι</option>
            <option value="user">Χρήστες</option>
            <option value="admin">Διαχειριστές</option>
          </select>
          <button
            type="button"
            className="ghost-button"
            onClick={() => {
              setQuery('');
              setRoleFilter('all');
              setError('');
              setSuccess('');
            }}
          >
            Καθαρισμός
          </button>
        </div>

        <div className="catalog-grid users-grid">
          {paginatedItems.length ? (
            paginatedItems.map((item) => {
              const reservations = reservationMap[item.user_id] || [];
              const isExpanded = expandedUserId === item.user_id;
              return (
                <article key={item.user_id} className="catalog-card user-card user-card-compact">
                  <div className="catalog-body">
                    <div className="user-card-top">
                      <div className="user-avatar-wrap">
                        {item.avatar_url ? (
                          <img className="user-avatar" src={resolveMediaUrl(item.avatar_url)} alt={item.name} />
                        ) : (
                          <div className="user-avatar user-avatar-fallback">{(item.name || 'Χ').slice(0, 1).toUpperCase()}</div>
                        )}
                      </div>
                      <div className="user-main-info">
                        <h4>{item.name || 'Χωρίς όνομα'}</h4>
                        <span>{item.email}</span>
                      </div>
                      <span className={`status-pill ${item.role === 'admin' ? 'info' : 'success'}`}>{item.role === 'admin' ? 'Διαχειριστής' : 'Χρήστης'}</span>
                    </div>

                    <div className="reservation-meta-grid user-meta-grid">
                      <div className="reservation-meta-chip"><span>Κινητό</span><strong>{item.phone || '—'}</strong></div>
                      <div className="reservation-meta-chip"><span>Κρατήσεις</span><strong>{item.reservations_count}</strong></div>
                      <div className="reservation-meta-chip"><span>Εγγραφή</span><strong>{formatDateTime(item.created_at)}</strong></div>
                      <div className="reservation-meta-chip"><span>Τελευταία κράτηση</span><strong>{formatDateTime(item.last_reservation_at)}</strong></div>
                    </div>

                    <p className="catalog-copy user-card-copy">{item.bio || 'Δεν υπάρχει ακόμα βιογραφικό ή περιγραφή για αυτόν τον χρήστη.'}</p>

                    <div className="button-row user-card-actions">
                      <button className="secondary-button" onClick={() => openEditModal(item)}>Edit</button>
                      <button className="ghost-button" onClick={() => toggleReservations(item.user_id)}>
                        {isExpanded ? 'Απόκρυψη ιστορικού' : 'Ιστορικό κρατήσεων'}
                      </button>
                    </div>

                    {isExpanded ? (
                      <div className="user-reservations-panel">
                        <div className="user-reservations-header">
                          <strong>Ιστορικό κρατήσεων</strong>
                          <span>{reservations.length} καταχωρήσεις</span>
                        </div>
                        {loadingReservations && !reservationMap[item.user_id] ? (
                          <div className="panel-item"><span>Φόρτωση κρατήσεων...</span></div>
                        ) : reservations.length ? (
                          <div className="panel-list">
                            {reservations.map((reservation) => (
                              <div key={reservation.reservation_id} className="panel-item user-reservation-item">
                                <div className="user-reservation-top">
                                  <div>
                                    <strong>{reservation.show_title}</strong>
                                    <span>{reservation.theatre_name} · {reservation.location}</span>
                                  </div>
                                  <span className={`status-pill ${reservationStatusClass(reservation.status)}`}>{reservationStatusLabel(reservation.status)}</span>
                                </div>
                                <div className="catalog-meta-row">
                                  <span>Κωδικός: {reservation.booking_code}</span>
                                  <span>{formatDateTime(reservation.start_time)}</span>
                                  <span>Αίθουσα {reservation.hall_name}</span>
                                  <span>€{reservation.base_price}</span>
                                </div>
                                <p className="catalog-copy compact-copy">Θέσεις: {reservation.seats || '—'}<br />Δημιουργία: {formatDateTime(reservation.created_at)}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="panel-item">
                            <strong>Δεν υπάρχουν κρατήσεις</strong>
                            <span>Ο συγκεκριμένος χρήστης δεν έχει πραγματοποιήσει ακόμη κράτηση.</span>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })
          ) : (
            <article className="catalog-card empty-state-card"><div><strong>Δεν βρέθηκαν χρήστες</strong><span>Δοκίμασε άλλη αναζήτηση ή άλλαξε το φίλτρο ρόλου.</span></div></article>
          )}
        </div>

        {items.length > ITEMS_PER_PAGE ? (
          <div className="pagination-bar">
            <div className="pagination-meta">Σελίδα {currentPage} από {totalPages}</div>
            <div className="pagination-controls">
              <button type="button" className="ghost-button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>Προηγούμενη</button>
              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                .map((page, index, arr) => (
                  <React.Fragment key={page}>
                    {index > 0 && arr[index - 1] !== page - 1 ? <span className="pagination-ellipsis">…</span> : null}
                    <button type="button" className={`pagination-page ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>
                  </React.Fragment>
                ))}
              <button type="button" className="ghost-button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>Επόμενη</button>
            </div>
          </div>
        ) : null}
      </section>

      {isModalOpen ? (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" role="dialog" aria-modal="true" aria-label={editingId ? 'Επεξεργασία χρήστη' : 'Προσθήκη χρήστη'} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="kicker">Χρήστες</div>
                <h3 className="section-heading">{editingId ? 'Επεξεργασία χρήστη' : 'Προσθήκη χρήστη'}</h3>
                <p className="section-subtitle">Διαχείριση στοιχείων λογαριασμού και ρόλου πρόσβασης.</p>
              </div>
              <button type="button" className="modal-close" onClick={closeModal}>✕</button>
            </div>

            <form className="app-form" onSubmit={submit}>
              {error ? <div className="form-banner form-banner-error">{error}</div> : null}
              {success ? <div className="form-banner form-banner-success">{success}</div> : null}

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Όνομα</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: normalizeName(e.target.value, 120) })} placeholder="Ονοματεπώνυμο" maxLength={120} required />
                </div>
                <div className="form-field">
                  <label>Email</label>
                  <input className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: sanitizeText(e.target.value, 180) })} onBlur={() => setForm((prev) => ({ ...prev, email: normalizeEmail(prev.email) }))} placeholder="email@example.com" inputMode="email" autoCapitalize="none" spellCheck="false" required />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>{editingId ? 'Νέο password (προαιρετικό)' : 'Password'}</label>
                  <input type="password" className="form-input" value={form.password} onChange={(e) => setForm({ ...form, password: String(e.target.value ?? '').slice(0, 100) })} placeholder={editingId ? 'Άφησέ το κενό αν δεν αλλάζει' : 'Min 8, κεφαλαίο, μικρό, αριθμός'} autoComplete="new-password" required={!editingId} />
                </div>
                <div className="form-field">
                  <label>Ρόλος</label>
                  <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="user">Χρήστης</option>
                    <option value="admin">Διαχειριστής</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Κινητό</label>
                  <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: normalizePhone(e.target.value) })} placeholder="π.χ. 69xxxxxxxx" inputMode="numeric" maxLength={10} />
                </div>
                <div className="form-field">
                  <label>Avatar URL</label>
                  <input className="form-input" value={form.avatar_url} readOnly placeholder="Ανέβασε εικόνα προφίλ" />
                </div>
              </div>

              <div className="form-field">
                <label>Bio</label>
                <textarea className="form-textarea" value={form.bio} onChange={(e) => setForm({ ...form, bio: sanitizeText(e.target.value, 600, { preserveNewLines: true }) })} placeholder="Προαιρετική σημείωση ή σύντομο bio χρήστη." maxLength={600} />
              </div>

              <div className="button-row">
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                <button type="button" className="secondary-button" onClick={() => fileRef.current?.click()}>Μεταφόρτωση avatar</button>
              </div>

              {form.avatar_url ? <div className="poster-preview user-avatar-preview"><img src={resolveMediaUrl(form.avatar_url)} alt="Προεπισκόπηση avatar" /></div> : null}

              <div className="modal-footer">
                <div className="button-row">
                  {editingId ? <button type="button" className="danger-button" onClick={() => removeUser(editingId)}>Διαγραφή</button> : null}
                </div>
                <div className="button-row">
                  <button type="button" className="ghost-button" onClick={closeModal}>Ακύρωση</button>
                  <button className="primary-button">{editingId ? 'Αποθήκευση αλλαγών' : 'Δημιουργία χρήστη'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

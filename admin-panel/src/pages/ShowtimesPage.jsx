import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { sanitizeText } from '../utils/validation';

const ITEMS_PER_PAGE = 12;
const blank = {
  show_id: '',
  hall_name: '',
  start_time: '',
  base_price: 15
};

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('el-GR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

export default function ShowtimesPage() {
  const [shows, setShows] = useState([]);
  const [selectedShowId, setSelectedShowId] = useState('');
  const [showtimes, setShowtimes] = useState([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [dayFilter, setDayFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    api.get('/shows').then((res) => setShows(res.data || []));
  }, []);

  useEffect(() => {
    if (selectedShowId) {
      api.get('/shows/meta/showtimes', { params: { showId: selectedShowId } }).then((res) => setShowtimes(res.data || []));
    } else {
      setShowtimes([]);
    }
  }, [selectedShowId]);

  useEffect(() => { setCurrentPage(1); }, [query, dayFilter, selectedShowId]);

  const refreshSelectedShow = async (showId) => {
    if (!showId) return;
    const res = await api.get('/shows/meta/showtimes', { params: { showId } });
    setShowtimes(res.data || []);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm({ ...blank, show_id: selectedShowId || '' });
    setError('');
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ ...blank, show_id: selectedShowId || '' });
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.showtime_id);
    setForm({
      show_id: String(item.show_id),
      hall_name: item.hall_name || '',
      start_time: item.start_time?.slice(0, 16),
      base_price: item.base_price
    });
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      if (!form.show_id || !form.hall_name.trim() || !form.start_time) {
        setError('Συμπλήρωσε παράσταση, αίθουσα και ημερομηνία/ώρα.');
        return;
      }
      const payload = {
        ...form,
        show_id: Number(form.show_id),
        hall_name: sanitizeText(form.hall_name, 120).trim(),
        base_price: Number(form.base_price)
      };
      if (editingId) {
        await api.put(`/shows/meta/showtimes/${editingId}`, payload);
        setSuccess('Η ημερομηνία ενημερώθηκε επιτυχώς.');
      } else {
        await api.post('/shows/meta/showtimes', payload);
        setSuccess('Η ημερομηνία δημιουργήθηκε επιτυχώς.');
      }
      setSelectedShowId(String(form.show_id));
      await refreshSelectedShow(form.show_id);
      closeModal();
    } catch (error) {
      setError(error?.response?.data?.message || 'Η αποθήκευση απέτυχε.');
    }
  };

  const remove = async (id) => {
    const ok = window.confirm('Θέλεις σίγουρα να διαγράψεις αυτή την ημερομηνία;');
    if (!ok) return;
    try {
      setError('');
      setSuccess('');
      await api.delete(`/shows/meta/showtimes/${id}`);
      await refreshSelectedShow(selectedShowId);
      closeModal();
      setSuccess('Η ημερομηνία διαγράφηκε επιτυχώς.');
    } catch (error) {
      setError(error?.response?.data?.message || 'Η διαγραφή απέτυχε.');
    }
  };

  const selectedShow = useMemo(() => shows.find((s) => String(s.show_id) === String(selectedShowId)), [shows, selectedShowId]);
  const distinctDays = useMemo(() => [...new Set(showtimes.map((item) => item.start_time?.slice(0, 10)).filter(Boolean))], [showtimes]);
  const filtered = useMemo(() => showtimes.filter((item) => {
    const matchesQuery = !query || `${item.hall_name} ${new Date(item.start_time).toLocaleString('el-GR')}`.toLowerCase().includes(query.toLowerCase());
    const matchesDay = dayFilter === 'all' || item.start_time?.slice(0, 10) === dayFilter;
    return matchesQuery && matchesDay;
  }), [showtimes, query, dayFilter]);
  const avgPrice = useMemo(() => !filtered.length ? '0.00' : (filtered.reduce((sum, item) => sum + Number(item.base_price || 0), 0) / filtered.length).toFixed(2), [filtered]);
  const uniqueHalls = useMemo(() => [...new Set(filtered.map((item) => item.hall_name).filter(Boolean))].length, [filtered]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [filtered, currentPage]);
  const visibleStart = filtered.length ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const visibleEnd = filtered.length ? Math.min(currentPage * ITEMS_PER_PAGE, filtered.length) : 0;

  return (
    <div className="page-stack">
      <section className="summary-strip summary-strip-4">
        <div className="glass-card summary-card"><span>Επιλεγμένη παράσταση</span><strong>{selectedShow?.title || '—'}</strong><p>Διάλεξε τίτλο για να εμφανιστούν οι προγραμματισμένες ημερομηνίες</p></div>
        <div className="glass-card summary-card"><span>Ημερομηνίες</span><strong>{filtered.length}</strong><p>Καταχωρήσεις που ταιριάζουν στα ενεργά φίλτρα</p></div>
        <div className="glass-card summary-card"><span>Μέση τιμή</span><strong>€{avgPrice}</strong><p>Μέσο βασικό εισιτήριο για το τρέχον αποτέλεσμα</p></div>
        <div className="glass-card summary-card"><span>Αίθουσες</span><strong>{uniqueHalls}</strong><p>Διαφορετικές αίθουσες στο τρέχον αποτέλεσμα</p></div>
      </section>

      {error && !isModalOpen ? <div className="form-banner form-banner-error">{error}</div> : null}
      {success && !isModalOpen ? <div className="form-banner form-banner-success">{success}</div> : null}

      <section className="surface-card list-card">
        <div className="list-header theatres-list-header">
          <div>
            <h3 className="section-heading">Προγραμματισμένες ημερομηνίες</h3>
            <p className="section-subtitle">Διαχειρίσου ώρες, αίθουσες και τιμές με την ίδια ροή εργασίας των υπόλοιπων ενοτήτων.</p>
          </div>
          <div className="theatres-header-actions">
            <div className="muted-badge">{visibleStart}-{visibleEnd} από {filtered.length}</div>
            <button type="button" className="primary-button" onClick={openCreateModal}>Προσθήκη ημερομηνίας</button>
          </div>
        </div>

        <div className="toolbar-row theatres-toolbar">
          <select className="form-select toolbar-select" value={selectedShowId} onChange={(e) => setSelectedShowId(e.target.value)}>
            <option value="">Επιλογή παράστασης</option>
            {shows.map((show) => <option key={show.show_id} value={show.show_id}>{show.title}</option>)}
          </select>
          <input className="form-input toolbar-search" placeholder="Αναζήτηση με αίθουσα ή ημερομηνία" value={query} onChange={(e) => setQuery(sanitizeText(e.target.value, 80))} />
          <select className="form-select toolbar-select" value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}>
            <option value="all">Όλες οι ημέρες</option>
            {distinctDays.map((day) => <option key={day} value={day}>{day}</option>)}
          </select>
          <button type="button" className="ghost-button" onClick={() => { setQuery(''); setDayFilter('all'); }}>Καθαρισμός</button>
        </div>

        <div className="catalog-grid catalog-grid-showtimes">
          {paginatedItems.length ? paginatedItems.map((item) => (
            <article key={item.showtime_id} className="catalog-card showtime-card">
              <div className="catalog-row-top">
                <div>
                  <h4>{formatDateTime(item.start_time)}</h4>
                  <span>{selectedShow?.title || 'Παράσταση'}</span>
                </div>
                <span className="status-pill info">€{item.base_price}</span>
              </div>
              <div className="catalog-meta-row">
                <span>Αίθουσα {item.hall_name}</span>
                <span>Κωδικός #{item.showtime_id}</span>
              </div>
              <p className="catalog-copy">Ενημέρωσε ώρα, αίθουσα ή τιμή από το παράθυρο επεξεργασίας.</p>
              <div className="button-row"><button className="secondary-button" onClick={() => openEditModal(item)}>Επεξεργασία</button></div>
            </article>
          )) : (
            <article className="catalog-card empty-state-card"><div><strong>Δεν υπάρχουν ημερομηνίες</strong><span>Επίλεξε παράσταση και πρόσθεσε την πρώτη διαθέσιμη εμφάνιση ή καθάρισε τα φίλτρα.</span></div></article>
          )}
        </div>

        {filtered.length > ITEMS_PER_PAGE ? (
          <div className="pagination-bar">
            <div className="pagination-meta">Σελίδα {currentPage} από {totalPages}</div>
            <div className="pagination-controls">
              <button type="button" className="ghost-button" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Προηγούμενη</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1).map((page, index, arr) => (
                <React.Fragment key={page}>{index > 0 && arr[index - 1] !== page - 1 ? <span className="pagination-ellipsis">…</span> : null}<button type="button" className={`pagination-page ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>{page}</button></React.Fragment>
              ))}
              <button type="button" className="ghost-button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Επόμενη</button>
            </div>
          </div>
        ) : null}
      </section>

      {isModalOpen ? (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="kicker">Ημερομηνίες</div>
                <h3 className="section-heading">{editingId ? 'Επεξεργασία ημερομηνίας' : 'Προσθήκη ημερομηνίας'}</h3>
                <p className="section-subtitle">Ορισμός παράστασης, αίθουσας, ώρας και βασικής τιμής.</p>
              </div>
              <button type="button" className="modal-close" onClick={closeModal}>✕</button>
            </div>

            <form className="app-form" onSubmit={submit}>
              {error ? <div className="form-banner form-banner-error">{error}</div> : null}
              <div className="form-field">
                <label>Παράσταση</label>
                <select className="form-select" value={form.show_id} onChange={(e) => setForm({ ...form, show_id: e.target.value })}>
                  <option value="">Επιλογή παράστασης</option>
                  {shows.map((show) => <option key={show.show_id} value={show.show_id}>{show.title}</option>)}
                </select>
              </div>
              <div className="form-grid-2">
                <div className="form-field"><label>Αίθουσα</label><input className="form-input" value={form.hall_name} onChange={(e) => setForm({ ...form, hall_name: sanitizeText(e.target.value, 120) })} placeholder="π.χ. Κεντρική Σκηνή" /></div>
                <div className="form-field"><label>Βασική τιμή</label><input className="form-input" type="number" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} /></div>
              </div>
              <div className="form-field"><label>Ημερομηνία & ώρα</label><input className="form-input" type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
              <div className="modal-footer">
                <div className="button-row">{editingId ? <button type="button" className="danger-button" onClick={() => remove(editingId)}>Διαγραφή</button> : null}</div>
                <div className="button-row"><button type="button" className="ghost-button" onClick={closeModal}>Ακύρωση</button><button className="primary-button">{editingId ? 'Αποθήκευση αλλαγών' : 'Δημιουργία ημερομηνίας'}</button></div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

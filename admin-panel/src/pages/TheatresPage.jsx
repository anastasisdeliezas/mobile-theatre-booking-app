import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/client';
import { sanitizeText } from '../utils/validation';

const API_ORIGIN =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `http://${window.location.hostname}:4000`
    : 'http://localhost:4000';
const ITEMS_PER_PAGE = 12;

const blank = {
  name: '',
  location: '',
  description: '',
  avatar_url: '',
  intro_text: '',
  space_overview: '',
  booking_info: ''
};

function resolveMediaUrl(value) {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('/')) return `${API_ORIGIN}${value}`;
  return `${API_ORIGIN}/${value}`;
}

export default function TheatresPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef(null);

  const load = async () => {
    const { data } = await api.get('/theatres');
    setItems(data || []);
  };

  useEffect(() => {
    load();
  }, []);

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
    setEditingId(item.theatre_id);
    setForm({
      name: item.name || '',
      location: item.location || '',
      description: item.description || '',
      avatar_url: item.avatar_url || '',
      intro_text: item.intro_text || '',
      space_overview: item.space_overview || '',
      booking_info: item.booking_info || ''
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

      if (!form.name.trim() || !form.location.trim()) {
        setError('Συμπλήρωσε όνομα θεάτρου και τοποθεσία.');
        return;
      }

      const payload = {
        name: sanitizeText(form.name, 120).trim(),
        location: sanitizeText(form.location, 160).trim(),
        description: sanitizeText(form.description, 1200, { preserveNewLines: true }).trim(),
        avatar_url: sanitizeText(form.avatar_url, 500).trim(),
        intro_text: sanitizeText(form.intro_text, 1000, { preserveNewLines: true }).trim(),
        space_overview: sanitizeText(form.space_overview, 1000, { preserveNewLines: true }).trim(),
        booking_info: sanitizeText(form.booking_info, 1000, { preserveNewLines: true }).trim()
      };

      const wasEditing = Boolean(editingId);

      if (wasEditing) {
        await api.put(`/theatres/${editingId}`, payload);
      } else {
        await api.post('/theatres', payload);
      }

      await load();
      closeModal();
      setSuccess(
        wasEditing
          ? 'Το θέατρο ενημερώθηκε επιτυχώς.'
          : 'Το θέατρο δημιουργήθηκε επιτυχώς.'
      );
    } catch (submitError) {
      setError(submitError?.response?.data?.message || 'Η αποθήκευση απέτυχε.');
    }
  };

  const remove = async (id) => {
    const ok = window.confirm('Θέλεις σίγουρα να διαγράψεις αυτό το θέατρο;');
    if (!ok) return;

    try {
      setError('');
      setSuccess('');

      await api.delete(`/theatres/${id}`);
      await load();
      closeModal();
      setSuccess('Το θέατρο διαγράφηκε επιτυχώς.');
    } catch (removeError) {
      setError(removeError?.response?.data?.message || 'Η διαγραφή απέτυχε.');
    }
  };

  const cities = useMemo(() => {
    return [...new Set(items.map((item) => item.location).filter(Boolean))].sort();
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const haystack = [
        item.name,
        item.location,
        item.description,
        item.intro_text,
        item.space_overview,
        item.booking_info
      ]
        .join(' ')
        .toLowerCase();

      const matchesQuery = !query || haystack.includes(query.toLowerCase());
      const matchesCity = cityFilter === 'all' || item.location === cityFilter;

      return matchesQuery && matchesCity;
    });
  }, [items, query, cityFilter]);

  const withImages = useMemo(
    () => filtered.filter((item) => item.avatar_url).length,
    [filtered]
  );

  const withDynamicContent = useMemo(
    () =>
      filtered.filter(
        (item) =>
          item.intro_text || item.space_overview || item.booking_info
      ).length,
    [filtered]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [query, cityFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const visibleStart = filtered.length ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const visibleEnd = filtered.length
    ? Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)
    : 0;

  return (
    <div className="page-stack">
      <section className="summary-strip summary-strip-4">
        <div className="glass-card summary-card">
          <span>Σύνολο θεάτρων</span>
          <strong>{items.length}</strong>
          <p>Χώροι που υπάρχουν αυτή τη στιγμή στο σύστημα</p>
        </div>

        <div className="glass-card summary-card">
          <span>Αποτελέσματα φίλτρων</span>
          <strong>{filtered.length}</strong>
          <p>Θέατρα που ταιριάζουν στην αναζήτηση και στην πόλη</p>
        </div>

        <div className="glass-card summary-card">
          <span>Με εικόνα</span>
          <strong>{withImages}</strong>
          <p>Καταχωρήσεις με έτοιμη οπτική ταυτότητα</p>
        </div>

        <div className="glass-card summary-card">
          <span>Με extra περιεχόμενο</span>
          <strong>{withDynamicContent}</strong>
          <p>Θέατρα με δυναμικό theatre details content</p>
        </div>
      </section>

      {error && !isModalOpen ? <div className="form-banner form-banner-error">{error}</div> : null}
      {success && !isModalOpen ? <div className="form-banner form-banner-success">{success}</div> : null}

      <section className="surface-card list-card">
        <div className="list-header theatres-list-header">
          <div>
            <h3 className="section-heading">Κατάλογος θεάτρων</h3>
            <p className="section-subtitle">
              Διαχειρίσου βασικά στοιχεία χώρου και το επιπλέον περιεχόμενο που εμφανίζεται στη mobile detail page.
            </p>
          </div>

          <div className="theatres-header-actions">
            <div className="muted-badge">
              {visibleStart}-{visibleEnd} από {filtered.length}
            </div>
            <button type="button" className="primary-button" onClick={openCreateModal}>
              Προσθήκη θεάτρου
            </button>
          </div>
        </div>

        <div className="toolbar-row theatres-toolbar">
          <input
            className="form-input toolbar-search"
            placeholder="Αναζήτηση με όνομα, πόλη ή περιγραφή"
            value={query}
            onChange={(e) => setQuery(sanitizeText(e.target.value, 80))}
          />

          <select
            className="form-select toolbar-select"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            <option value="all">Όλες οι πόλεις</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="ghost-button"
            onClick={() => {
              setQuery('');
              setCityFilter('all');
            }}
          >
            Καθαρισμός
          </button>
        </div>

        <div className="catalog-grid theatres-grid">
          {paginatedItems.length ? (
            paginatedItems.map((item) => (
              <article key={item.theatre_id} className="catalog-card theatre-card-compact">
                <div className="catalog-media venue-media theatre-card-media">
                  {item.avatar_url ? (
                    <img src={resolveMediaUrl(item.avatar_url)} alt={item.name} />
                  ) : (
                    <div className="media-fallback">
                      {item.name?.slice(0, 1)?.toUpperCase() || 'Θ'}
                    </div>
                  )}
                </div>

                <div className="catalog-body">
                  <div className="catalog-row-top">
                    <div>
                      <h4>{item.name}</h4>
                      <span>{item.location || 'Χωρίς τοποθεσία'}</span>
                    </div>
                    <span className="status-pill info">Θέατρο</span>
                  </div>

                  <p className="catalog-copy theatre-card-copy">
                    {item.description ||
                      'Δεν υπάρχει ακόμη περιγραφή για αυτόν τον χώρο. Πρόσθεσε σύντομο κείμενο για καλύτερη παρουσίαση.'}
                  </p>

                  <div className="button-row">
                    <button className="secondary-button theatre-edit-button" onClick={() => openEditModal(item)}>
                      Edit
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <article className="catalog-card empty-state-card">
              <div>
                <strong>Δεν βρέθηκαν θέατρα</strong>
                <span>Δοκίμασε άλλη αναζήτηση ή καθάρισε τα ενεργά φίλτρα.</span>
              </div>
            </article>
          )}
        </div>

        {filtered.length > ITEMS_PER_PAGE ? (
          <div className="pagination-bar">
            <div className="pagination-meta">
              Σελίδα {currentPage} από {totalPages}
            </div>

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
                .filter((page) => {
                  return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                })
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

      {isModalOpen ? (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-card theatre-modal"
            role="dialog"
            aria-modal="true"
            aria-label={editingId ? 'Επεξεργασία θεάτρου' : 'Δημιουργία θεάτρου'}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="kicker">Θέατρα</div>
                <h3 className="section-heading">
                  {editingId ? 'Επεξεργασία θεάτρου' : 'Προσθήκη θεάτρου'}
                </h3>
                <p className="section-subtitle">
                  Συμπλήρωσε τα στοιχεία του χώρου και το επιπλέον περιεχόμενο της mobile detail page.
                </p>
              </div>

              <button type="button" className="modal-close" onClick={closeModal}>
                ✕
              </button>
            </div>

            <form className="app-form" onSubmit={submit}>
              {error ? <div className="form-banner form-banner-error">{error}</div> : null}
              {success ? <div className="form-banner form-banner-success">{success}</div> : null}

              <div className="form-field">
                <label>Όνομα θεάτρου</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="π.χ. Velvet Downtown Hall"
                />
              </div>

              <div className="form-field">
                <label>Πόλη / Τοποθεσία</label>
                <input
                  className="form-input"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="π.χ. Αθήνα"
                />
              </div>

              <div className="form-field">
                <label>Βασική περιγραφή</label>
                <textarea
                  className="form-textarea"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Σύντομη περιγραφή του χώρου, του ύφους και της εμπειρίας."
                />
              </div>

              <div className="form-field">
                <label>Intro κείμενο detail page</label>
                <textarea
                  className="form-textarea"
                  value={form.intro_text}
                  onChange={(e) => setForm({ ...form, intro_text: e.target.value })}
                  placeholder="Κείμενο που εμφανίζεται κάτω από τον τίτλο του θεάτρου στη mobile detail page."
                />
              </div>

              <div className="form-field">
                <label>Προφίλ χώρου / overview</label>
                <textarea
                  className="form-textarea"
                  value={form.space_overview}
                  onChange={(e) => setForm({ ...form, space_overview: e.target.value })}
                  placeholder="Πληροφορία για το είδος του χώρου, το ύφος και το τι φιλοξενεί."
                />
              </div>

              <div className="form-field">
                <label>Πληροφορία κράτησης</label>
                <textarea
                  className="form-textarea"
                  value={form.booking_info}
                  onChange={(e) => setForm({ ...form, booking_info: e.target.value })}
                  placeholder="Κείμενο για το booking flow, την πρόσβαση στις παραστάσεις και την online κράτηση."
                />
              </div>

              <div className="form-field">
                <label>Εικόνα χώρου</label>
                <input
                  className="form-input"
                  value={form.avatar_url}
                  readOnly
                  placeholder="Ανέβασε εικόνα θεάτρου"
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
                />
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => fileRef.current?.click()}
                >
                  Μεταφόρτωση εικόνας
                </button>
              </div>

              {form.avatar_url ? (
                <div className="poster-preview">
                  <img src={resolveMediaUrl(form.avatar_url)} alt="Προεπισκόπηση θεάτρου" />
                </div>
              ) : null}

              <div className="modal-footer">
                <div className="button-row">
                  {editingId ? (
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => remove(editingId)}
                    >
                      Διαγραφή
                    </button>
                  ) : null}
                </div>

                <div className="button-row">
                  <button type="button" className="ghost-button" onClick={closeModal}>
                    Ακύρωση
                  </button>
                  <button
                    className="primary-button"
                    disabled={!form.name.trim() || !form.location.trim()}
                  >
                    {editingId ? 'Αποθήκευση αλλαγών' : 'Δημιουργία θεάτρου'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
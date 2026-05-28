import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/client';
import { sanitizeText } from '../utils/validation';

const API_ORIGIN =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `http://${window.location.hostname}:4000`
    : 'http://localhost:4000';

const ITEMS_PER_PAGE = 12;

const GENRE_OPTIONS = [
  'Παράσταση',
  'Κοινωνικό δράμα',
  'Δράμα',
  'Κωμωδία',
  'Τραγωδία',
  'Θεατρική διασκευή',
  'Μουσική παράσταση',
  'Μιούζικαλ',
  'Παιδική παράσταση',
  'Μονόλογος',
  'Χορός',
  'Performance',
  'Όπερα'
];

const AGE_RATING_OPTIONS = [
  'Κατάλληλο για όλους',
  '6+',
  '8+',
  '10+',
  '12+',
  '15+',
  '16+',
  '18+'
];

function resolveMediaUrl(value) {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('/')) return `${API_ORIGIN}${value}`;
  return `${API_ORIGIN}/${value}`;
}

const blank = {
  theatre_id: '',
  title: '',
  genre: 'Παράσταση',
  description: '',
  duration_minutes: 120,
  age_rating: '12+',
  poster_url: '',
  hero_image_url: '',
  trailer_url: '',
  overview_text: '',
  cast_text: '',
  creatives_text: '',
  highlights_text: '',
  audience_text: '',
  content_warnings_text: ''
};

function buildVisiblePages(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages = new Set([1, totalPages, currentPage]);

  if (currentPage - 1 > 1) pages.add(currentPage - 1);
  if (currentPage + 1 < totalPages) pages.add(currentPage + 1);

  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }

  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
  }

  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const finalPages = [];

  for (let i = 0; i < sorted.length; i += 1) {
    finalPages.push(sorted[i]);

    if (sorted[i + 1] && sorted[i + 1] - sorted[i] > 1) {
      finalPages.push(`ellipsis-${i}`);
    }
  }

  return finalPages;
}

export default function ShowsPage() {
  const [shows, setShows] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [theatreFilter, setTheatreFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const posterRef = useRef(null);
  const heroRef = useRef(null);

  const load = async () => {
    const [showsRes, theatresRes] = await Promise.all([
      api.get('/shows'),
      api.get('/theatres')
    ]);

    setShows(showsRes.data || []);
    setTheatres(theatresRes.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const resetFormState = () => {
    setEditingId(null);
    setForm(blank);

    if (posterRef.current) posterRef.current.value = '';
    if (heroRef.current) heroRef.current.value = '';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError('');
    resetFormState();
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
    setEditingId(item.show_id);

    setForm({
      theatre_id: String(item.theatre_id || ''),
      title: item.title || '',
      genre: item.genre || 'Παράσταση',
      description: item.description || '',
      duration_minutes: item.duration_minutes || 120,
      age_rating: item.age_rating || '12+',
      poster_url: item.poster_url || '',
      hero_image_url: item.hero_image_url || '',
      trailer_url: item.trailer_url || '',
      overview_text: item.overview_text || '',
      cast_text: item.cast_text || '',
      creatives_text: item.creatives_text || '',
      highlights_text: item.highlights_text || '',
      audience_text: item.audience_text || '',
      content_warnings_text: item.content_warnings_text || ''
    });

    setIsModalOpen(true);
  };

  const uploadImage = async (file, field) => {
    try {
      setError('');
      setSuccess('');

      const data = new FormData();
      data.append('image', file);

      const res = await api.post('/upload/admin-image', data);

      setForm((prev) => ({ ...prev, [field]: res.data.url }));
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

      if (!form.theatre_id || !form.title.trim()) {
        setError('Συμπλήρωσε θέατρο και τίτλο παράστασης.');
        return;
      }

      const payload = {
        ...form,
        theatre_id: Number(form.theatre_id),
        title: sanitizeText(form.title, 160).trim(),
        genre: sanitizeText(form.genre, 80).trim(),
        description: sanitizeText(form.description, 1500, { preserveNewLines: true }).trim(),
        age_rating: sanitizeText(form.age_rating, 40).trim(),
        duration_minutes: Number(form.duration_minutes),
        overview_text: sanitizeText(form.overview_text, 1500, { preserveNewLines: true }).trim(),
        cast_text: sanitizeText(form.cast_text, 1200, { preserveNewLines: true }).trim(),
        creatives_text: sanitizeText(form.creatives_text, 1200, { preserveNewLines: true }).trim(),
        highlights_text: sanitizeText(form.highlights_text, 1200, { preserveNewLines: true }).trim(),
        audience_text: sanitizeText(form.audience_text, 800, { preserveNewLines: true }).trim(),
        content_warnings_text: sanitizeText(form.content_warnings_text, 800, { preserveNewLines: true }).trim()
      };

      const wasEditing = Boolean(editingId);

      if (editingId) {
        await api.put(`/shows/${editingId}`, payload);
      } else {
        await api.post('/shows', payload);
      }

      await load();
      closeModal();

      setSuccess(
        wasEditing
          ? 'Η παράσταση ενημερώθηκε επιτυχώς.'
          : 'Η παράσταση δημιουργήθηκε επιτυχώς.'
      );
    } catch (submitError) {
      setError(submitError?.response?.data?.message || 'Η αποθήκευση απέτυχε.');
    }
  };

  const remove = async (id) => {
    const ok = window.confirm('Θέλεις σίγουρα να διαγράψεις αυτή την παράσταση;');
    if (!ok) return;

    try {
      setError('');
      setSuccess('');

      await api.delete(`/shows/${id}`);
      await load();
      closeModal();

      setSuccess('Η παράσταση διαγράφηκε επιτυχώς.');
    } catch (removeError) {
      setError(removeError?.response?.data?.message || 'Η διαγραφή απέτυχε.');
    }
  };

  const filtered = useMemo(() => {
    return shows.filter((item) => {
      const matchesQuery =
        !query ||
        `${item.title} ${item.genre || ''} ${item.theatre_name || ''} ${
          item.location || ''
        } ${item.description || ''} ${item.cast_text || ''} ${
          item.creatives_text || ''
        } ${item.highlights_text || ''}`
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesTheatre =
        theatreFilter === 'all' || String(item.theatre_id) === theatreFilter;

      return matchesQuery && matchesTheatre;
    });
  }, [shows, query, theatreFilter]);

  const avgDuration = useMemo(() => {
    if (!filtered.length) return 0;

    return Math.round(
      filtered.reduce(
        (sum, item) => sum + Number(item.duration_minutes || 0),
        0
      ) / filtered.length
    );
  }, [filtered]);

  const withTrailer = useMemo(
    () => filtered.filter((item) => item.trailer_url).length,
    [filtered]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [query, theatreFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const visibleStart = filtered.length
    ? (currentPage - 1) * ITEMS_PER_PAGE + 1
    : 0;

  const visibleEnd = filtered.length
    ? Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)
    : 0;

  const visiblePages = buildVisiblePages(currentPage, totalPages);

  return (
    <div className="page-stack">
      <section className="summary-strip summary-strip-4">
        <div className="glass-card summary-card">
          <span>Σύνολο παραστάσεων</span>
          <strong>{shows.length}</strong>
          <p>Καταχωρήσεις που υπάρχουν αυτή τη στιγμή στον κατάλογο</p>
        </div>

        <div className="glass-card summary-card">
          <span>Αποτελέσματα φίλτρων</span>
          <strong>{filtered.length}</strong>
          <p>Παραστάσεις που ταιριάζουν στην αναζήτηση και στο θέατρο</p>
        </div>

        <div className="glass-card summary-card">
          <span>Μέση διάρκεια</span>
          <strong>{avgDuration} λ.</strong>
          <p>Μέσος χρόνος διάρκειας των ορατών καταχωρήσεων</p>
        </div>

        <div className="glass-card summary-card">
          <span>Με trailer</span>
          <strong>{withTrailer}</strong>
          <p>Παραστάσεις που έχουν ήδη trailer link ή embed URL</p>
        </div>
      </section>

      {error && !isModalOpen ? (
        <div className="form-banner form-banner-error">{error}</div>
      ) : null}

      {success && !isModalOpen ? (
        <div className="form-banner form-banner-success">{success}</div>
      ) : null}

      <section className="surface-card list-card">
        <div className="list-header theatres-list-header">
          <div>
            <h3 className="section-heading">Κατάλογος παραστάσεων</h3>
            <p className="section-subtitle">
              Καθαρό view μόνο με κάρτες, φίλτρα, pagination και επεξεργασία μέσω popup.
            </p>
          </div>

          <div className="theatres-header-actions">
            <div className="muted-badge">{filtered.length} αποτελέσματα</div>

            <button
              type="button"
              className="primary-button"
              onClick={openCreateModal}
            >
              Προσθήκη παράστασης
            </button>
          </div>
        </div>

        <div className="toolbar-row theatres-toolbar">
          <input
            className="form-input toolbar-search"
            placeholder="Αναζήτηση με τίτλο, θέατρο, πόλη ή περιγραφή"
            value={query}
            onChange={(e) => setQuery(sanitizeText(e.target.value, 80))}
          />

          <select
            className="form-select toolbar-select"
            value={theatreFilter}
            onChange={(e) => setTheatreFilter(e.target.value)}
          >
            <option value="all">Όλα τα θέατρα</option>

            {theatres.map((theatre) => (
              <option key={theatre.theatre_id} value={String(theatre.theatre_id)}>
                {theatre.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="ghost-button"
            onClick={() => {
              setQuery('');
              setTheatreFilter('all');
              setError('');
              setSuccess('');
            }}
          >
            Καθαρισμός
          </button>
        </div>

        <div className="catalog-grid theatres-grid">
          {paginatedItems.length ? (
            paginatedItems.map((item) => (
              <article
                key={item.show_id}
                className="catalog-card theatre-card-compact show-admin-card"
              >
                <div className="catalog-media theatre-card-media show-media">
                  {item.poster_url ? (
                    <img src={resolveMediaUrl(item.poster_url)} alt={item.title} />
                  ) : (
                    <div className="media-fallback">
                      {item.title?.slice(0, 1)?.toUpperCase() || 'Π'}
                    </div>
                  )}
                </div>

                <div className="catalog-body">
                  <div className="catalog-row-top">
                    <div>
                      <h4>{item.title}</h4>
                      <span>
                        {item.theatre_name || 'Χωρίς θέατρο'} ·{' '}
                        {item.location || 'Χωρίς πόλη'}
                      </span>
                    </div>

                    <span className="status-pill success">
                      {item.age_rating || '12+'}
                    </span>
                  </div>

                  <div className="catalog-meta-row">
                    <span>{item.genre || 'Παράσταση'}</span>
                    <span>{item.duration_minutes || 0} λεπτά</span>
                    <span>{item.trailer_url ? 'Με trailer' : 'Χωρίς trailer'}</span>
                  </div>

                  <p className="catalog-copy theatre-card-copy">
                    {item.description ||
                      'Δεν υπάρχει ακόμη περιγραφή για αυτή την παράσταση.'}
                  </p>

                  <div className="button-row">
                    <button
                      type="button"
                      className="secondary-button theatre-edit-button"
                      onClick={() => openEditModal(item)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <article className="catalog-card empty-state-card">
              <div>
                <strong>Δεν βρέθηκαν παραστάσεις</strong>
                <span>Δοκίμασε άλλη αναζήτηση ή καθάρισε τα ενεργά φίλτρα.</span>
              </div>
            </article>
          )}
        </div>

        {filtered.length ? (
          <div className="pagination-bar">
            <div className="pagination-meta">
              Εμφάνιση {visibleStart}-{visibleEnd} από {filtered.length} παραστάσεις
            </div>

            <div className="pagination-controls">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                Προηγούμενη
              </button>

              {visiblePages.map((page) =>
                typeof page === 'string' ? (
                  <span key={page} className="pagination-ellipsis">
                    …
                  </span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    className={`pagination-page ${
                      page === currentPage ? 'active' : ''
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={currentPage === totalPages}
              >
                Επόμενη
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {isModalOpen ? (
        <div className="modal-overlay" onClick={closeModal}>
          <section className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="kicker">Παραστάσεις</div>

                <h3 className="section-heading">
                  {editingId ? 'Επεξεργασία παράστασης' : 'Προσθήκη παράστασης'}
                </h3>

                <p className="section-subtitle">
                  Διαχειρίσου poster, hero εικόνα, trailer και βασικά στοιχεία χωρίς να βαραίνει η σελίδα.
                </p>
              </div>

              <button type="button" className="modal-close" onClick={closeModal}>
                ✕
              </button>
            </div>

            <form className="app-form" onSubmit={submit}>
              {error ? (
                <div className="form-banner form-banner-error">{error}</div>
              ) : null}

              {success ? (
                <div className="form-banner form-banner-success">{success}</div>
              ) : null}

              <div className="form-field">
                <label>Θέατρο</label>

                <select
                  className="form-select"
                  value={form.theatre_id}
                  onChange={(e) =>
                    setForm({ ...form, theatre_id: e.target.value })
                  }
                >
                  <option value="">Επιλογή θεάτρου</option>

                  {theatres.map((theatre) => (
                    <option key={theatre.theatre_id} value={theatre.theatre_id}>
                      {theatre.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Τίτλος</label>

                <input
                  className="form-input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="π.χ. Άμλετ"
                />
              </div>

              <div className="form-field">
                <label>Είδος</label>

                <select
                  className="form-select"
                  value={form.genre}
                  onChange={(e) => setForm({ ...form, genre: e.target.value })}
                >
                  {form.genre && !GENRE_OPTIONS.includes(form.genre) ? (
                    <option value={form.genre}>{form.genre}</option>
                  ) : null}

                  {GENRE_OPTIONS.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Διάρκεια (λεπτά)</label>

                  <input
                    className="form-input"
                    type="number"
                    value={form.duration_minutes}
                    onChange={(e) =>
                      setForm({ ...form, duration_minutes: e.target.value })
                    }
                  />
                </div>

                <div className="form-field">
                  <label>Καταλληλότητα</label>

                  <select
                    className="form-select"
                    value={form.age_rating}
                    onChange={(e) =>
                      setForm({ ...form, age_rating: e.target.value })
                    }
                  >
                    {form.age_rating &&
                    !AGE_RATING_OPTIONS.includes(form.age_rating) ? (
                      <option value={form.age_rating}>{form.age_rating}</option>
                    ) : null}

                    {AGE_RATING_OPTIONS.map((rating) => (
                      <option key={rating} value={rating}>
                        {rating}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label>Poster εικόνα</label>

                <input
                  className="form-input"
                  value={form.poster_url}
                  readOnly
                  placeholder="Ανέβασε poster"
                />

                <input
                  ref={posterRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) =>
                    e.target.files?.[0] &&
                    uploadImage(e.target.files[0], 'poster_url')
                  }
                />

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => posterRef.current?.click()}
                >
                  Μεταφόρτωση poster
                </button>

                {form.poster_url ? (
                  <div className="poster-preview">
                    <img src={resolveMediaUrl(form.poster_url)} alt="Poster preview" />
                  </div>
                ) : null}
              </div>

              <div className="form-field">
                <label>Hero / Banner εικόνα</label>

                <input
                  className="form-input"
                  value={form.hero_image_url}
                  readOnly
                  placeholder="Ανέβασε hero εικόνα"
                />

                <input
                  ref={heroRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) =>
                    e.target.files?.[0] &&
                    uploadImage(e.target.files[0], 'hero_image_url')
                  }
                />

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => heroRef.current?.click()}
                >
                  Μεταφόρτωση hero εικόνας
                </button>

                {form.hero_image_url ? (
                  <div className="poster-preview">
                    <img src={resolveMediaUrl(form.hero_image_url)} alt="Hero preview" />
                  </div>
                ) : null}
              </div>

              <div className="form-field">
                <label>Trailer URL / Embed URL</label>

                <input
                  className="form-input"
                  value={form.trailer_url}
                  onChange={(e) =>
                    setForm({ ...form, trailer_url: e.target.value })
                  }
                  placeholder="YouTube link, youtu.be ή embed URL"
                />
              </div>

              <div className="form-field">
                <label>Περιγραφή</label>

                <textarea
                  className="form-textarea"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Σύντομη ή αναλυτική περιγραφή της παράστασης."
                />
              </div>

              <div className="form-field">
                <label>Τι θα δεις στην παράσταση</label>

                <textarea
                  className="form-textarea"
                  value={form.overview_text}
                  onChange={(e) =>
                    setForm({ ...form, overview_text: e.target.value })
                  }
                  placeholder="Προαιρετικό αναλυτικό κείμενο για την εμπειρία της παράστασης."
                />
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Ηθοποιοί & ρόλοι</label>

                  <textarea
                    className="form-textarea"
                    value={form.cast_text}
                    onChange={(e) =>
                      setForm({ ...form, cast_text: e.target.value })
                    }
                    placeholder={
                      'Ένας ανά γραμμή, π.χ.\nΙωάννα Μεσσήνη — Αντιγόνη\nΔημήτρης Πατίλης — Κρέων'
                    }
                  />
                </div>

                <div className="form-field">
                  <label>Συντελεστές παραγωγής</label>

                  <textarea
                    className="form-textarea"
                    value={form.creatives_text}
                    onChange={(e) =>
                      setForm({ ...form, creatives_text: e.target.value })
                    }
                    placeholder={
                      'Ένας ανά γραμμή, π.χ.\nΣκηνοθεσία: Ναταλία Σαμαρά\nΚοστούμια: Μαρίνα Αυγέρη'
                    }
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Γιατί να τη δεις</label>

                <textarea
                  className="form-textarea"
                  value={form.highlights_text}
                  onChange={(e) =>
                    setForm({ ...form, highlights_text: e.target.value })
                  }
                  placeholder={
                    'Ένα highlight ανά γραμμή, π.χ.\nΔυνατές ερμηνείες\nΕντυπωσιακή σκηνοθετική ματιά'
                  }
                />
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Χρήσιμες πληροφορίες / κοινό</label>

                  <textarea
                    className="form-textarea"
                    value={form.audience_text}
                    onChange={(e) =>
                      setForm({ ...form, audience_text: e.target.value })
                    }
                    placeholder="Προαιρετικό κείμενο για το κοινό, την πρόσβαση ή άλλες πληροφορίες."
                  />
                </div>

                <div className="form-field">
                  <label>Προειδοποιήσεις περιεχομένου</label>

                  <textarea
                    className="form-textarea"
                    value={form.content_warnings_text}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        content_warnings_text: e.target.value
                      })
                    }
                    placeholder={
                      'Μία ανά γραμμή, π.χ.\nΈντονη δραματική ένταση\nΚατάλληλο για 15+'
                    }
                  />
                </div>
              </div>

              <div className="modal-footer">
                <div>
                  {editingId ? (
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => remove(editingId)}
                    >
                      Διαγραφή παράστασης
                    </button>
                  ) : null}
                </div>

                <div className="button-row">
                  <button
                    className="primary-button"
                    disabled={!form.theatre_id || !form.title.trim()}
                  >
                    {editingId ? 'Αποθήκευση αλλαγών' : 'Δημιουργία παράστασης'}
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={closeModal}
                  >
                    Ακύρωση
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { cleanPromoCode, sanitizeText } from '../utils/validation';

const ITEMS_PER_PAGE = 12;
const blank = {
  code: '',
  title: '',
  description: '',
  discount_type: 'percent',
  discount_value: 10,
  is_active: true
};

export default function PromosPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const load = async () => {
    const { data } = await api.get('/promos', { params: { q: query, status: statusFilter } });
    setItems(data || []);
  };

  useEffect(() => { load(); }, [query, statusFilter]);
  useEffect(() => { setCurrentPage(1); }, [query, statusFilter]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(blank);
    setError('');
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm(blank);
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.promo_id);
    setForm({
      code: item.code || '',
      title: item.title || '',
      description: item.description || '',
      discount_type: item.discount_type || 'percent',
      discount_value: item.discount_value || 0,
      is_active: Boolean(item.is_active)
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
      const cleanCode = cleanPromoCode(form.code);
      const cleanTitle = sanitizeText(form.title, 120).trim();
      const cleanDescription = sanitizeText(form.description, 600, { preserveNewLines: true }).trim();
      const discountValue = Number(form.discount_value);

      if (!cleanCode || !cleanTitle) {
        setError('Συμπλήρωσε έγκυρο κωδικό και τίτλο προσφοράς.');
        return;
      }
      if (!Number.isFinite(discountValue) || discountValue <= 0) {
        setError('Η τιμή έκπτωσης πρέπει να είναι θετικός αριθμός.');
        return;
      }
      if (form.discount_type === 'percent' && discountValue > 100) {
        setError('Η ποσοστιαία έκπτωση δεν μπορεί να ξεπερνά το 100%.');
        return;
      }

      const payload = {
        ...form,
        code: cleanCode,
        title: cleanTitle,
        description: cleanDescription,
        discount_value: discountValue,
        is_active: Boolean(form.is_active)
      };
      if (editingId) {
        await api.put(`/promos/${editingId}`, payload);
        setSuccess('Η προσφορά ενημερώθηκε επιτυχώς.');
      } else {
        await api.post('/promos', payload);
        setSuccess('Η προσφορά δημιουργήθηκε επιτυχώς.');
      }
      await load();
      closeModal();
    } catch (error) {
      setError(error?.response?.data?.message || 'Η αποθήκευση απέτυχε.');
    }
  };

  const removePromo = async (id) => {
    const ok = window.confirm('Θέλεις σίγουρα να διαγράψεις αυτή την προσφορά;');
    if (!ok) return;
    try {
      setError('');
      setSuccess('');
      await api.delete(`/promos/${id}`);
      await load();
      closeModal();
      setSuccess('Η προσφορά διαγράφηκε επιτυχώς.');
    } catch (error) {
      setError(error?.response?.data?.message || 'Η διαγραφή απέτυχε.');
    }
  };

  const activeCount = useMemo(() => items.filter((item) => Number(item.is_active) === 1).length, [items]);
  const percentCount = useMemo(() => items.filter((item) => item.discount_type === 'percent').length, [items]);
  const fixedCount = useMemo(() => items.filter((item) => item.discount_type === 'fixed').length, [items]);

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
        <div className="glass-card summary-card"><span>Σύνολο προσφορών</span><strong>{items.length}</strong><p>Κωδικοί προσφοράς που ταιριάζουν στα φίλτρα</p></div>
        <div className="glass-card summary-card"><span>Ενεργές</span><strong>{activeCount}</strong><p>Κωδικοί που μπορούν να χρησιμοποιηθούν</p></div>
        <div className="glass-card summary-card"><span>Ποσοστιαίες</span><strong>{percentCount}</strong><p>Εκπτώσεις τύπου ποσοστού</p></div>
        <div className="glass-card summary-card"><span>Σταθερού ποσού</span><strong>{fixedCount}</strong><p>Εκπτώσεις με σταθερό ποσό</p></div>
      </section>

      {error && !isModalOpen ? <div className="form-banner form-banner-error">{error}</div> : null}
      {success && !isModalOpen ? <div className="form-banner form-banner-success">{success}</div> : null}

      <section className="surface-card list-card">
        <div className="list-header theatres-list-header">
          <div>
            <h3 className="section-heading">Κατάλογος προσφορών</h3>
            <p className="section-subtitle">Διαχειρίσου όλους τους κωδικούς έκπτωσης με ενιαίο τρόπο εργασίας.</p>
          </div>
          <div className="theatres-header-actions">
            <div className="muted-badge">{visibleStart}-{visibleEnd} από {items.length}</div>
            <button type="button" className="primary-button" onClick={openCreateModal}>Προσθήκη προσφοράς</button>
          </div>
        </div>

        <div className="toolbar-row theatres-toolbar">
          <input className="form-input toolbar-search" placeholder="Αναζήτηση με code, τίτλο ή περιγραφή" value={query} onChange={(e) => setQuery(sanitizeText(e.target.value, 80))} />
          <select className="form-select toolbar-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Όλες</option>
            <option value="active">Μόνο ενεργές</option>
            <option value="inactive">Μόνο ανενεργές</option>
          </select>
          <button type="button" className="ghost-button" onClick={() => { setQuery(''); setStatusFilter('all'); setError(''); setSuccess(''); }}>
            Καθαρισμός
          </button>
        </div>

        <div className="catalog-grid catalog-grid-promos">
          {paginatedItems.length ? paginatedItems.map((item) => (
            <article key={item.promo_id} className="catalog-card promo-card">
              <div className="catalog-body">
                <div className="catalog-row-top">
                  <div>
                    <h4>{item.title}</h4>
                    <span>Κωδικός: {item.code}</span>
                  </div>
                  <span className={`status-pill ${Number(item.is_active) === 1 ? 'success' : 'muted'}`}>
                    {Number(item.is_active) === 1 ? 'Ενεργή' : 'Ανενεργή'}
                  </span>
                </div>
                <div className="catalog-meta-row">
                  <span>{item.discount_type === 'percent' ? `${item.discount_value}%` : `€${item.discount_value}`}</span>
                  <span>{item.discount_type === 'percent' ? 'Ποσοστιαία έκπτωση' : 'Σταθερή έκπτωση'}</span>
                </div>
                <p className="catalog-copy">{item.description || 'Δεν έχει προστεθεί περιγραφή για αυτή την προσφορά.'}</p>
                <div className="button-row">
                  <button className="secondary-button" onClick={() => openEditModal(item)}>Επεξεργασία</button>
                </div>
              </div>
            </article>
          )) : (
            <article className="catalog-card empty-state-card"><div><strong>Δεν βρέθηκαν προσφορές</strong><span>Δοκίμασε άλλη αναζήτηση ή καθάρισε τα φίλτρα.</span></div></article>
          )}
        </div>

        {items.length > ITEMS_PER_PAGE ? (
          <div className="pagination-bar">
            <div className="pagination-meta">Σελίδα {currentPage} από {totalPages}</div>
            <div className="pagination-controls">
              <button type="button" className="ghost-button" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Προηγούμενη</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1).map((page, index, arr) => (
                <React.Fragment key={page}>
                  {index > 0 && arr[index - 1] !== page - 1 ? <span className="pagination-ellipsis">…</span> : null}
                  <button type="button" className={`pagination-page ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>
                </React.Fragment>
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
                <div className="kicker">Προσφορές</div>
                <h3 className="section-heading">{editingId ? 'Επεξεργασία προσφοράς' : 'Προσθήκη προσφοράς'}</h3>
                <p className="section-subtitle">Διαχείριση κωδικού έκπτωσης και εμπορικών στοιχείων.</p>
              </div>
              <button type="button" className="modal-close" onClick={closeModal}>✕</button>
            </div>

            <form className="app-form" onSubmit={submit}>
              {error ? <div className="form-banner form-banner-error">{error}</div> : null}
              <div className="form-grid-2">
                <div className="form-field"><label>Κωδικός</label><input className="form-input" value={form.code} onChange={(e) => setForm({ ...form, code: cleanPromoCode(e.target.value) })} placeholder="π.χ. PREMIERE20" required /></div>
                <div className="form-field"><label>Τίτλος</label><input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: sanitizeText(e.target.value, 120) })} placeholder="Τίτλος προσφοράς" required /></div>
              </div>
              <div className="form-field"><label>Περιγραφή</label><textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: sanitizeText(e.target.value, 600, { preserveNewLines: true }) })} placeholder="Προαιρετική περιγραφή χρήσης της προσφοράς." maxLength={600} /></div>
              <div className="form-grid-2">
                <div className="form-field"><label>Τύπος έκπτωσης</label><select className="form-select" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}><option value="percent">Ποσοστό (%)</option><option value="fixed">Σταθερό ποσό (€)</option></select></div>
                <div className="form-field"><label>Τιμή έκπτωσης</label><input className="form-input" type="number" min="0" max={form.discount_type === 'percent' ? '100' : undefined} step="0.01" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} required /></div>
              </div>
              <div className="form-field"><label>Κατάσταση</label><select className="form-select" value={form.is_active ? '1' : '0'} onChange={(e) => setForm({ ...form, is_active: e.target.value === '1' })}><option value="1">Ενεργή</option><option value="0">Ανενεργή</option></select></div>
              <div className="modal-footer">
                <div className="button-row">{editingId ? <button type="button" className="danger-button" onClick={() => removePromo(editingId)}>Διαγραφή</button> : null}</div>
                <div className="button-row"><button type="button" className="ghost-button" onClick={closeModal}>Ακύρωση</button><button className="primary-button">{editingId ? 'Αποθήκευση αλλαγών' : 'Δημιουργία προσφοράς'}</button></div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

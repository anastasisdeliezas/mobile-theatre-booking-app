import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { normalizeName, sanitizeText } from '../utils/validation';

const ITEMS_PER_PAGE = 12;

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('el-GR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function money(value) {
  return `€${Number(value || 0).toFixed(2)}`;
}

function statusLabel(status) {
  if (status === 'confirmed') return 'Επιβεβαιωμένη';
  if (status === 'cancelled') return 'Ακυρωμένη';
  if (status === 'pending') return 'Σε αναμονή';
  return status || '—';
}

function statusClass(status) {
  if (status === 'confirmed') return 'success';
  if (status === 'cancelled') return 'muted';
  return 'info';
}

function seatCategoryLabel(category) {
  if (category === 'VIP') return 'VIP';
  if (category === 'Economy') return 'Economy';
  return 'Regular';
}

function seatMapLabel(seat) {
  return `${seat.row_label}${seat.seat_number}`;
}

function parseSeatIds(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((part) => Number(part.trim()))
    .filter(Boolean);
}

function maskCard(last4) {
  if (!last4) return '—';
  return `**** **** **** ${last4}`;
}

function PaymentForm({ card, setCard, disabled }) {
  const formatCardNumber = (value) => {
    const digits = String(value || '')
      .replace(/\D/g, '')
      .slice(0, 16);
    const groups = digits.match(/.{1,4}/g) || [];
    return groups.join(' ');
  };

  const formatExpiry = (value) => {
    const digits = String(value || '')
      .replace(/\D/g, '')
      .slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  return (
    <div className="reservation-payment-box">
      <div className="reservation-payment-heading">
        <strong>Απαιτείται συμπληρωματική πληρωμή</strong>
        <span>
          Η αλλαγή προσθέτει επιπλέον θέσεις. Ολοκλήρωσε τη χρέωση της διαφοράς
          για να ενημερωθεί η κράτηση.
        </span>
      </div>

      <div className="form-grid-2">
        <div className="form-field">
          <label>Όνομα κατόχου</label>
          <input
            className="form-input"
            value={card.holder}
            disabled={disabled}
            onChange={(e) =>
              setCard((prev) => ({ ...prev, holder: normalizeName(e.target.value, 120) }))
            }
            placeholder="Ονοματεπώνυμο"
            maxLength={120}
            autoComplete="cc-name"
          />
        </div>
        <div className="form-field">
          <label>Αριθμός κάρτας</label>
          <input
            className="form-input"
            value={card.number}
            disabled={disabled}
            onChange={(e) =>
              setCard((prev) => ({
                ...prev,
                number: formatCardNumber(e.target.value)
              }))
            }
            placeholder="1234 5678 9012 3456"
            inputMode="numeric"
            autoComplete="cc-number"
          />
        </div>
      </div>

      <div className="form-grid-2 reservation-payment-grid-3">
        <div className="form-field">
          <label>Λήξη</label>
          <input
            className="form-input"
            value={card.expiry}
            disabled={disabled}
            onChange={(e) =>
              setCard((prev) => ({
                ...prev,
                expiry: formatExpiry(e.target.value)
              }))
            }
            placeholder="MM/YY"
            inputMode="numeric"
            autoComplete="cc-exp"
          />
        </div>
        <div className="form-field">
          <label>CVV</label>
          <input
            className="form-input"
            value={card.cvv}
            disabled={disabled}
            onChange={(e) =>
              setCard((prev) => ({
                ...prev,
                cvv: String(e.target.value || '')
                  .replace(/\D/g, '')
                  .slice(0, 3)
              }))
            }
            placeholder="123"
            inputMode="numeric"
            autoComplete="cc-csc"
          />
        </div>
        <div className="form-field">
          <label>Τρόπος πληρωμής</label>
          <input className="form-input" value="Κάρτα" disabled />
        </div>
      </div>
    </div>
  );
}

export default function ReservationsPage() {
  const [items, setItems] = useState([]);
  const [shows, setShows] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilter, setShowFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [seatOptions, setSeatOptions] = useState([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [paymentCard, setPaymentCard] = useState({
    holder: '',
    number: '',
    expiry: '',
    cvv: ''
  });

  const load = async () => {
    const [reservationsRes, showsRes] = await Promise.all([
      api.get('/admin/reservations', {
        params: {
          q: query,
          status: statusFilter,
          showId: showFilter,
          date: dateFilter
        }
      }),
      api.get('/shows')
    ]);

    setItems(reservationsRes.data || []);
    setShows(showsRes.data || []);
  };

  useEffect(() => {
    load();
  }, [query, statusFilter, showFilter, dateFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter, showFilter, dateFilter]);

  useEffect(() => {
    if (!isEditModalOpen || !editingReservation) return;

    if (!selectedSeatIds.length) {
      setPreview(null);
      return;
    }

    const currentSeatIds = parseSeatIds(editingReservation.seat_ids || '').sort(
      (a, b) => a - b
    );
    const nextSeatIds = [...selectedSeatIds].sort((a, b) => a - b);

    const sameSeats =
      currentSeatIds.length === nextSeatIds.length &&
      currentSeatIds.every((value, index) => value === nextSeatIds[index]);

    if (sameSeats) {
      const currentLabels = (editingReservation.seats || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      setPreview({
        current: {
          totals: {
            final_price: Number(
              (editingReservation.final_price ?? editingReservation.base_price) || 0
            )
          }
        },
        proposed: {
          seats: currentLabels.map((label, index) => ({ seat_id: index + 1, label })),
          totals: {
            final_price: Number(
              (editingReservation.final_price ?? editingReservation.base_price) || 0
            ),
            discount_amount: Number(editingReservation.discount_amount || 0)
          }
        },
        changes: {
          kept: currentLabels.map((label, index) => ({ seat_id: index + 1, label })),
          added: [],
          removed: []
        },
        payment: {
          amount_delta: 0,
          amount_due: 0,
          requires_payment: false
        }
      });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setPreviewLoading(true);
        setError('');

        const { data } = await api.post(
          `/reservations/${editingReservation.reservation_id}/modification-preview`,
          { seat_ids: selectedSeatIds }
        );

        setPreview(data);
      } catch (previewError) {
        setPreview(null);
        setError(
          previewError?.response?.data?.message ||
            'Δεν ήταν δυνατός ο υπολογισμός της τροποποίησης κράτησης.'
        );
      } finally {
        setPreviewLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [isEditModalOpen, editingReservation, selectedSeatIds]);

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingReservation(null);
    setSeatOptions([]);
    setSelectedSeatIds([]);
    setLoadingSeats(false);
    setSavingEdit(false);
    setPreview(null);
    setPreviewLoading(false);
    setPaymentCard({ holder: '', number: '', expiry: '', cvv: '' });
  };

  const openEditModal = async (reservation) => {
    try {
      setError('');
      setSuccess('');
      setLoadingSeats(true);
      setEditingReservation(reservation);
      setSelectedSeatIds(parseSeatIds(reservation.seat_ids || ''));
      setIsEditModalOpen(true);

      const { data } = await api.get('/seats', {
        params: { showtimeId: reservation.showtime_id }
      });

      setSeatOptions(data || []);
    } catch (modalError) {
      setError(
        modalError?.response?.data?.message ||
          'Η φόρτωση θέσεων για επεξεργασία απέτυχε.'
      );
      closeEditModal();
    } finally {
      setLoadingSeats(false);
    }
  };

  const toggleSeatSelection = (seatId) => {
    setError('');
    setSuccess('');
    setPreview(null);
    setSelectedSeatIds((prev) =>
      prev.includes(seatId)
        ? prev.filter((id) => id !== seatId)
        : [...prev, seatId]
    );
  };

  const validatePaymentCard = () => {
    const digits = String(paymentCard.number || '').replace(/\D/g, '');
    const expiryDigits = String(paymentCard.expiry || '').replace(/\D/g, '');

    if (!paymentCard.holder.trim()) return 'Συμπλήρωσε το όνομα κατόχου.';
    if (!/^[\p{L} ]{2,120}$/u.test(paymentCard.holder.trim())) {
      return 'Το όνομα κατόχου πρέπει να περιέχει μόνο γράμματα, χωρίς αριθμούς ή σύμβολα.';
    }
    if (digits.length !== 16) return 'Ο αριθμός κάρτας πρέπει να έχει 16 ψηφία.';
    if (expiryDigits.length !== 4) return 'Η λήξη κάρτας πρέπει να είναι στη μορφή MM/YY.';
    if (String(paymentCard.cvv || '').length !== 3) return 'Το CVV πρέπει να έχει 3 ψηφία.';
    return '';
  };

  const saveReservationEdit = async () => {
    if (!editingReservation) return;

    if (!selectedSeatIds.length) {
      setError(
        'Μια κράτηση πρέπει να έχει τουλάχιστον μία θέση. Αν θέλεις πλήρη ακύρωση, χρησιμοποίησε το "Ακύρωση κράτησης".'
      );
      return;
    }

    try {
      setSavingEdit(true);
      setError('');
      setSuccess('');

      const localPreview =
        preview ||
        (
          await api.post(
            `/reservations/${editingReservation.reservation_id}/modification-preview`,
            { seat_ids: selectedSeatIds }
          )
        ).data;

      const payload = { seat_ids: selectedSeatIds };

      if (localPreview?.payment?.requires_payment) {
        const cardError = validatePaymentCard();
        if (cardError) {
          setError(cardError);
          setSavingEdit(false);
          return;
        }

        const cardDigits = String(paymentCard.number || '').replace(/\D/g, '');
        payload.payment_method = 'card_demo';
        payload.card_last4 = cardDigits.slice(-4);
      }

      const { data } = await api.post(
        `/reservations/${editingReservation.reservation_id}/modification-confirm`,
        payload
      );

      await load();
      closeEditModal();

      if (data?.payment?.requires_payment) {
        setSuccess(
          `Η κράτηση ενημερώθηκε επιτυχώς και χρεώθηκε επιπλέον ποσό ${money(
            data.payment.amount_due
          )}.`
        );
      } else if (Number(data?.payment?.amount_delta || 0) < 0) {
        setSuccess(
          'Η κράτηση ενημερώθηκε επιτυχώς και το νέο σύνολο αποτυπώθηκε στα στοιχεία κράτησης.'
        );
      } else {
        setSuccess('Η κράτηση ενημερώθηκε επιτυχώς.');
      }
    } catch (saveError) {
      setError(
        saveError?.response?.data?.message ||
          'Η ενημέρωση της κράτησης απέτυχε.'
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const cancelReservation = async (reservationId) => {
    const ok = window.confirm('Θέλεις σίγουρα να ακυρώσεις αυτή την κράτηση;');
    if (!ok) return;

    try {
      setError('');
      setSuccess('');
      await api.patch(`/reservations/${reservationId}/cancel`);
      setSuccess('Η κράτηση ακυρώθηκε επιτυχώς.');
      load();
    } catch (cancelError) {
      setError(cancelError?.response?.data?.message || 'Η ακύρωση απέτυχε.');
    }
  };

  const resendReceipt = async (reservationId) => {
    try {
      setError('');
      setSuccess('');
      await api.post(`/reservations/${reservationId}/resend-receipt`);
      setSuccess('Η απόδειξη στάλθηκε ξανά στο email του χρήστη.');
    } catch (receiptError) {
      setError(
        receiptError?.response?.data?.message || 'Η επαναποστολή απέτυχε.'
      );
    }
  };

  const downloadPdf = async (reservationId, bookingCode) => {
    try {
      setError('');
      setSuccess('');

      const res = await api.get(`/reservations/${reservationId}/receipt-pdf`, {
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${bookingCode || reservationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setSuccess('Το PDF κατέβηκε επιτυχώς.');
    } catch (pdfError) {
      setError(pdfError?.response?.data?.message || 'Η λήψη του PDF απέτυχε.');
    }
  };

  const confirmedCount = useMemo(
    () => items.filter((item) => item.status === 'confirmed').length,
    [items]
  );

  const cancelledCount = useMemo(
    () => items.filter((item) => item.status === 'cancelled').length,
    [items]
  );

  const totalRevenue = useMemo(
    () =>
      items
        .filter((item) => item.status === 'confirmed')
        .reduce(
          (sum, item) => sum + Number((item.final_price ?? item.base_price) || 0),
          0
        )
        .toFixed(2),
    [items]
  );

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

  const paginatedItems = useMemo(
    () =>
      items.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
      ),
    [items, currentPage]
  );

  const visibleStart = items.length
    ? (currentPage - 1) * ITEMS_PER_PAGE + 1
    : 0;
  const visibleEnd = items.length
    ? Math.min(currentPage * ITEMS_PER_PAGE, items.length)
    : 0;

  return (
    <div className="page-stack">
      <section className="summary-strip summary-strip-4">
        <div className="glass-card summary-card">
          <span>Σύνολο κρατήσεων</span>
          <strong>{items.length}</strong>
          <p>Κρατήσεις που ταιριάζουν στα ενεργά φίλτρα</p>
        </div>
        <div className="glass-card summary-card">
          <span>Επιβεβαιωμένες</span>
          <strong>{confirmedCount}</strong>
          <p>Κρατήσεις που παραμένουν ενεργές</p>
        </div>
        <div className="glass-card summary-card">
          <span>Ακυρωμένες</span>
          <strong>{cancelledCount}</strong>
          <p>Κρατήσεις που έχουν ακυρωθεί</p>
        </div>
        <div className="glass-card summary-card">
          <span>Συνολικό ποσό</span>
          <strong>€{totalRevenue}</strong>
          <p>Άθροισμα τελικών τιμών των επιβεβαιωμένων κρατήσεων</p>
        </div>
      </section>

      <section className="surface-card list-card">
        <div className="list-header theatres-list-header">
          <div>
            <h3 className="section-heading">Διαχείριση κρατήσεων</h3>
            <p className="section-subtitle">
              Αναζήτησε booking codes, χρήστες και τίτλους παραστάσεων και
              εκτέλεσε βασικές ενέργειες διαχείρισης.
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
            placeholder="Αναζήτηση με όνομα, email, booking code, τίτλο ή θέατρο"
            value={query}
            onChange={(e) => setQuery(sanitizeText(e.target.value, 80))}
          />

          <select
            className="form-select toolbar-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Όλες οι καταστάσεις</option>
            <option value="confirmed">Επιβεβαιωμένες</option>
            <option value="cancelled">Ακυρωμένες</option>
            <option value="pending">Σε αναμονή</option>
          </select>

          <select
            className="form-select toolbar-select"
            value={showFilter}
            onChange={(e) => setShowFilter(e.target.value)}
          >
            <option value="all">Όλες οι παραστάσεις</option>
            {shows.map((show) => (
              <option key={show.show_id} value={show.show_id}>
                {show.title}
              </option>
            ))}
          </select>

          <input
            className="form-input toolbar-select"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />

          <button
            type="button"
            className="ghost-button"
            onClick={() => {
              setQuery('');
              setStatusFilter('all');
              setShowFilter('all');
              setDateFilter('');
            }}
          >
            Καθαρισμός
          </button>
        </div>

        <div className="catalog-grid catalog-grid-reservations">
          {paginatedItems.length ? (
            paginatedItems.map((item) => (
              <article
                key={item.reservation_id}
                className="catalog-card reservation-card reservation-card-polished"
              >
                <div className="catalog-body">
                  <div className="reservation-top-row">
                    <div className="reservation-title-block">
                      <div className="reservation-booking-code">
                        Κωδικός κράτησης: <strong>{item.booking_code}</strong>
                      </div>
                      <h4>{item.show_title}</h4>
                      <span>
                        {item.theatre_name} · {item.location}
                      </span>
                    </div>
                    <span className={`status-pill ${statusClass(item.status)}`}>
                      {statusLabel(item.status)}
                    </span>
                  </div>

                  <div className="reservation-meta-grid">
                    <div className="reservation-meta-chip">
                      <span>Ημερομηνία</span>
                      <strong>{formatDateTime(item.start_time)}</strong>
                    </div>
                    <div className="reservation-meta-chip">
                      <span>Αίθουσα</span>
                      <strong>{item.hall_name || '—'}</strong>
                    </div>
                    <div className="reservation-meta-chip">
                      <span>Θέσεις</span>
                      <strong>{item.seats || '—'}</strong>
                    </div>
                    <div className="reservation-meta-chip">
                      <span>Τελική τιμή</span>
                      <strong>{money(item.final_price ?? item.base_price)}</strong>
                    </div>
                  </div>

                  <div className="reservation-user-panel">
                    <div className="reservation-user-main">
                      <strong>{item.customer_name || 'Άγνωστος χρήστης'}</strong>
                      <span>{item.customer_email || '—'}</span>
                    </div>
                    <div className="reservation-created-at">
                      Πληρωμή:{' '}
                      {item.payment_method === 'card_demo'
                        ? `${maskCard(item.card_last4)} · Κάρτα`
                        : 'Πληρωμή στο ταμείο'}
                    </div>
                  </div>

                  <div className="button-row reservation-actions-row">
                    {item.status === 'confirmed' ? (
                      <button
                        className="secondary-button"
                        onClick={() => openEditModal(item)}
                      >
                        Επεξεργασία κράτησης
                      </button>
                    ) : null}

                    <button
                      className="ghost-button"
                      onClick={() =>
                        downloadPdf(item.reservation_id, item.booking_code)
                      }
                    >
                      Λήψη PDF
                    </button>

                    <button
                      className="ghost-button"
                      onClick={() => resendReceipt(item.reservation_id)}
                    >
                      Επαναποστολή απόδειξης
                    </button>

                    {item.status !== 'cancelled' ? (
                      <button
                        className="secondary-button"
                        onClick={() => cancelReservation(item.reservation_id)}
                      >
                        Ακύρωση κράτησης
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <article className="catalog-card empty-state-card">
              <div>
                <strong>Δεν βρέθηκαν κρατήσεις</strong>
                <span>Δοκίμασε άλλη αναζήτηση ή καθάρισε τα φίλτρα.</span>
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
                      className={`pagination-page ${
                        currentPage === page ? 'active' : ''
                      }`}
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

      {isEditModalOpen ? (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div
            className="modal-card reservation-edit-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="kicker">Κρατήσεις</div>
                <h3 className="section-heading">Τροποποίηση κράτησης</h3>
                <p className="section-subtitle">
                  Μπορείς να κρατήσεις τις ήδη υπάρχουσες θέσεις, να προσθέσεις
                  νέες ή να αφαιρέσεις θέσεις. Αν προκύψει επιπλέον ποσό, θα
                  ολοκληρωθεί νέα demo πληρωμή για τη διαφορά.
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={closeEditModal}
              >
                ✕
              </button>
            </div>

            {editingReservation ? (
              <>
                <div className="reservation-edit-summary">
                  <div className="reservation-meta-chip">
                    <span>Παράσταση</span>
                    <strong>{editingReservation.show_title}</strong>
                  </div>
                  <div className="reservation-meta-chip">
                    <span>Προβολή</span>
                    <strong>{formatDateTime(editingReservation.start_time)}</strong>
                  </div>
                  <div className="reservation-meta-chip">
                    <span>Αίθουσα</span>
                    <strong>{editingReservation.hall_name || '—'}</strong>
                  </div>
                  <div className="reservation-meta-chip">
                    <span>Τρέχουσα τιμή</span>
                    <strong>
                      {money(
                        editingReservation.final_price ??
                          editingReservation.base_price
                      )}
                    </strong>
                  </div>
                </div>

                {loadingSeats ? (
                  <div className="panel-item">
                    <span>Φόρτωση θέσεων...</span>
                  </div>
                ) : (
                  <>
                    <div className="reservation-seat-legend">
                      <span className="seat-legend-item">
                        <i className="seat-legend-box seat-legend-available" />
                        Διαθέσιμη
                      </span>
                      <span className="seat-legend-item">
                        <i className="seat-legend-box seat-legend-selected" />
                        Επιλεγμένη στην κράτηση
                      </span>
                      <span className="seat-legend-item">
                        <i className="seat-legend-box seat-legend-taken" />
                        Δεσμευμένη
                      </span>
                    </div>

                    <div className="reservation-seat-grid">
                      {seatOptions.map((seat) => {
                        const isSelected = selectedSeatIds.includes(seat.seat_id);
                        const isTakenByAnother =
                          Number(seat.is_reserved) === 1 && !isSelected;

                        return (
                          <button
                            key={seat.seat_id}
                            type="button"
                            className={`reservation-seat-button ${
                              isSelected ? 'selected' : ''
                            } ${isTakenByAnother ? 'taken' : ''}`}
                            disabled={isTakenByAnother || savingEdit}
                            onClick={() => toggleSeatSelection(seat.seat_id)}
                          >
                            <strong>{seatMapLabel(seat)}</strong>
                            <span>{seatCategoryLabel(seat.category)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {!selectedSeatIds.length ? (
                  <div className="status-note">
                    Η κράτηση πρέπει να έχει τουλάχιστον μία θέση. Για πλήρη ακύρωση
                    χρησιμοποίησε την ενέργεια ακύρωσης κράτησης.
                  </div>
                ) : previewLoading ? (
                  <div className="reservation-selected-seats">
                    Υπολογισμός νέου συνόλου...
                  </div>
                ) : preview ? (
                  <>
                    <div className="reservation-selected-seats">
                      <strong>Επιλεγμένες θέσεις:</strong>{' '}
                      {preview.proposed.seats.map((seat) => seat.label).join(', ') || 'Καμία'}
                    </div>

                    <div className="reservation-edit-summary reservation-edit-pricing">
                      <div className="reservation-meta-chip">
                        <span>Τρέχον σύνολο</span>
                        <strong>{money(preview.current.totals.final_price)}</strong>
                      </div>
                      <div className="reservation-meta-chip">
                        <span>Νέο σύνολο</span>
                        <strong>{money(preview.proposed.totals.final_price)}</strong>
                      </div>
                      <div className="reservation-meta-chip">
                        <span>Διαφορά</span>
                        <strong>{money(preview.payment.amount_delta)}</strong>
                      </div>
                      <div className="reservation-meta-chip">
                        <span>Προς πληρωμή</span>
                        <strong>{money(preview.payment.amount_due)}</strong>
                      </div>
                    </div>

                    <div className="reservation-change-list">
                      <div className="reservation-change-card">
                        <span>Θέσεις που παραμένουν</span>
                        <strong>
                          {preview.changes.kept.map((seat) => seat.label).join(', ') || '—'}
                        </strong>
                      </div>
                      <div className="reservation-change-card">
                        <span>Νέες θέσεις</span>
                        <strong>
                          {preview.changes.added.map((seat) => seat.label).join(', ') || '—'}
                        </strong>
                      </div>
                      <div className="reservation-change-card">
                        <span>Θέσεις που ελευθερώνονται</span>
                        <strong>
                          {preview.changes.removed.map((seat) => seat.label).join(', ') || '—'}
                        </strong>
                      </div>
                    </div>

                    {preview.payment.requires_payment ? (
                      <PaymentForm
                        card={paymentCard}
                        setCard={setPaymentCard}
                        disabled={savingEdit}
                      />
                    ) : Number(preview.payment.amount_delta) < 0 ? (
                      <div className="status-note">
                        Η κράτηση θα ενημερωθεί με το νέο σύνολο χωρίς διαδικασία
                        επιστροφής χρημάτων.
                      </div>
                    ) : (
                      <div className="status-note">
                        Η αλλαγή δεν απαιτεί επιπλέον πληρωμή. Η κράτηση θα
                        ενημερωθεί άμεσα.
                      </div>
                    )}
                  </>
                ) : null}

                <div className="modal-footer">
                  <div className="button-row">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={closeEditModal}
                      disabled={savingEdit}
                    >
                      Κλείσιμο
                    </button>
                  </div>
                  <div className="button-row">
                    <button
                      type="button"
                      className="primary-button"
                      onClick={saveReservationEdit}
                      disabled={
                        loadingSeats ||
                        savingEdit ||
                        previewLoading ||
                        !preview ||
                        !selectedSeatIds.length
                      }
                    >
                      {savingEdit
                        ? 'Ολοκλήρωση...'
                        : preview?.payment?.requires_payment
                        ? 'Πληρωμή διαφοράς & αποθήκευση'
                        : 'Αποθήκευση αλλαγών'}
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
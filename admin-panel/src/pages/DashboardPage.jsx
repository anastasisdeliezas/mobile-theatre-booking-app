import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const defaultStats = {
  totals: {
    theatres: 0,
    shows: 0,
    showtimes: 0,
    reservations: 0,
    cancelledReservations: 0,
    pendingReservations: 0,
    revenue: 0,
    users: 0,
    activePromos: 0,
    unreadMessages: 0,
    seatCapacityPerShowtime: 0,
    soldSeats: 0,
    occupancyRate: 0
  },
  popularShows: [],
  recentReservations: [],
  upcomingShowtimes: [],
  statusBreakdown: [],
  monthlyActivity: [],
  topTheatres: []
};

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('el-GR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function formatMonth(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('el-GR', {
    month: 'short',
    year: '2-digit'
  });
}

function MetricCard({ title, value, helper, accent }) {
  return (
    <div className={`glass-card stat-card stat-card-${accent}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      <p className="stat-helper">{helper}</p>
    </div>
  );
}

function HealthCard({ label, value, tone = 'soft' }) {
  return (
    <div className={`mini-metric-card dashboard-health-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function VerticalBars({ items, valueKey, labelKey, valueFormatter }) {
  const max = Math.max(...items.map((item) => Number(item[valueKey] || 0)), 1);
  return (
    <div className="chart-vertical-grid">
      {items.map((item) => {
        const value = Number(item[valueKey] || 0);
        const height = Math.max(10, Math.round((value / max) * 100));
        return (
          <div className="chart-vertical-item" key={`${item[labelKey]}-${valueKey}`}>
            <div className="chart-vertical-value">{valueFormatter(value)}</div>
            <div className="chart-vertical-track">
              <div className="chart-vertical-bar" style={{ height: `${height}%` }} />
            </div>
            <div className="chart-vertical-label">{item[labelKey]}</div>
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBars({ items, labelKey, valueKey, valueFormatter, tone = 'primary' }) {
  const max = Math.max(...items.map((item) => Number(item[valueKey] || 0)), 1);
  return (
    <div className="chart-horizontal-list">
      {items.map((item) => {
        const value = Number(item[valueKey] || 0);
        const width = Math.max(4, Math.round((value / max) * 100));
        return (
          <div className="chart-horizontal-item" key={`${item[labelKey]}-${valueKey}`}>
            <div className="chart-horizontal-meta">
              <strong>{item[labelKey]}</strong>
              <span>{valueFormatter(value)}</span>
            </div>
            <div className="chart-horizontal-track">
              <div className={`chart-horizontal-bar ${tone}`} style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(defaultStats);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/admin/stats');
        setStats(data || defaultStats);
      } catch {
        setStats(defaultStats);
      }
    })();
  }, []);

  const utilisation = useMemo(() => Number(stats.totals.occupancyRate || 0), [stats]);

  const avgReservationsPerShow = useMemo(() => {
    return Math.round(stats.totals.reservations / Math.max(stats.totals.shows, 1));
  }, [stats]);

  const avgRevenuePerReservation = useMemo(() => {
    return stats.totals.reservations
      ? Number(stats.totals.revenue || 0) / Number(stats.totals.reservations || 1)
      : 0;
  }, [stats]);

  const demandLabel = useMemo(() => {
    if (utilisation >= 75) return 'Ισχυρή ζήτηση';
    if (utilisation >= 45) return 'Σταθερή πορεία';
    return 'Περιθώριο ανάπτυξης';
  }, [utilisation]);

  const summaryCards = [
    {
      title: 'Θέατρα',
      value: stats.totals.theatres,
      helper: 'Σύνολο καταχωρημένων χώρων',
      accent: 'indigo'
    },
    {
      title: 'Παραστάσεις',
      value: stats.totals.shows,
      helper: 'Ενεργές παραγωγές στο σύστημα',
      accent: 'emerald'
    },
    {
      title: 'Ημερομηνίες',
      value: stats.totals.showtimes,
      helper: 'Καταχωρημένες προβολές / παραστάσεις',
      accent: 'amber'
    },
    {
      title: 'Έσοδα',
      value: formatCurrency(stats.totals.revenue),
      helper: 'Επιβεβαιωμένες πωλήσεις εισιτηρίων',
      accent: 'rose'
    }
  ];

  const monthlyReservations = stats.monthlyActivity.map((item) => ({
    label: formatMonth(item.month_key),
    value: Number(item.reservations || 0)
  }));

  const monthlyRevenue = stats.monthlyActivity.map((item) => ({
    label: formatMonth(item.month_key),
    value: Number(item.revenue || 0)
  }));

  const statusItems = stats.statusBreakdown.map((item) => ({
    label:
      item.status === 'confirmed'
        ? 'Επιβεβαιωμένες'
        : item.status === 'cancelled'
          ? 'Ακυρωμένες'
          : item.status === 'pending'
            ? 'Σε αναμονή'
            : item.status,
    value: Number(item.total || 0)
  }));

  return (
    <div className="dashboard-stack">
      <section className="summary-strip">
        {summaryCards.map((item) => (
          <MetricCard key={item.title} {...item} />
        ))}
      </section>

      <section className="dashboard-hero-grid">
        <div className="surface-card dashboard-hero-card">
          <div className="section-head-inline">
            <div>
              <div className="kicker">Ζωντανή εικόνα λειτουργίας</div>
              <h3 className="section-heading">Κεντρικοί επιχειρησιακοί δείκτες</h3>
              <p className="section-subtitle">
                Όλα τα στοιχεία βασίζονται σε πραγματικές εγγραφές χρηστών, κρατήσεων,
                μηνυμάτων και πωλήσεων του συστήματος.
              </p>
            </div>
            <div className="muted-badge">Live data</div>
          </div>

          <div className="dashboard-health-grid">
            <HealthCard label="Πληρότητα θέσεων" value={`${utilisation}%`} tone={utilisation >= 60 ? 'good' : utilisation >= 35 ? 'warn' : 'soft'} />
            <HealthCard label="Κρατήσεις / παράσταση" value={avgReservationsPerShow} tone="soft" />
            <HealthCard label="Μέση αξία κράτησης" value={formatCurrency(avgRevenuePerReservation)} tone="good" />
          </div>

          <div className="dashboard-health-grid">
            <HealthCard label="Σύνολο χρηστών" value={stats.totals.users} tone="soft" />
            <HealthCard label="Νέα μηνύματα" value={stats.totals.unreadMessages} tone={stats.totals.unreadMessages ? 'warn' : 'soft'} />
            <HealthCard label="Ενεργά promo" value={stats.totals.activePromos} tone="soft" />
          </div>

          <div className="dashboard-progress-card">
            <div className="dashboard-progress-copy">
              <strong>Εμπορική ένδειξη περιόδου</strong>
              <span>
                Η τρέχουσα πληρότητα και ο όγκος κρατήσεων δείχνουν: <b>{demandLabel}</b>.
              </span>
            </div>
            <div className="dashboard-progress-bar">
              <div className="dashboard-progress-fill" style={{ width: `${utilisation}%` }} />
            </div>
          </div>
        </div>

        <div className="surface-card dashboard-side-card">
          <div className="section-head-inline">
            <div>
              <div className="kicker">Κατάσταση κρατήσεων</div>
              <h3 className="section-heading">Κατανομή ανά status</h3>
            </div>
          </div>

          {statusItems.length ? (
            <HorizontalBars
              items={statusItems}
              labelKey="label"
              valueKey="value"
              valueFormatter={(value) => `${value} κρατήσεις`}
              tone="info"
            />
          ) : (
            <div className="panel-item">
              <strong>Δεν υπάρχουν ακόμη κρατήσεις</strong>
              <span>Η κατανομή θα εμφανιστεί μόλις δημιουργηθούν κρατήσεις.</span>
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-panels dashboard-panels-wide">
        <div className="surface-card form-card">
          <div className="section-head-inline">
            <div>
              <div className="kicker">Κρατήσεις τελευταίων μηνών</div>
              <h3 className="section-heading">Ροή κρατήσεων</h3>
              <p className="section-subtitle">Εξέλιξη επιβεβαιωμένων κρατήσεων ανά μήνα.</p>
            </div>
          </div>

          {monthlyReservations.length ? (
            <VerticalBars
              items={monthlyReservations}
              labelKey="label"
              valueKey="value"
              valueFormatter={(value) => value}
            />
          ) : (
            <div className="panel-item">
              <strong>Δεν υπάρχουν αρκετά ιστορικά δεδομένα</strong>
              <span>Το γράφημα θα γεμίσει αυτόματα όσο καταχωρούνται κρατήσεις.</span>
            </div>
          )}
        </div>

        <div className="surface-card form-card">
          <div className="section-head-inline">
            <div>
              <div className="kicker">Έσοδα τελευταίων μηνών</div>
              <h3 className="section-heading">Πορεία εσόδων</h3>
              <p className="section-subtitle">Μηνιαία έσοδα από επιβεβαιωμένες κρατήσεις.</p>
            </div>
          </div>

          {monthlyRevenue.length ? (
            <VerticalBars
              items={monthlyRevenue}
              labelKey="label"
              valueKey="value"
              valueFormatter={(value) => `€${Math.round(value)}`}
            />
          ) : (
            <div className="panel-item">
              <strong>Δεν υπάρχουν στοιχεία εσόδων</strong>
              <span>Τα μηνιαία έσοδα εμφανίζονται μόλις ολοκληρωθούν πωλήσεις.</span>
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-panels dashboard-panels-wide">
        <div className="surface-card form-card">
          <div className="section-head-inline">
            <div>
              <div className="kicker">Θέατρα με καλύτερη απόδοση</div>
              <h3 className="section-heading">Κατάταξη χώρων</h3>
              <p className="section-subtitle">Τα θέατρα με τα περισσότερα έσοδα και κρατήσεις.</p>
            </div>
            <div className="muted-badge">{stats.topTheatres.length} χώροι</div>
          </div>

          {stats.topTheatres.length ? (
            <HorizontalBars
              items={stats.topTheatres.map((item) => ({
                label: item.name,
                value: Number(item.revenue || 0)
              }))}
              labelKey="label"
              valueKey="value"
              valueFormatter={(value) => formatCurrency(value)}
            />
          ) : (
            <div className="panel-item panel-item-spread">
              <div>
                <strong>Δεν υπάρχουν διαθέσιμα στοιχεία</strong>
                <span>Η απόδοση ανά θέατρο θα εμφανιστεί μόλις δημιουργηθούν πωλήσεις.</span>
              </div>
              <span className="status-pill muted">Χωρίς δεδομένα</span>
            </div>
          )}
        </div>

        <div className="surface-card form-card">
          <div className="section-head-inline">
            <div>
              <div className="kicker">Δημοφιλείς τίτλοι</div>
              <h3 className="section-heading">Παραστάσεις με τη μεγαλύτερη ζήτηση</h3>
              <p className="section-subtitle">Κατάταξη με βάση τις δεσμευμένες θέσεις.</p>
            </div>
            <div className="muted-badge">{stats.popularShows.length} τίτλοι</div>
          </div>

          <div className="panel-list">
            {stats.popularShows.length ? (
              stats.popularShows.map((item, index) => (
                <div key={`${item.title}-${index}`} className="panel-item panel-item-spread panel-rank-item">
                  <div>
                    <strong>{index + 1}. {item.title}</strong>
                    <span>{item.booked_seats} δεσμευμένες θέσεις</span>
                  </div>
                  <span className="status-pill success">Ζήτηση</span>
                </div>
              ))
            ) : (
              <div className="panel-item panel-item-spread">
                <div>
                  <strong>Δεν υπάρχουν ακόμη δεδομένα</strong>
                  <span>Μόλις αυξηθεί η δραστηριότητα κρατήσεων, θα εμφανιστούν εδώ οι τίτλοι με τη μεγαλύτερη ζήτηση.</span>
                </div>
                <span className="status-pill muted">Χωρίς δεδομένα</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="dashboard-panels dashboard-panels-wide">
        <div className="surface-card form-card">
          <div className="section-head-inline">
            <div>
              <div className="kicker">Πρόσφατη δραστηριότητα</div>
              <h3 className="section-heading">Τελευταίες κρατήσεις</h3>
              <p className="section-subtitle">Οι πιο πρόσφατες κινήσεις χρηστών στο σύστημα.</p>
            </div>
          </div>

          <div className="panel-list">
            {stats.recentReservations.length ? (
              stats.recentReservations.map((item) => (
                <div key={item.reservation_id} className="panel-item panel-item-spread">
                  <div>
                    <strong>{item.show_title || 'Κράτηση χωρίς τίτλο'}</strong>
                    <span>
                      {item.customer_name || item.customer_email || 'Άγνωστος χρήστης'} · {formatDateTime(item.created_at)}
                    </span>
                  </div>
                  <span className={`status-pill ${item.status === 'confirmed' ? 'success' : item.status === 'cancelled' ? 'muted' : 'info'}`}>
                    {item.status === 'confirmed' ? 'Επιβεβαιωμένη' : item.status === 'cancelled' ? 'Ακυρωμένη' : item.status === 'pending' ? 'Σε αναμονή' : item.status || 'Άγνωστη'}
                  </span>
                </div>
              ))
            ) : (
              <div className="panel-item panel-item-spread">
                <div>
                  <strong>Δεν υπάρχουν πρόσφατες κρατήσεις</strong>
                  <span>Οι νέες κρατήσεις θα εμφανίζονται εδώ.</span>
                </div>
                <span className="status-pill muted">Χωρίς κίνηση</span>
              </div>
            )}
          </div>
        </div>

        <div className="surface-card form-card">
          <div className="section-head-inline">
            <div>
              <div className="kicker">Επόμενες εμφανίσεις</div>
              <h3 className="section-heading">Προσεχείς ημερομηνίες</h3>
              <p className="section-subtitle">Οι αμέσως επόμενες παραστάσεις που βρίσκονται στο πρόγραμμα.</p>
            </div>
            <div className="muted-badge">{stats.upcomingShowtimes.length} εγγραφές</div>
          </div>

          <div className="panel-list">
            {stats.upcomingShowtimes.length ? (
              stats.upcomingShowtimes.map((item) => (
                <div key={item.showtime_id} className="panel-item panel-item-spread">
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.theatre_name} · {item.hall_name} · {formatDateTime(item.start_time)}</span>
                  </div>
                  <span className="status-pill info">
                    {item.booked_seats} θέσεις · €{Number(item.base_price || 0).toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <div className="panel-item panel-item-spread">
                <div>
                  <strong>Δεν υπάρχουν προσεχείς ημερομηνίες</strong>
                  <span>Οι νέες εγγραφές προγράμματος θα εμφανίζονται εδώ.</span>
                </div>
                <span className="status-pill muted">Κενό πρόγραμμα</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

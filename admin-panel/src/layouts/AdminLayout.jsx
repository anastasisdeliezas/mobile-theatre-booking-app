import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_ORIGIN =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `http://${window.location.hostname}:4000`
    : 'http://localhost:4000';

const navGroups = [
  {
    label: 'Επισκόπηση',
    items: [
      { to: '/', label: 'Dashboard', hint: 'Στατιστικά και λειτουργική εικόνα', icon: '◫' }
    ]
  },
  {
    label: 'Κατάλογος',
    items: [
      { to: '/theatres', label: 'Θέατρα', hint: 'Χώροι, τοποθεσίες και στοιχεία', icon: '⌂' },
      { to: '/shows', label: 'Παραστάσεις', hint: 'Παραγωγές, περιεχόμενο και media', icon: '▶' },
      { to: '/showtimes', label: 'Προβολές', hint: 'Αίθουσες, ώρες και τιμολόγηση', icon: '◷' }
    ]
  },
  {
    label: 'Λειτουργίες',
    items: [
      { to: '/reservations', label: 'Κρατήσεις', hint: 'Κρατήσεις, θέσεις και αποδείξεις', icon: '☰' },
      { to: '/users', label: 'Χρήστες', hint: 'Λογαριασμοί και δικαιώματα πρόσβασης', icon: '◉' },
      { to: '/messages', label: 'Μηνύματα', hint: 'Εισερχόμενη επικοινωνία και διαχείριση', icon: '✉' },
      { to: '/promos', label: 'Προσφορές', hint: 'Εκπτώσεις, καμπάνιες και κωδικοί', icon: '٪' },
      { to: '/newsletter', label: 'Newsletter', hint: 'Εγγραφές και λίστα παραληπτών', icon: '✦' }
    ]
  }
];

const pageMeta = {
  '/': {
    eyebrow: 'Κεντρικός πίνακας',
    title: 'Πίνακας ελέγχου λειτουργίας',
    description:
      'Παρακολούθησε θέατρα, παραστάσεις, προβολές, κρατήσεις και βασικούς δείκτες λειτουργίας από ένα ενιαίο περιβάλλον διαχείρισης.'
  },
  '/theatres': {
    eyebrow: 'Διαχείριση θεάτρων',
    title: 'Θέατρα & τοποθεσίες',
    description:
      'Οργάνωσε τους χώρους, τις πόλεις και την οπτική ταυτότητα κάθε θεάτρου.'
  },
  '/shows': {
    eyebrow: 'Διαχείριση παραστάσεων',
    title: 'Παραστάσεις & περιεχόμενο',
    description:
      'Διαχειρίσου τίτλους, poster, hero εικόνες, trailer links και βασικά στοιχεία κάθε παραγωγής.'
  },
  '/showtimes': {
    eyebrow: 'Προγραμματισμός',
    title: 'Προβολές & τιμολόγηση',
    description:
      'Ρύθμισε αίθουσες, ημερομηνίες, ώρες και βασικές τιμές από ένα καθαρό panel προγραμματισμού.'
  },
  '/reservations': {
    eyebrow: 'Διαχείριση κρατήσεων',
    title: 'Κρατήσεις & αποδείξεις',
    description:
      'Παρακολούθησε όλες τις κρατήσεις, αναζήτησε booking codes και εκτέλεσε βασικές ενέργειες διαχείρισης.'
  },
  '/users': {
    eyebrow: 'Διαχείριση χρηστών',
    title: 'Χρήστες & λογαριασμοί',
    description:
      'Δες όλους τους λογαριασμούς της πλατφόρμας, τους ρόλους τους και βασικά στοιχεία δραστηριριότητας.'
  },
  '/messages': {
    eyebrow: 'Εισερχόμενα',
    title: 'Μηνύματα & επικοινωνία',
    description:
      'Διαχειρίσου τα μηνύματα επικοινωνίας του οργανισμού και οργάνωσε την κατάστασή τους.'
  },
  '/promos': {
    eyebrow: 'Προσφορές',
    title: 'Κωδικοί προσφοράς & εκπτώσεις',
    description:
      'Δημιούργησε και διαχειρίσου κωδικούς έκπτωσης για περιόδους, συνεργασίες και ειδικές ενέργειες.'
  },
  '/newsletter': {
    eyebrow: 'Newsletter',
    title: 'Συνδρομητές newsletter',
    description:
      'Δες εγγραφές newsletter, διαχειρίσου κατάσταση συνδρομής και οργάνωσε τη λίστα παραληπτών.'
  }
};

function resolveAvatarUrl(value) {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('/')) return `${API_ORIGIN}${value}`;
  return `${API_ORIGIN}/${value}`;
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const meta = pageMeta[location.pathname] || pageMeta['/'];
  const avatarUrl = resolveAvatarUrl(user?.avatar_url);
  const initial = (user?.name || user?.email || 'A').slice(0, 1).toUpperCase();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand-block">
          <div className="brand-mark">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.name || 'Administrator'}
                className="brand-avatar"
              />
            ) : (
              <span>{initial}</span>
            )}
          </div>

          <div className="kicker">Del&apos;s Theatre admin</div>

          <h1>Πίνακας διαχείρισης θεάτρου</h1>

          <div className="user-pill">
            <span className="user-pill-email">
              {user?.email || 'Διαχειριστής'}
            </span>
          </div>
        </div>

        <div className="sidebar-group-stack">
          {navGroups.map((group) => (
            <div key={group.label} className="sidebar-group">
              <span className="sidebar-group-label">{group.label}</span>

              <nav className="sidebar-nav" aria-label={group.label}>
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    <div className="sidebar-link-main">
                      <span className="sidebar-link-icon">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    <small>{item.hint}</small>
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-footer-card">
            <span>Περιβάλλον</span>
            <strong>Κεντρική διαχείριση πλατφόρμας</strong>
            <p>
              Πρόσβαση σε εργαλεία ελέγχου περιεχομένου, κρατήσεων, χρηστών και
              καθημερινής λειτουργίας.
            </p>
          </div>

          <button className="logout-button" onClick={logout}>
            Αποσύνδεση
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <div className="admin-content-inner">
          <header className="topbar">
            <div>
              <div className="kicker">{meta.eyebrow}</div>
              <h2>{meta.title}</h2>
              <p>{meta.description}</p>
            </div>

            <div className="topbar-stack">
              <div className="topbar-chip success-chip">Σύνδεση διαχειριστή ενεργή</div>
              <div className="topbar-chip muted-chip">Del&apos;s Theatre · admin panel</div>
            </div>
          </header>

          <Outlet />
        </div>
      </main>
    </div>
  );
}
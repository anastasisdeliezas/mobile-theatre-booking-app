import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { normalizeEmail, sanitizeText, validateEmail } from '../utils/validation';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const safeEmail = useMemo(() => normalizeEmail(email), [email]);

  const submit = async (e) => {
    e.preventDefault();

    const nextErrors = {
      email: validateEmail(email),
      password: password ? '' : 'Ο κωδικός πρόσβασης είναι υποχρεωτικός.'
    };

    setFieldErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setError('Διόρθωσε τα πεδία που εμφανίζονται με κόκκινο και προσπάθησε ξανά.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await login(safeEmail, password);
      navigate('/');
    } catch {
      setError('Η σύνδεση απέτυχε. Έλεγξε τα στοιχεία διαχειριστή και προσπάθησε ξανά.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-shell admin-auth-shell">
      <div className="glass-card login-card admin-auth-card">
        <section className="login-side admin-auth-visual">
          <div className="kicker">Secure theatre administration</div>
          <h1>Del&apos;s Theatre Control Room</h1>
          <p>
            Ένα καθαρό, κινηματογραφικό και ασφαλές περιβάλλον για τη διαχείριση
            παραστάσεων, κρατήσεων, χρηστών, μηνυμάτων και προσφορών.
          </p>

          <div className="admin-auth-badges" aria-label="Χαρακτηριστικά ασφαλείας">
            <span>Sanitized inputs</span>
            <span>Validated email</span>
            <span>Protected API</span>
          </div>

          <div className="hero-metrics">
            <div className="hero-metric">
              <strong>Πρόσβαση διαχειριστή</strong>
              <span>Ελεγχόμενη είσοδος μόνο για εξουσιοδοτημένους λογαριασμούς.</span>
            </div>

            <div className="hero-metric">
              <strong>Ζωντανά δεδομένα</strong>
              <span>Σύνδεση με κρατήσεις, ημερολόγιο παραστάσεων και χρήστες.</span>
            </div>

            <div className="hero-metric">
              <strong>Κεντρικός έλεγχος</strong>
              <span>Περιεχόμενο, εισιτήρια, επικοινωνία και προσφορές από ένα σημείο.</span>
            </div>

            <div className="hero-metric">
              <strong>Καθαρή ροή</strong>
              <span>Γρήγορες ενέργειες δημιουργίας, ενημέρωσης και παρακολούθησης.</span>
            </div>
          </div>
        </section>

        <section className="login-form-wrap surface-card admin-auth-form-card">
          <div className="auth-mini-lock">🔐</div>
          <div className="kicker">Πρόσβαση διαχειριστή</div>
          <h2 className="section-heading">Σύνδεση</h2>
          <p className="section-subtitle">
            Συμπλήρωσε τα στοιχεία σου για είσοδο στο διοικητικό περιβάλλον.
          </p>

          <form className="app-form" onSubmit={submit} noValidate>
            <div className="form-field">
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                className={`form-input ${fieldErrors.email ? 'input-error' : ''}`}
                value={email}
                onChange={(e) => {
                  setEmail(sanitizeText(e.target.value, 180));
                  setFieldErrors((prev) => ({ ...prev, email: '' }));
                }}
                onBlur={() => setEmail(safeEmail)}
                placeholder="admin@theatreapp.com"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck="false"
                required
              />
              {fieldErrors.email ? <small className="field-error-text">{fieldErrors.email}</small> : null}
            </div>

            <div className="form-field">
              <label htmlFor="admin-password">Κωδικός πρόσβασης</label>
              <input
                id="admin-password"
                className={`form-input ${fieldErrors.password ? 'input-error' : ''}`}
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(String(e.target.value ?? '').slice(0, 100));
                  setFieldErrors((prev) => ({ ...prev, password: '' }));
                }}
                placeholder="Εισάγετε τον κωδικό σας"
                autoComplete="current-password"
                required
              />
              {fieldErrors.password ? <small className="field-error-text">{fieldErrors.password}</small> : null}
            </div>

            {error && <div className="error-banner">{error}</div>}

            <button type="submit" className="primary-button admin-auth-submit" disabled={submitting}>
              {submitting ? 'Έλεγχος στοιχείων...' : 'Σύνδεση στο σύστημα'}
            </button>

            <div className="auth-security-note">
              Τα στοιχεία ελέγχονται πριν σταλούν και το API απορρίπτει μη ασφαλείς τιμές.
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

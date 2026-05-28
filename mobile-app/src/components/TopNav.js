import React, { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { theme } from '../constants/theme';
import logo from '../assets/dels-cinema-logo.png';
import Card from './Card';
import Input from './Input';
import Button from './Button';
import { resolveMediaUrl } from '../utils/media';
import {
  isValidEmail,
  normalizeEmail,
  normalizeName,
  passwordStrength,
  sanitizeText,
  validateEmail,
  validateName,
  validatePassword
} from '../utils/validation';

const links = [
  { href: '/', label: 'Αρχική' },
  { href: '/movies', label: 'Παραστάσεις' },
  { href: '/theatres', label: 'Θέατρα' },
  { href: '/contact', label: 'Επικοινωνία' },
  { href: '/about', label: 'Ποιοι είμαστε' }
];

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: ''
};

function NavAvatar({ user, initials }) {
  const avatarUrl = resolveMediaUrl(user?.avatar_url);

  if (avatarUrl) {
    if (Platform.OS === 'web') {
      return (
        <img
          src={avatarUrl}
          alt="avatar"
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            objectFit: 'cover',
            border: '2px solid #A7D2FF',
            display: 'block'
          }}
        />
      );
    }

    return <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />;
  }

  return (
    <View style={styles.avatarButton}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

function AuthTab({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.authTab, active && styles.authTabActive]}
    >
      <Text style={[styles.authTabText, active && styles.authTabTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function InlineMessage({ text, type = 'error' }) {
  if (!text) return null;

  return (
    <View
      style={[
        styles.inlineMessage,
        type === 'success' ? styles.successBox : styles.errorBox
      ]}
    >
      <Text
        style={[
          styles.inlineMessageText,
          type === 'success' ? styles.successText : styles.errorText
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function SecurityPill({ text }) {
  return (
    <View style={styles.securityPill}>
      <Text style={styles.securityPillText}>{text}</Text>
    </View>
  );
}

function StrengthMeter({ value }) {
  const strength = passwordStrength(value);
  const bars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.strengthWrap}>
      <View style={styles.strengthBars}>
        {bars.map((bar) => (
          <View
            key={bar}
            style={[
              styles.strengthBar,
              strength.score >= bar && styles.strengthBarActive,
              strength.tone === 'success' && strength.score >= bar && styles.strengthBarSuccess,
              strength.tone === 'danger' && strength.score >= bar && styles.strengthBarDanger
            ]}
          />
        ))}
      </View>
      <Text
        style={[
          styles.strengthText,
          strength.tone === 'success' && styles.strengthTextSuccess,
          strength.tone === 'danger' && styles.strengthTextDanger
        ]}
      >
        {strength.label}
      </Text>
    </View>
  );
}

export default function TopNav() {
  const pathname = usePathname();
  const { user, login, register, logout } = useAuth();
  const { width } = useWindowDimensions();

  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] =
    useState(false);

  const isCompactNav = width < 920;
  const isVerySmall = width < 560;

  const initials = useMemo(
    () =>
      (user?.name || 'U')
        .split(' ')
        .map((v) => v[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    [user]
  );

  const firstNameLabel = user?.name?.split(' ')[0] || 'Λογαριασμός';

  const resetAuthState = () => {
    setError('');
    setSuccess('');
    setSubmitting(false);
    setFieldErrors({});
    setShowLoginPassword(false);
    setShowRegisterPassword(false);
    setShowRegisterConfirmPassword(false);
    setForm(emptyForm);
  };

  const openAuth = (nextMode = 'login') => {
    setMode(nextMode);
    resetAuthState();
    setAuthOpen(true);
  };

  const closeAuth = () => {
    setAuthOpen(false);
    resetAuthState();
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setSuccess('');
    setFieldErrors({});
    setShowLoginPassword(false);
    setShowRegisterPassword(false);
    setShowRegisterConfirmPassword(false);
    setForm((prev) => ({
      ...prev,
      password: '',
      confirmPassword: ''
    }));
  };

  const setField = (field, value) => {
    const cleaners = {
      firstName: (v) => normalizeName(v, 50),
      lastName: (v) => normalizeName(v, 50),
      email: (v) => sanitizeText(v, 190),
      password: (v) => String(v || '').slice(0, 100),
      confirmPassword: (v) => String(v || '').slice(0, 100)
    };

    setForm((prev) => ({ ...prev, [field]: cleaners[field]?.(value) ?? value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateAuthForm = () => {
    const nextErrors = {};
    const email = normalizeEmail(form.email);
    const password = String(form.password || '');
    const firstName = normalizeName(form.firstName, 50).trim();
    const lastName = normalizeName(form.lastName, 50).trim();
    const confirmPassword = String(form.confirmPassword || '');

    const emailError = validateEmail(email, 'email');
    if (emailError) nextErrors.email = emailError;

    if (!password) {
      nextErrors.password = 'Συμπλήρωσε τον κωδικό σου.';
    } else if (mode === 'register') {
      const passwordError = validatePassword(password, 'κωδικός');
      if (passwordError) nextErrors.password = passwordError;
    }

    if (mode === 'register') {
      const firstNameError = validateName(firstName, 'όνομα', 2);
      const lastNameError = validateName(lastName, 'επώνυμο', 2);
      if (firstNameError) nextErrors.firstName = firstNameError;
      if (lastNameError) nextErrors.lastName = lastNameError;
      if (!confirmPassword) nextErrors.confirmPassword = 'Επιβεβαίωσε τον κωδικό σου.';
      if (password && confirmPassword && password !== confirmPassword) {
        nextErrors.confirmPassword = 'Οι δύο κωδικοί δεν ταιριάζουν.';
      }
    }

    setFieldErrors(nextErrors);
    return Object.values(nextErrors)[0] || '';
  };

  const submitAuth = async () => {
    try {
      setError('');
      setSuccess('');

      const validationError = validateAuthForm();
      if (validationError) {
        setError(validationError);
        return;
      }

      setSubmitting(true);

      if (mode === 'login') {
        await login(normalizeEmail(form.email), form.password);
        setSuccess('Η σύνδεση ολοκληρώθηκε επιτυχώς.');
      } else {
        const fullName = `${normalizeName(form.firstName, 50).trim()} ${normalizeName(
          form.lastName,
          50
        ).trim()}`.trim();
        await register(fullName, normalizeEmail(form.email), form.password);
        setSuccess('Ο λογαριασμός δημιουργήθηκε επιτυχώς.');
      }

      setTimeout(() => {
        closeAuth();
      }, 450);
    } catch (e) {
      const apiMessage = e?.response?.data?.message;
      setError(
        apiMessage ||
          (mode === 'login'
            ? 'Η σύνδεση απέτυχε. Έλεγξε τα στοιχεία σου.'
            : 'Η εγγραφή απέτυχε. Δοκίμασε ξανά.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const profileTrigger = user ? (
    <View style={styles.profileArea}>
      <Pressable
        style={styles.profileButton}
        onPress={() => setMenuOpen((v) => !v)}
      >
        {!isCompactNav ? (
          <Text style={styles.profileLabel}>{firstNameLabel}</Text>
        ) : null}
        <NavAvatar user={user} initials={initials} />
      </Pressable>

      {menuOpen ? (
        <View style={styles.dropdownMenu}>
          <Pressable
            style={styles.dropdownItem}
            onPress={() => {
              setMenuOpen(false);
              router.push('/profile');
            }}
          >
            <Text style={styles.dropdownText}>Ο λογαριασμός μου</Text>
          </Pressable>

          <Pressable
            style={styles.dropdownItem}
            onPress={() => {
              setMenuOpen(false);
              router.push('/reservations');
            }}
          >
            <Text style={styles.dropdownText}>Οι κρατήσεις μου</Text>
          </Pressable>

          <Pressable
            style={styles.dropdownItem}
            onPress={async () => {
              setMenuOpen(false);
              await logout();
              router.replace('/');
            }}
          >
            <Text style={styles.dropdownDanger}>Αποσύνδεση</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  ) : (
    <Pressable style={styles.signInPill} onPress={() => openAuth('login')}>
      <Text style={styles.signInText}>
        {isCompactNav ? 'Σύνδεση' : 'Σύνδεση / Εγγραφή'}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.outer}>
      {isCompactNav ? (
        <View style={styles.mobileWrap}>
          <View style={styles.mobileTopRow}>
            <Pressable style={styles.mobileBrand} onPress={() => router.push('/')}>
              <Image source={logo} style={styles.logo} />
              <View style={styles.mobileBrandText}>
                <Text style={styles.brandTitle}>Del&apos;s Theatre</Text>
                <Text style={styles.brandSub}>Θέατρα & παραστάσεις</Text>
              </View>
            </Pressable>

            <View style={styles.mobileActions}>{profileTrigger}</View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mobileLinksRow}
          >
            {links.map((item) => {
              const active = pathname === item.href;
              return (
                <Pressable
                  key={item.href}
                  onPress={() => router.push(item.href)}
                  style={[styles.mobileLink, active && styles.activeLink]}
                >
                  <Text style={[styles.linkText, active && styles.activeLinkText]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.wrap}>
          <Pressable style={styles.brand} onPress={() => router.push('/')}>
            <Image source={logo} style={styles.logo} />
            <View>
              <Text style={styles.brandTitle}>Del&apos;s Theatre</Text>
              <Text style={styles.brandSub}>Θέατρα & παραστάσεις</Text>
            </View>
          </Pressable>

          <View style={styles.links}>
            {links.map((item) => {
              const active = pathname === item.href;
              return (
                <Pressable
                  key={item.href}
                  onPress={() => router.push(item.href)}
                  style={[styles.link, active && styles.activeLink]}
                >
                  <Text style={[styles.linkText, active && styles.activeLinkText]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actions}>{profileTrigger}</View>
        </View>
      )}

      <Modal
        transparent
        visible={authOpen}
        animationType="fade"
        onRequestClose={closeAuth}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeAuth}>
          <Pressable style={styles.authCardWrap} onPress={(e) => e.stopPropagation()}>
            <Card style={[styles.authCard, isVerySmall && styles.authCardSmall]}>
              <View style={styles.authGlowOne} />
              <View style={styles.authGlowTwo} />

              <View style={[styles.authGrid, isVerySmall && styles.authGridSmall]}>
                <View style={[styles.authVisual, isVerySmall && styles.authVisualSmall]}>
                  <Text style={styles.authKicker}>Del&apos;s Theatre</Text>
                  <Text style={[styles.authHeroTitle, isVerySmall && styles.authHeroTitleSmall]}>
                    {mode === 'login' ? 'Καλώς ήρθες πίσω' : 'Ξεκίνα την εμπειρία σου'}
                  </Text>
                  <Text style={styles.authHeroCopy}>
                    {mode === 'login'
                      ? 'Μπες στον λογαριασμό σου για κρατήσεις, ψηφιακά εισιτήρια και ιστορικό.'
                      : 'Φτιάξε λογαριασμό με ασφαλή στοιχεία και κράτησε θέσεις σε λίγα βήματα.'}
                  </Text>

                  <View style={styles.securityGrid}>
                    <SecurityPill text="Ασφαλές login" />
                    <SecurityPill text="Ισχυρός κωδικός" />
                    <SecurityPill text="Καθαρά δεδομένα" />
                  </View>
                </View>

                <View style={styles.authFormPanel}>
                  <View style={styles.authHeader}>
                    <View style={styles.authHeaderText}>
                      <Text style={styles.authTitle}>
                        {mode === 'login' ? 'Σύνδεση' : 'Εγγραφή'}
                      </Text>
                      <Text style={styles.authCopy}>
                        {mode === 'login'
                          ? 'Συμπλήρωσε email και κωδικό πρόσβασης.'
                          : 'Χρησιμοποίησε πραγματικό email και ισχυρό κωδικό.'}
                      </Text>
                    </View>

                    <Pressable onPress={closeAuth} style={styles.closeButton}>
                      <Text style={styles.closeButtonText}>✕</Text>
                    </Pressable>
                  </View>

                  <View style={styles.authTabs}>
                    <AuthTab
                      label="Σύνδεση"
                      active={mode === 'login'}
                      onPress={() => switchMode('login')}
                    />
                    <AuthTab
                      label="Εγγραφή"
                      active={mode === 'register'}
                      onPress={() => switchMode('register')}
                    />
                  </View>

                  <InlineMessage text={error} type="error" />
                  <InlineMessage text={success} type="success" />

                  <ScrollView
                    style={styles.authFieldsScroll}
                    contentContainerStyle={styles.authFields}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                  >
                    {mode === 'register' ? (
                      <View style={[styles.nameRow, isVerySmall && styles.nameRowStack]}>
                        <View style={styles.nameCol}>
                          <Input
                            label="Όνομα"
                            required
                            value={form.firstName}
                            onChangeText={(value) => setField('firstName', value)}
                            placeholder="π.χ. Αναστάσιος"
                            autoCapitalize="words"
                            maxLength={50}
                            helper="Μόνο γράμματα, χωρίς αριθμούς."
                            error={fieldErrors.firstName}
                          />
                        </View>

                        <View style={styles.nameCol}>
                          <Input
                            label="Επώνυμο"
                            required
                            value={form.lastName}
                            onChangeText={(value) => setField('lastName', value)}
                            placeholder="π.χ. Δελιέζας"
                            autoCapitalize="words"
                            maxLength={50}
                            helper="Μόνο γράμματα, χωρίς αριθμούς."
                            error={fieldErrors.lastName}
                          />
                        </View>
                      </View>
                    ) : null}

                    <Input
                      label="Email"
                      required
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      value={form.email}
                      onChangeText={(value) => setField('email', value)}
                      onBlur={() => {
                        if (form.email && !isValidEmail(form.email)) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            email: 'Συμπλήρωσε έγκυρο email.'
                          }));
                        }
                      }}
                      placeholder="you@example.com"
                      error={fieldErrors.email}
                    />

                    <Input
                      label="Κωδικός"
                      required
                      secureTextEntry={
                        mode === 'login' ? !showLoginPassword : !showRegisterPassword
                      }
                      value={form.password}
                      onChangeText={(value) => setField('password', value)}
                      placeholder={mode === 'login' ? 'Ο κωδικός σου' : 'Τουλάχιστον 8 χαρακτήρες'}
                      helper={
                        mode === 'register'
                          ? 'Χρειάζεται κεφαλαίο, μικρό γράμμα και αριθμό.'
                          : ''
                      }
                      error={fieldErrors.password}
                      trailing={
                        mode === 'login'
                          ? showLoginPassword
                            ? '🙈'
                            : '👁'
                          : showRegisterPassword
                            ? '🙈'
                            : '👁'
                      }
                      onTrailingPress={() =>
                        mode === 'login'
                          ? setShowLoginPassword((prev) => !prev)
                          : setShowRegisterPassword((prev) => !prev)
                      }
                    />

                    {mode === 'register' ? <StrengthMeter value={form.password} /> : null}

                    {mode === 'register' ? (
                      <Input
                        label="Επιβεβαίωση κωδικού"
                        required
                        secureTextEntry={!showRegisterConfirmPassword}
                        value={form.confirmPassword}
                        onChangeText={(value) => setField('confirmPassword', value)}
                        placeholder="Επανάλαβε τον κωδικό"
                        error={fieldErrors.confirmPassword}
                        trailing={showRegisterConfirmPassword ? '🙈' : '👁'}
                        onTrailingPress={() =>
                          setShowRegisterConfirmPassword((prev) => !prev)
                        }
                      />
                    ) : null}

                    <Button
                      title={
                        submitting
                          ? mode === 'login'
                            ? 'Σύνδεση...'
                            : 'Εγγραφή...'
                          : mode === 'login'
                            ? 'Σύνδεση'
                            : 'Δημιουργία λογαριασμού'
                      }
                      onPress={submitAuth}
                      loading={submitting}
                      disabled={submitting}
                      style={styles.authSubmitButton}
                    />

                    <Pressable
                      onPress={() =>
                        switchMode(mode === 'login' ? 'register' : 'login')
                      }
                      style={styles.switchTextWrap}
                    >
                      <Text style={styles.switchText}>
                        {mode === 'login'
                          ? 'Δεν έχεις λογαριασμό; Δημιούργησε τώρα'
                          : 'Έχεις ήδη λογαριασμό; Σύνδεση'}
                      </Text>
                    </Pressable>
                  </ScrollView>
                </View>
              </View>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'relative',
    zIndex: 9999,
    overflow: 'visible'
  },

  wrap: {
    marginBottom: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: 'rgba(7,15,28,0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    zIndex: 9999,
    overflow: 'visible',
    ...(Platform.OS === 'web'
      ? { position: 'sticky', top: 0, backdropFilter: 'blur(18px)' }
      : {})
  },

  mobileWrap: {
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: 'rgba(7,15,28,0.94)',
    gap: 12,
    zIndex: 9999,
    overflow: 'visible',
    ...(Platform.OS === 'web'
      ? { position: 'sticky', top: 0, backdropFilter: 'blur(18px)' }
      : {})
  },

  mobileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    zIndex: 10000
  },

  mobileBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0
  },

  mobileBrandText: {
    flex: 1,
    minWidth: 0
  },

  mobileActions: {
    marginLeft: 8,
    zIndex: 10001
  },

  mobileLinksRow: {
    paddingRight: 6,
    gap: 8
  },

  mobileLink: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.03)'
  },

  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 220
  },

  logo: {
    width: 46,
    height: 46,
    borderRadius: 14
  },

  brandTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '900'
  },

  brandSub: {
    color: theme.colors.muted,
    fontSize: 12
  },

  links: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap'
  },

  link: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999
  },

  activeLink: {
    backgroundColor: theme.colors.goldSoft
  },

  linkText: {
    color: theme.colors.muted,
    fontWeight: '700'
  },

  activeLinkText: {
    color: theme.colors.gold
  },

  actions: {
    minWidth: 170,
    alignItems: 'flex-end'
  },

  profileArea: {
    position: 'relative',
    zIndex: 10002
  },

  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },

  profileLabel: {
    color: theme.colors.text,
    fontWeight: '700',
    maxWidth: 88
  },

  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: theme.colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#A7D2FF'
  },

  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#A7D2FF'
  },

  avatarText: {
    color: theme.colors.darkText,
    fontWeight: '900',
    fontSize: 16
  },

  dropdownMenu: {
    position: 'absolute',
    top: 52,
    right: 0,
    width: 230,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.panelElevated,
    zIndex: 10003,
    elevation: 20,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0px 12px 24px rgba(0,0,0,0.28)'
        }
      : {
          shadowColor: '#000',
          shadowOpacity: 0.28,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 10 }
        })
  },

  dropdownItem: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)'
  },

  dropdownText: {
    color: theme.colors.text,
    fontWeight: '700'
  },

  dropdownDanger: {
    color: '#FFB4B4',
    fontWeight: '800'
  },

  signInPill: {
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(232,192,106,0.30)',
    backgroundColor: 'rgba(232,192,106,0.10)'
  },

  signInText: {
    color: theme.colors.text,
    fontWeight: '800'
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18
  },

  authCardWrap: {
    width: Platform.OS === 'web' ? 760 : '100%',
    maxWidth: '100%'
  },

  authCard: {
    width: '100%',
    minHeight: Platform.OS === 'web' ? 500 : undefined,
    borderRadius: 32,
    padding: 0,
    borderColor: 'rgba(232,192,106,0.22)',
    backgroundColor: 'rgba(6,13,27,0.98)'
  },

  authCardSmall: {
    borderRadius: 24
  },

  authGlowOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -70,
    top: -60,
    backgroundColor: 'rgba(232,192,106,0.12)'
  },

  authGlowTwo: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    left: -55,
    bottom: -70,
    backgroundColor: 'rgba(126,97,255,0.16)'
  },

  authGrid: {
    flexDirection: 'row',
    alignItems: 'stretch'
  },

  authGridSmall: {
    flexDirection: 'column'
  },

  authVisual: {
    flex: 0.92,
    padding: 26,
    justifyContent: 'space-between',
    minHeight: 500,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)'
  },

  authVisualSmall: {
    minHeight: 0,
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    gap: 12
  },

  authKicker: {
    color: theme.colors.gold,
    fontWeight: '900',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    fontSize: 12
  },

  authHeroTitle: {
    color: theme.colors.text,
    fontSize: 33,
    lineHeight: 39,
    fontWeight: '900',
    marginTop: 16,
    maxWidth: 270
  },

  authHeroTitleSmall: {
    fontSize: 24,
    lineHeight: 30,
    marginTop: 6,
    maxWidth: '100%'
  },

  authHeroCopy: {
    color: theme.colors.muted,
    lineHeight: 22,
    marginTop: 12,
    maxWidth: 300,
    fontSize: 13.5
  },

  securityGrid: {
    gap: 10,
    marginTop: 22
  },

  securityPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)'
  },

  securityPillText: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 12
  },

  authFormPanel: {
    flex: 1.08,
    padding: 22
  },

  authHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 14
  },

  authHeaderText: {
    flex: 1
  },

  authTitle: {
    color: theme.colors.text,
    fontSize: 25,
    fontWeight: '900',
    marginBottom: 6
  },

  authCopy: {
    color: theme.colors.muted,
    lineHeight: 20,
    fontSize: 13
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: theme.colors.line
  },

  closeButtonText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '900'
  },

  authTabs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    padding: 4,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },

  authTab: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },

  authTabActive: {
    backgroundColor: theme.colors.goldSoft,
    borderWidth: 1,
    borderColor: 'rgba(232,192,106,0.28)'
  },

  authTabText: {
    color: theme.colors.muted,
    fontWeight: '900',
    fontSize: 13
  },

  authTabTextActive: {
    color: theme.colors.gold
  },

  authFieldsScroll: {
    maxHeight: Platform.OS === 'web' ? 360 : undefined
  },

  authFields: {
    paddingBottom: 2
  },

  inlineMessage: {
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginBottom: 12
  },

  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.28)'
  },

  successBox: {
    backgroundColor: 'rgba(36,193,141,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(36,193,141,0.28)'
  },

  inlineMessageText: {
    fontWeight: '800',
    lineHeight: 19,
    fontSize: 12.5
  },

  errorText: {
    color: '#fecaca'
  },

  successText: {
    color: '#bbf7d0'
  },

  nameRow: {
    flexDirection: 'row',
    gap: 12
  },

  nameRowStack: {
    flexDirection: 'column',
    gap: 0
  },

  nameCol: {
    flex: 1
  },

  strengthWrap: {
    marginTop: -4,
    marginBottom: 12
  },

  strengthBars: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 6
  },

  strengthBar: {
    flex: 1,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.09)'
  },

  strengthBarActive: {
    backgroundColor: theme.colors.gold
  },

  strengthBarSuccess: {
    backgroundColor: theme.colors.success
  },

  strengthBarDanger: {
    backgroundColor: theme.colors.danger
  },

  strengthText: {
    color: theme.colors.muted,
    fontSize: 11.5,
    fontWeight: '800'
  },

  strengthTextSuccess: {
    color: '#bbf7d0'
  },

  strengthTextDanger: {
    color: '#fecaca'
  },

  authSubmitButton: {
    marginTop: 4
  },

  switchTextWrap: {
    marginTop: 10
  },

  switchText: {
    color: theme.colors.gold,
    fontWeight: '800',
    textAlign: 'center',
    fontSize: 13
  }
});

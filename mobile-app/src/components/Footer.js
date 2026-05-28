import React, { useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions
} from 'react-native';
import { router } from 'expo-router';
import api from '../api/client';
import { theme } from '../constants/theme';
import logo from '../assets/dels-cinema-logo.png';
import { normalizeEmail, sanitizeText, validateEmail } from '../utils/validation';

const navLinks = [
  { label: 'Αρχική', href: '/' },
  { label: 'Παραστάσεις', href: '/movies' },
  { label: 'Θέατρα', href: '/theatres' },
  { label: 'Ποιοι είμαστε', href: '/about' },
  { label: 'Επικοινωνία', href: '/contact' }
];

const serviceLinks = [
  { label: 'Αναζήτηση παραστάσεων', href: '/movies' },
  { label: 'Προβολές & διαθεσιμότητα', href: '/movies' },
  { label: 'Κράτηση θέσεων', href: '/movies' },
  { label: 'Ψηφιακά εισιτήρια', href: '/reservations' },
  { label: 'Ιστορικό κρατήσεων', href: '/reservations' }
];

const supportLinks = [
  { label: 'Φόρμα επικοινωνίας', href: '/contact' },
  { label: 'Υποστήριξη κρατήσεων', href: '/contact' },
  { label: 'Βοήθεια λογαριασμού', href: '/profile' },
  { label: 'Ενημέρωση αποδείξεων', href: '/reservations' }
];

const socialLinks = [
  { label: 'f', url: 'https://facebook.com', bg: '#1877F2' },
  { label: 'ig', url: 'https://instagram.com', bg: '#E1306C' },
  { label: 'yt', url: 'https://youtube.com', bg: '#FF0000' },
  { label: 'in', url: 'https://linkedin.com', bg: '#0A66C2' },
  { label: 'tt', url: 'https://tiktok.com', bg: '#111111' }
];

function BrandLogo() {
  return (
    <View style={styles.brandBadge}>
      <Image source={logo} style={styles.brandLogoImage} resizeMode="cover" />
    </View>
  );
}

function FooterLink({ label, href }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={() => router.push(href)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.linkPill,
        hovered && styles.linkPillHovered,
        pressed && styles.linkPillPressed
      ]}
    >
      <Text style={[styles.link, hovered && styles.linkHovered]}>{label}</Text>
    </Pressable>
  );
}

function FooterList({ title, items }) {
  return (
    <View style={styles.column}>
      <Text style={styles.heading}>{title}</Text>
      <View style={styles.columnItems}>
        {items.map((item) => (
          <FooterLink key={`${title}-${item.label}`} label={item.label} href={item.href} />
        ))}
      </View>
    </View>
  );
}

function ContactCard({ label, value }) {
  return (
    <View style={styles.contactCard}>
      <Text style={styles.contactLabel}>{label}</Text>
      <Text style={styles.contactValue}>{value}</Text>
    </View>
  );
}

function SocialButton({ item }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={() => Linking.openURL(item.url).catch(() => null)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.socialButton,
        { backgroundColor: item.bg },
        hovered && styles.socialButtonHovered,
        pressed && styles.socialButtonPressed
      ]}
    >
      <Text style={styles.socialText}>{item.label}</Text>
    </Pressable>
  );
}

export default function Footer() {
  const { width } = useWindowDimensions();
  const mobile = Platform.OS !== 'web';
  const contactStack = mobile || width < 900;

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState('');
  const [newsletterError, setNewsletterError] = useState('');
  const [submittingNewsletter, setSubmittingNewsletter] = useState(false);

  const submitNewsletter = async () => {
    const email = normalizeEmail(newsletterEmail);

    setNewsletterSuccess('');
    setNewsletterError('');

    const validationError = validateEmail(email, 'email');

    if (validationError) {
      setNewsletterError(validationError);
      return;
    }

    try {
      setSubmittingNewsletter(true);

      const { data } = await api.post('/newsletter/subscribe', {
        email,
        source: 'mobile_app'
      });

      setNewsletterSuccess(
        data?.message || 'Η εγγραφή στο newsletter ολοκληρώθηκε επιτυχώς.'
      );
      setNewsletterEmail('');
    } catch (error) {
      const message =
        error?.response?.data?.message || 'Η εγγραφή στο newsletter απέτυχε.';

      setNewsletterError(message);

      if (Platform.OS !== 'web') {
        Alert.alert('Newsletter', message);
      }
    } finally {
      setSubmittingNewsletter(false);
    }
  };

  return (
    <View style={[styles.wrap, mobile && styles.wrapMobile]}>
      <View style={styles.topSection}>
        <View style={styles.brandBlock}>
          <View style={styles.brandHeader}>
            <BrandLogo />

            <View style={styles.brandTextWrap}>
              <Text style={styles.brand}>Del’s Theatre</Text>
              <Text style={styles.tagline}>Θέατρα & παραστάσεις</Text>
            </View>
          </View>

          <Text style={styles.copy}>
            Σύγχρονη πλατφόρμα online κρατήσεων για θεατρικές παραστάσεις, με
            επιλογή θέσεων, ψηφιακό εισιτήριο, διαχείριση κρατήσεων και πρόσβαση
            στο ιστορικό του λογαριασμού σου.
          </Text>
        </View>

        <View style={[styles.columns, mobile && styles.columnsMobile]}>
          <FooterList title="Πλοήγηση" items={navLinks} />
          <FooterList title="Υπηρεσίες" items={serviceLinks} />
          <FooterList title="Υποστήριξη" items={supportLinks} />
        </View>
      </View>

      <View style={[styles.contactRow, contactStack && styles.contactRowStack]}>
        <ContactCard label="Επικοινωνία" value="support@delstheatre.gr" />
        <ContactCard label="Κέντρο εξυπηρέτησης" value="+30 210 000 0000" />
        <ContactCard label="Διαθεσιμότητα" value="Online κρατήσεις 24/7" />
      </View>

      <View style={styles.socialSection}>
        <Text style={styles.socialHeading}>Επικοινωνία</Text>
        <Text style={styles.socialInfo}>Τηλ: 210 000 0000</Text>
        <Text style={styles.socialInfo}>Email: support@delstheatre.gr</Text>

        <View style={styles.socialRow}>
          {socialLinks.map((item) => (
            <SocialButton key={item.label} item={item} />
          ))}
        </View>
      </View>

      <View style={styles.newsletterSection}>
        <Text style={styles.newsletterHeading}>Εγγραφή στο Newsletter</Text>
        <Text style={styles.newsletterCopy}>
          Μείνε ενημερωμένος για νέες παραστάσεις, προβολές και επιλεγμένες ανακοινώσεις.
        </Text>

        <View style={[styles.newsletterForm, mobile && styles.newsletterFormMobile]}>
          <TextInput
            value={newsletterEmail}
            onChangeText={(value) => {
              setNewsletterEmail(sanitizeText(value, 190));
              if (newsletterSuccess) setNewsletterSuccess('');
              if (newsletterError) setNewsletterError('');
            }}
            placeholder="Το email σας"
            placeholderTextColor="rgba(255,255,255,0.42)"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.newsletterInput}
          />

          <Pressable
            style={({ pressed }) => [
              styles.newsletterButton,
              pressed && styles.newsletterButtonPressed,
              submittingNewsletter && styles.newsletterButtonDisabled
            ]}
            onPress={submitNewsletter}
            disabled={submittingNewsletter}
          >
            <Text style={styles.newsletterButtonText}>
              {submittingNewsletter ? 'Αποστολή...' : 'Εγγραφή'}
            </Text>
          </Pressable>
        </View>

        {newsletterSuccess ? (
          <Text style={styles.newsletterSuccess}>{newsletterSuccess}</Text>
        ) : null}

        {newsletterError ? (
          <Text style={styles.newsletterError}>{newsletterError}</Text>
        ) : null}
      </View>

      <View style={[styles.bottomRow, mobile && styles.bottomRowMobile]}>
        <Text style={styles.bottom}>
          © 2026 Del’s Theatre · Όλα τα δικαιώματα διατηρούνται.
        </Text>
        <Text style={styles.bottom}>Online theatre booking platform</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 32,
    padding: 28,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: 'rgba(6,12,22,0.97)'
  },

  wrapMobile: {
    marginTop: 24,
    padding: 18,
    borderRadius: 22
  },

  topSection: {
    gap: 24
  },

  brandBlock: {
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line
  },

  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14
  },

  brandBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(232,192,106,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(232,192,106,0.30)'
  },

  brandLogoImage: {
    width: '100%',
    height: '100%'
  },

  brandTextWrap: {
    flex: 1,
    minWidth: 0
  },

  brand: {
    color: theme.colors.text,
    fontWeight: '900',
    fontSize: 28,
    marginBottom: 4
  },

  tagline: {
    color: theme.colors.gold,
    fontWeight: '800'
  },

  copy: {
    color: theme.colors.muted,
    lineHeight: 24,
    maxWidth: 760
  },

  columns: {
    flexDirection: 'row',
    gap: 28,
    flexWrap: 'wrap'
  },

  columnsMobile: {
    gap: 18
  },

  column: {
    flex: 1,
    minWidth: 180
  },

  heading: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 18,
    marginBottom: 14,
    textAlign: 'center'
  },

  columnItems: {
    gap: 8
  },

  linkPill: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'transparent'
  },

  linkPillHovered: {
    backgroundColor: 'rgba(232,192,106,0.10)',
    borderColor: 'rgba(232,192,106,0.18)'
  },

  linkPillPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }]
  },

  link: {
    color: theme.colors.muted,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'center'
  },

  linkHovered: {
    color: theme.colors.text
  },

 contactRow: {
  marginTop: 24,
  paddingTop: 20,
  borderTopWidth: 1,
  borderTopColor: theme.colors.line,
  flexDirection: 'row',
  justifyContent: 'center',
  gap: 14
},

contactRowStack: {
  flexDirection: 'column',
  alignItems: 'center'
},

contactCard: {
  flex: 1,
  minWidth: 0,
  width: '100%',
  maxWidth: 300,
  padding: 16,
  borderRadius: 18,
  backgroundColor: 'rgba(255,255,255,0.03)',
  borderWidth: 1,
  borderColor: theme.colors.line,
  alignItems: 'center'
},

contactLabel: {
  color: theme.colors.gold,
  fontWeight: '800',
  marginBottom: 8,
  textAlign: 'center'
},

contactValue: {
  color: theme.colors.text,
  fontWeight: '700',
  lineHeight: 22,
  flexShrink: 1,
  textAlign: 'center'
},

  socialSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
    alignItems: 'center'
  },

  socialHeading: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 12
  },

  socialInfo: {
    color: theme.colors.muted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 6,
    textAlign: 'center'
  },

  socialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 18
  },

  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)'
  },

  socialButtonHovered: {
    transform: [{ scale: 1.05 }]
  },

  socialButtonPressed: {
    opacity: 0.84
  },

  socialText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase'
  },

  newsletterSection: {
    marginTop: 28,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
    alignItems: 'center'
  },

  newsletterHeading: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 12,
    textAlign: 'center'
  },

  newsletterCopy: {
    color: theme.colors.muted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 760,
    marginBottom: 18
  },

  newsletterForm: {
    width: '100%',
    maxWidth: 620,
    alignItems: 'center',
    gap: 14
  },

  newsletterFormMobile: {
    maxWidth: '100%'
  },

  newsletterInput: {
    width: '100%',
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: theme.colors.line,
    color: theme.colors.text,
    fontSize: 16
  },

  newsletterButton: {
    minWidth: 160,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.gold,
    alignItems: 'center',
    justifyContent: 'center'
  },

  newsletterButtonPressed: {
    opacity: 0.88
  },

  newsletterButtonDisabled: {
    opacity: 0.7
  },

  newsletterButtonText: {
    color: theme.colors.darkText,
    fontWeight: '900',
    fontSize: 18
  },

  newsletterSuccess: {
    marginTop: 12,
    color: '#9BE7B1',
    fontWeight: '700',
    textAlign: 'center'
  },

  newsletterError: {
    marginTop: 12,
    color: '#FCA5A5',
    fontWeight: '700',
    textAlign: 'center'
  },

  bottomRow: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap'
  },

  bottomRowMobile: {
    gap: 8
  },

  bottom: {
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 20
  }
});
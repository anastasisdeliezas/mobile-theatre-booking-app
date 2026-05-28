import React, { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Screen from '../src/components/Screen';
import TopNav from '../src/components/TopNav';
import Footer from '../src/components/Footer';
import Card from '../src/components/Card';
import Input from '../src/components/Input';
import Button from '../src/components/Button';
import api from '../src/api/client';
import { theme } from '../src/constants/theme';
import {
  normalizeEmail,
  normalizeName,
  sanitizeText,
  validateEmail,
  validateMessage,
  validateName
} from '../src/utils/validation';

function FormBanner({ type = 'error', text }) {
  if (!text) return null;

  return (
    <View
      style={[
        styles.banner,
        type === 'success' ? styles.bannerSuccess : styles.bannerError
      ]}
    >
      <Text
        style={[
          styles.bannerText,
          type === 'success' ? styles.bannerSuccessText : styles.bannerErrorText
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const helpTopics = [
  {
    title: 'Κρατήσεις & εισιτήρια',
    copy: 'Ερωτήσεις για booking flow, διαθέσιμες θέσεις, αλλαγές ή ακυρώσεις κρατήσεων.'
  },
  {
    title: 'Λογαριασμός χρήστη',
    copy: 'Υποστήριξη για σύνδεση, προφίλ, ιστορικό κρατήσεων και βασικά στοιχεία λογαριασμού.'
  },
  {
    title: 'Παραστάσεις & προβολές',
    copy: 'Διευκρινίσεις για ώρες, θέατρα, αίθουσες, τιμές και διαθεσιμότητα προβολών.'
  }
];

export default function ContactPage() {
  const { width } = useWindowDimensions();

  const isPhone = width < 560;
  const isTablet = width >= 760;
  const isCompact = width < 980;

  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async () => {
    try {
      setError('');
      setSuccess('');

      const cleanName = normalizeName(form.name, 120).trim();
      const cleanEmail = normalizeEmail(form.email);
      const cleanSubject = sanitizeText(form.subject, 160);
      const cleanMessage = sanitizeText(form.message, 4000, { preserveNewLines: true });

      const validationError =
        validateName(cleanName, 'ονοματεπώνυμο') ||
        validateEmail(cleanEmail, 'email') ||
        validateMessage(cleanMessage, 'μήνυμα', 5, 4000);

      if (validationError) {
        setError(validationError);
        return;
      }

      setBusy(true);

      await api.post('/contact', {
        name: cleanName,
        email: cleanEmail,
        subject: cleanSubject,
        message: cleanMessage
      });

      setSuccess(
        'Το μήνυμά σου στάλθηκε επιτυχώς. Η ομάδα μας θα το διαχειριστεί το συντομότερο δυνατό.'
      );

      setForm({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      setError(
        error?.response?.data?.message || 'Η αποστολή του μηνύματος απέτυχε.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll contentStyle={[styles.page, isPhone && styles.pagePhone]}>
      <TopNav />

      <Card style={styles.heroCard}>
        <Text style={styles.kicker}>Επικοινωνία</Text>
        <Text style={[styles.heroTitle, isPhone && styles.heroTitleCompact]}>
          Επικοινώνησε με την ομάδα του Del&apos;s Theatre
        </Text>
        <Text style={styles.heroCopy}>
          Για απορίες σχετικά με κρατήσεις, λογαριασμό, παραστάσεις ή τεχνικά
          ζητήματα, μπορείς να μας στείλεις μήνυμα μέσα από τη φόρμα
          επικοινωνίας.
        </Text>
      </Card>

      <View style={[styles.grid, isCompact && styles.gridCompact]}>
        <View style={[styles.infoColumn, !isCompact && styles.infoColumnWide]}>
          <Card style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Πώς μπορούμε να βοηθήσουμε</Text>
            <Text style={styles.sectionCopy}>
              Τα αιτήματα επικοινωνίας καταγράφονται οργανωμένα ώστε η ομάδα να
              μπορεί να τα διαχειρίζεται σωστά και με σειρά προτεραιότητας.
            </Text>

            <View style={styles.topicList}>
              {helpTopics.map((item) => (
                <View key={item.title} style={styles.topicItem}>
                  <Text style={styles.topicTitle}>{item.title}</Text>
                  <Text style={styles.topicCopy}>{item.copy}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Card style={styles.metaCard}>
            <Text style={styles.metaLabel}>Κανάλι υποστήριξης</Text>
            <Text style={styles.metaValue}>
              Φόρμα επικοινωνίας Del&apos;s Theatre
            </Text>

            <Text style={styles.metaLabel}>Διαχείριση αιτημάτων</Text>
            <Text style={styles.metaValue}>
              Τα μηνύματα εμφανίζονται και οργανώνονται στο admin panel της πλατφόρμας.
            </Text>

            <Text style={styles.metaLabel}>Χρόνος απόκρισης</Text>
            <Text style={styles.metaValue}>
              Η ομάδα εξυπηρέτησης απαντά στα εισερχόμενα αιτήματα με σειρά προτεραιότητας.
            </Text>
          </Card>
        </View>

        <View style={[styles.formColumn, !isCompact && styles.formColumnWide]}>
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>Στείλε μας μήνυμα</Text>
            <Text style={styles.formCopy}>
              Συμπλήρωσε τα στοιχεία σου και περιέγραψε το αίτημά σου όσο πιο
              καθαρά γίνεται.
            </Text>

            <FormBanner type="error" text={error} />
            <FormBanner type="success" text={success} />

            <Input
              label="Ονοματεπώνυμο"
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: normalizeName(v, 120) })}
              required
              maxLength={120}
              helper="Μόνο γράμματα, χωρίς αριθμούς."
              placeholder="π.χ. Αναστάσιος"
            />

            <Input
              label="Email"
              value={form.email}
              onChangeText={(v) => setForm({ ...form, email: sanitizeText(v, 190) })}
              required
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
            />

            <Input
              label="Θέμα"
              value={form.subject}
              onChangeText={(v) => setForm({ ...form, subject: sanitizeText(v, 160) })}
              placeholder="π.χ. Ερώτηση για κράτηση"
            />

            <Input
              label="Μήνυμα"
              value={form.message}
              onChangeText={(v) => setForm({ ...form, message: sanitizeText(v, 4000, { preserveNewLines: true }) })}
              required
              multiline
              placeholder="Γράψε εδώ το μήνυμά σου..."
            />

            <Button
              title={busy ? 'Αποστολή...' : 'Αποστολή μηνύματος'}
              onPress={submit}
              loading={busy}
              disabled={busy}
            />
          </Card>
        </View>
      </View>

      <Footer />
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 34
  },

  pagePhone: {
    paddingHorizontal: 14
  },

  heroCard: {
    marginBottom: 18
  },

  kicker: {
    color: theme.colors.gold,
    fontWeight: '800',
    marginBottom: 8
  },

  heroTitle: {
    color: theme.colors.text,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900'
  },

  heroTitleCompact: {
    fontSize: 28,
    lineHeight: 34
  },

  heroCopy: {
    color: theme.colors.muted,
    lineHeight: 24,
    marginTop: 12,
    maxWidth: 760
  },

  grid: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start'
  },

  gridCompact: {
    flexDirection: 'column',
    alignItems: 'stretch'
  },

  infoColumn: {
    width: '100%',
    gap: 16
  },

  infoColumnWide: {
    flex: 0.95
  },

  formColumn: {
    width: '100%'
  },

  formColumnWide: {
    flex: 1.05
  },

  infoCard: {
    paddingVertical: 24
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 10
  },

  sectionCopy: {
    color: theme.colors.muted,
    lineHeight: 24,
    marginBottom: 18
  },

  topicList: {
    gap: 14
  },

  topicItem: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: 'rgba(255,255,255,0.03)'
  },

  topicTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8
  },

  topicCopy: {
    color: theme.colors.muted,
    lineHeight: 22
  },

  metaCard: {
    paddingVertical: 22
  },

  metaLabel: {
    color: theme.colors.gold,
    fontWeight: '800',
    marginBottom: 4,
    marginTop: 10
  },

  metaValue: {
    color: theme.colors.text,
    lineHeight: 22
  },

  formCard: {
    paddingVertical: 24
  },

  formTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8
  },

  formCopy: {
    color: theme.colors.muted,
    lineHeight: 22,
    marginBottom: 14
  },

  banner: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14
  },

  bannerError: {
    backgroundColor: 'rgba(239,68,68,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.28)'
  },

  bannerSuccess: {
    backgroundColor: 'rgba(36,193,141,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(36,193,141,0.28)'
  },

  bannerText: {
    fontWeight: '700',
    lineHeight: 20
  },

  bannerErrorText: {
    color: '#fecaca'
  },

  bannerSuccessText: {
    color: '#bbf7d0'
  }
});
import React, { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native';
import api from '../../src/api/client';
import Screen from '../../src/components/Screen';
import TopNav from '../../src/components/TopNav';
import Footer from '../../src/components/Footer';
import Card from '../../src/components/Card';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/constants/theme';
import {
  cleanPromoCode,
  normalizeEmail,
  normalizeName,
  normalizePhone,
  sanitizeText,
  validateEmail,
  validateName,
  validateOptionalPhone
} from '../../src/utils/validation';

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

function SummaryRow({ label, value }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function OptionButton({ label, active, onPress }) {
  return (
    <Button
      title={label}
      variant={active ? 'primary' : 'secondary'}
      onPress={onPress}
    />
  );
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const isPhone = width < 560;
  const isCompact = width < 980;
  const isStickySummary = Platform.OS === 'web' && !isCompact;

  const {
    showtimeId,
    showTitle,
    seatIds,
    seatLabels,
    total,
    reservationId
  } = useLocalSearchParams();

  const decodedTitle = decodeURIComponent(
    String(showTitle || 'Ολοκλήρωση κράτησης')
  );

  const parsedSeatIds = useMemo(() => {
    if (!seatIds) return [];
    return String(seatIds)
      .split(',')
      .map((v) => Number(v))
      .filter(Boolean);
  }, [seatIds]);

  const prettySeatLabels = useMemo(() => {
    if (!seatLabels) return '—';
    return decodeURIComponent(String(seatLabels)).split(',').join(', ');
  }, [seatLabels]);

  const isEditingReservation = Boolean(String(reservationId || '').trim());
  const baseTotal = Number(total || 0);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [promoCode, setPromoCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('counter');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [promoResult, setPromoResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        if (!user) {
          setLoadingProfile(false);
          return;
        }

        const { data } = await api.get('/auth/profile');
        const profile = data.user;

        setForm({
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || ''
        });
      } catch {
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, [user]);

  const discountAmount = Number(promoResult?.discount_amount || 0);
  const finalTotal = Number(
    promoResult?.final_price !== undefined ? promoResult.final_price : baseTotal
  );

  const applyPromo = async () => {
    try {
      setError('');
      setSuccess('');

      if (!user) {
        setError('Πρέπει να συνδεθείς πριν εφαρμόσεις κωδικό προσφοράς.');
        return;
      }

      const cleanCode = cleanPromoCode(promoCode);

      if (!cleanCode) {
        setError('Συμπλήρωσε έγκυρο κωδικό προσφοράς.');
        return;
      }

      setApplyingPromo(true);

      const { data } = await api.post('/promos/validate', {
        code: cleanCode,
        base_amount: baseTotal
      });

      setPromoResult(data);
      setPromoCode(data.promo.code);
      setSuccess(`Ο κωδικός "${data.promo.code}" εφαρμόστηκε επιτυχώς.`);
    } catch (error) {
      setPromoResult(null);
      setError(
        error?.response?.data?.message ||
          'Η εφαρμογή του κωδικού προσφοράς απέτυχε.'
      );
    } finally {
      setApplyingPromo(false);
    }
  };

  const clearPromo = () => {
    setPromoCode('');
    setPromoResult(null);
    setError('');
    setSuccess('');
  };

  const completeReservation = async () => {
    try {
      setError('');
      setSuccess('');

      if (!user) {
        setError('Πρέπει να συνδεθείς πριν ολοκληρώσεις την κράτηση.');
        return;
      }

      if (!parsedSeatIds.length) {
        setError('Δεν βρέθηκαν οι επιλεγμένες θέσεις.');
        return;
      }

      const cleanCustomer = {
        name: normalizeName(form.name, 100).trim(),
        email: normalizeEmail(form.email),
        phone: normalizePhone(form.phone)
      };

      const validationError =
        validateName(cleanCustomer.name, 'ονοματεπώνυμο') ||
        validateEmail(cleanCustomer.email, 'email') ||
        validateOptionalPhone(cleanCustomer.phone);

      if (validationError) {
        setError(validationError);
        return;
      }

      if (!acceptTerms) {
        setError('Πρέπει να αποδεχτείς τους όρους για να συνεχίσεις.');
        return;
      }

      if (isEditingReservation) {
        const { data: preview } = await api.post(
          `/reservations/${reservationId}/modification-preview`,
          {
            seat_ids: parsedSeatIds,
            promo_code: promoResult?.promo?.code || undefined,
            discount_amount: discountAmount,
            final_price: finalTotal
          }
        );

        if (paymentMethod === 'card_demo') {
          router.push(
            `/payment/${showtimeId}?showTitle=${encodeURIComponent(
              decodedTitle
            )}&seatIds=${encodeURIComponent(
              parsedSeatIds.join(',')
            )}&seatLabels=${encodeURIComponent(
              prettySeatLabels
            )}&total=${preview.proposed.totals.final_price}&baseTotal=${
              preview.current.totals.final_price
            }&promoCode=${encodeURIComponent(
              promoResult?.promo?.code || ''
            )}&discountAmount=${
              preview.proposed.totals.discount_amount || 0
            }&reservationId=${encodeURIComponent(
              reservationId
            )}&amountDue=${encodeURIComponent(
              preview.payment.amount_due
            )}&amountDelta=${encodeURIComponent(preview.payment.amount_delta)}`
          );
          return;
        }

        if (preview.payment.requires_payment) {
          setError(
            'Για την προσθήκη επιπλέον θέσεων απαιτείται πληρωμή με κάρτα. Επίλεξε πληρωμή με κάρτα για να συνεχίσεις.'
          );
          return;
        }

        setSubmitting(true);

        await api.post(`/reservations/${reservationId}/modification-confirm`, {
          seat_ids: parsedSeatIds,
          promo_code: promoResult?.promo?.code || undefined,
          discount_amount: discountAmount,
          final_price: finalTotal
        });

        setSuccess('Η κράτηση ενημερώθηκε επιτυχώς.');
        setTimeout(() => {
          router.replace('/reservations');
        }, 900);
        return;
      }

      if (paymentMethod === 'card_demo') {
        router.push(
          `/payment/${showtimeId}?showTitle=${encodeURIComponent(
            decodedTitle
          )}&seatIds=${encodeURIComponent(
            parsedSeatIds.join(',')
          )}&seatLabels=${encodeURIComponent(
            prettySeatLabels
          )}&total=${finalTotal}&baseTotal=${baseTotal}&promoCode=${encodeURIComponent(
            promoResult?.promo?.code || ''
          )}&discountAmount=${discountAmount}&name=${encodeURIComponent(
            cleanCustomer.name
          )}&email=${encodeURIComponent(cleanCustomer.email)}&phone=${encodeURIComponent(
            cleanCustomer.phone || ''
          )}`
        );
        return;
      }

      setSubmitting(true);

      const payload = {
        showtime_id: Number(showtimeId),
        seat_ids: parsedSeatIds,
        payment_method: 'counter',
        promo_code: promoResult?.promo?.code || undefined,
        discount_amount: discountAmount,
        final_price: finalTotal
      };

      const { data } = await api.post('/reservations', payload);

      setSuccess(
        `Η κράτηση ολοκληρώθηκε επιτυχώς. Κωδικός: ${data.booking_code}`
      );

      setTimeout(() => {
        router.replace('/reservations');
      }, 900);
    } catch (error) {
      setError(
        error?.response?.data?.message ||
          'Η ολοκλήρωση της κράτησης απέτυχε.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll contentStyle={[styles.page, isPhone && styles.pagePhone]}>
      <TopNav />

      <Card style={styles.heroCard}>
        <Text style={styles.kicker}>Κράτηση</Text>
        <Text style={[styles.title, isPhone && styles.titleCompact]}>
          {isEditingReservation ? 'Ενημέρωση κράτησης' : 'Ολοκλήρωση κράτησης'}
        </Text>
        <Text style={styles.copy}>
          Έλεγξε τα στοιχεία σου, τις θέσεις και τη σύνοψη της κράτησης πριν την
          ολοκλήρωση.
        </Text>
      </Card>

      <View style={[styles.grid, isCompact && styles.gridCompact]}>
        <View style={[styles.leftCol, !isCompact && styles.leftColWide]}>
          <Card>
            <Text style={styles.sectionTitle}>Στοιχεία πελάτη</Text>

            <FormBanner type="error" text={error} />
            <FormBanner type="success" text={success} />

            <Input
              label="Ονοματεπώνυμο"
              value={form.name}
              onChangeText={(name) => setForm((prev) => ({ ...prev, name: normalizeName(name, 100) }))}
              required
              maxLength={100}
              helper="Μόνο γράμματα, χωρίς αριθμούς."
            />

            <Input
              label="Email"
              value={form.email}
              onChangeText={(email) => setForm((prev) => ({ ...prev, email: sanitizeText(email, 190) }))}
              required
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Κινητό"
              value={form.phone}
              onChangeText={(phone) => setForm((prev) => ({ ...prev, phone: normalizePhone(phone) }))}
              keyboardType="number-pad"
              maxLength={10}
              placeholder="π.χ. 69xxxxxxxx"
            />

            <Input
              label="Κωδικός προσφοράς"
              value={promoCode}
              onChangeText={(value) => setPromoCode(cleanPromoCode(value))}
              autoCapitalize="characters"
              placeholder="π.χ. SUMMER20"
            />

            <View style={[styles.promoActions, !isPhone && styles.promoActionsRow]}>
              <View style={styles.flexItem}>
                <Button
                  title={applyingPromo ? 'Εφαρμογή...' : 'Εφαρμογή κωδικού'}
                  onPress={applyPromo}
                  disabled={applyingPromo || !promoCode.trim()}
                  style={styles.fullWidthButton}
                />
              </View>
              <View style={styles.flexItem}>
                <Button
                  title="Καθαρισμός"
                  variant="secondary"
                  onPress={clearPromo}
                  style={styles.fullWidthButton}
                />
              </View>
            </View>

            <Text style={styles.label}>Τρόπος πληρωμής</Text>
            <View style={styles.optionGroup}>
              <OptionButton
                label="Πληρωμή στο ταμείο"
                active={paymentMethod === 'counter'}
                onPress={() => setPaymentMethod('counter')}
              />
              <OptionButton
                label="Κάρτα"
                active={paymentMethod === 'card_demo'}
                onPress={() => setPaymentMethod('card_demo')}
              />
            </View>

            <Text style={styles.label}>Αποδοχή όρων</Text>
            <View style={styles.optionGroup}>
              <OptionButton
                label={
                  acceptTerms
                    ? 'Οι όροι έγιναν αποδεκτοί'
                    : 'Αποδέχομαι τους όρους κράτησης'
                }
                active={acceptTerms}
                onPress={() => setAcceptTerms((prev) => !prev)}
              />
            </View>
          </Card>
        </View>

        <View style={[styles.rightCol, !isCompact && styles.rightColWide]}>
          <Card
            style={[
              styles.summaryCard,
              isStickySummary ? styles.summaryCardSticky : styles.summaryCardStatic
            ]}
          >
            <Text style={styles.sectionTitle}>Σύνοψη κράτησης</Text>

            <SummaryRow label="Παράσταση" value={decodedTitle} />
            <SummaryRow label="Προβολή ID" value={`#${showtimeId}`} />
            <SummaryRow label="Θέσεις" value={prettySeatLabels} />
            <SummaryRow
              label="Πληρωμή"
              value={
                paymentMethod === 'counter' ? 'Πληρωμή στο ταμείο' : 'Κάρτα'
              }
            />
            <SummaryRow
              label="Κωδικός προσφοράς"
              value={
                promoResult?.promo?.code || promoCode.trim() || 'Χωρίς κωδικό'
              }
            />
            {promoResult ? (
              <SummaryRow
                label="Έκπτωση"
                value={`-€${discountAmount.toFixed(2)}`}
              />
            ) : null}

            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Αρχικό σύνολο</Text>
              <Text style={styles.baseTotalValue}>€{baseTotal.toFixed(2)}</Text>

              <Text style={styles.totalLabel}>Τελικό σύνολο</Text>
              <Text style={styles.totalValue}>€{finalTotal.toFixed(2)}</Text>
            </View>

            <View style={styles.summaryActions}>
              <Button
                title={
                  submitting
                    ? 'Ολοκλήρωση...'
                    : isEditingReservation
                      ? 'Αποθήκευση αλλαγών'
                      : 'Ολοκλήρωση κράτησης'
                }
                onPress={completeReservation}
                loading={submitting}
                disabled={submitting || loadingProfile}
              />

              <Button
                title="Πίσω στις θέσεις"
                variant="secondary"
                onPress={() => router.back()}
              />
            </View>
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

  title: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: '900'
  },

  titleCompact: {
    fontSize: 26,
    lineHeight: 32
  },

  copy: {
    color: theme.colors.muted,
    lineHeight: 23,
    marginTop: 10
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

  leftCol: {
    width: '100%'
  },

  leftColWide: {
    flex: 1.08
  },

  rightCol: {
    width: '100%'
  },

  rightColWide: {
    flex: 0.92
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 12
  },

  label: {
    color: theme.colors.text,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 10
  },

  optionGroup: {
    gap: 10,
    marginBottom: 12
  },

  promoActions: {
    gap: 10,
    marginBottom: 12
  },

  promoActionsRow: {
    flexDirection: 'row'
  },

  flexItem: {
    flex: 1
  },

  fullWidthButton: {
    width: '100%'
  },

  summaryCardSticky: {
    position: 'sticky',
    top: 92
  },

  summaryCardStatic: {
    position: 'relative',
    top: 0
  },

  summaryRow: {
    marginBottom: 12
  },

  summaryLabel: {
    color: theme.colors.muted,
    fontWeight: '700',
    marginBottom: 4
  },

  summaryValue: {
    color: theme.colors.text,
    fontWeight: '700'
  },

  totalBox: {
    marginTop: 10,
    marginBottom: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(232,192,106,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(232,192,106,0.22)'
  },

  totalLabel: {
    color: theme.colors.muted,
    fontWeight: '700',
    marginTop: 4
  },

  baseTotalValue: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 22,
    marginTop: 6
  },

  totalValue: {
    color: theme.colors.gold,
    fontWeight: '900',
    fontSize: 30,
    marginTop: 6
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
  },

  summaryActions: {
    gap: 10
  }
});
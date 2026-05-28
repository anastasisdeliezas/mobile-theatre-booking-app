import React, { useMemo, useState } from 'react';
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
import { luhnValid, normalizeName, sanitizeText, validateExpiry } from '../../src/utils/validation';

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

function maskCardNumber(value) {
  const digits = String(value || '')
    .replace(/\D/g, '')
    .slice(0, 16);
  const groups = digits.match(/.{1,4}/g) || [];
  return groups.join(' ');
}

function displayCardNumber(value) {
  const masked = maskCardNumber(value);
  if (!masked) return '#### #### #### ####';
  return masked + (masked.length < 19 ? ' #### #### #### ####'.slice(masked.length) : '');
}

function displayHolder(value) {
  if (!value?.trim()) return 'FULL NAME';
  return value.trim().toUpperCase();
}

function displayExpiry(value) {
  if (!value?.trim()) return 'MM/YY';
  return value.trim();
}

function formatExpiry(value) {
  const digits = String(value || '')
    .replace(/\D/g, '')
    .slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatCvv(value) {
  return String(value || '')
    .replace(/\D/g, '')
    .slice(0, 3);
}

export default function PaymentPage() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const isPhone = width < 560;
  const isCompact = width < 980;

  const {
    showtimeId,
    showTitle,
    seatIds,
    seatLabels,
    total,
    baseTotal,
    promoCode,
    discountAmount,
    reservationId,
    amountDue,
    amountDelta
  } = useLocalSearchParams();

  const parsedSeatIds = useMemo(() => {
    if (!seatIds) return [];
    return String(seatIds)
      .split(',')
      .map((v) => Number(v))
      .filter(Boolean);
  }, [seatIds]);

  const decodedTitle = decodeURIComponent(String(showTitle || 'Πληρωμή'));
  const prettySeatLabels = decodeURIComponent(String(seatLabels || '—'));
  const appliedPromoCode = decodeURIComponent(String(promoCode || ''));
  const isModification = Boolean(String(reservationId || '').trim());
  const finalTotal = Number(total || 0);
  const originalTotal = Number(baseTotal || total || 0);
  const promoDiscount = Number(discountAmount || 0);
  const modificationAmountDue = Number(amountDue || 0);
  const modificationAmountDelta = Number(amountDelta || 0);

  const [card, setCard] = useState({
    holder: '',
    number: '',
    expiry: '',
    cvv: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submitPayment = async () => {
    try {
      setError('');
      setSuccess('');

      if (!user) {
        setError('Πρέπει να συνδεθείς πριν ολοκληρώσεις την πληρωμή.');
        return;
      }

      const cleanHolder = normalizeName(card.holder, 80).trim().toUpperCase();
      const cleanNumber = maskCardNumber(card.number);
      const cleanExpiry = formatExpiry(card.expiry);
      const cleanCvv = formatCvv(card.cvv);

      if (!cleanHolder || !cleanNumber || !cleanExpiry || !cleanCvv) {
        setError('Συμπλήρωσε όλα τα στοιχεία της κάρτας.');
        return;
      }

      if (!/^[\p{L} ]{2,80}$/u.test(cleanHolder)) {
        setError('Το όνομα κατόχου πρέπει να περιέχει μόνο γράμματα, χωρίς αριθμούς ή σύμβολα.');
        return;
      }

      if (!parsedSeatIds.length) {
        setError('Δεν βρέθηκαν οι επιλεγμένες θέσεις.');
        return;
      }

      const cardDigits = cleanNumber.replace(/\D/g, '');
      const expiryError = validateExpiry(cleanExpiry);

      if (cardDigits.length !== 16) {
        setError('Ο αριθμός κάρτας πρέπει να έχει 16 ψηφία.');
        return;
      }

      if (!luhnValid(cardDigits)) {
        setError('Ο αριθμός κάρτας δεν είναι έγκυρος.');
        return;
      }

      if (expiryError) {
        setError(expiryError);
        return;
      }

      if (cleanCvv.length !== 3) {
        setError('Το CVV πρέπει να έχει 3 ψηφία.');
        return;
      }

      setSubmitting(true);

      const last4 = cardDigits.slice(-4);
      let data;

      if (isModification) {
        const response = await api.post(
          `/reservations/${reservationId}/modification-confirm`,
          {
            seat_ids: parsedSeatIds,
            payment_method: 'card_demo',
            card_last4: last4,
            promo_code: appliedPromoCode || undefined,
            discount_amount: promoDiscount,
            final_price: finalTotal
          }
        );

        data = response.data;

        setSuccess(
          modificationAmountDue > 0
            ? `Η χρέωση ολοκληρώθηκε επιτυχώς (${modificationAmountDue.toFixed(2)}€).`
            : 'Η κράτηση ενημερώθηκε επιτυχώς.'
        );
      } else {
        const response = await api.post('/reservations', {
          showtime_id: Number(showtimeId),
          seat_ids: parsedSeatIds,
          payment_method: 'card_demo',
          card_last4: last4,
          promo_code: appliedPromoCode || undefined,
          discount_amount: promoDiscount,
          final_price: finalTotal
        });

        data = response.data;
        setSuccess(
          `Η πληρωμή ολοκληρώθηκε επιτυχώς. Κωδικός κράτησης: ${data.booking_code}`
        );
      }

      setTimeout(() => {
        router.replace('/reservations');
      }, 900);
    } catch (error) {
      setError(error?.response?.data?.message || 'Η πληρωμή απέτυχε.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll contentStyle={[styles.page, isPhone && styles.pagePhone]}>
      <TopNav />

      <View style={[styles.heroWrap, isPhone && styles.heroWrapCompact]}>
        <Text style={styles.kicker}>
          {isModification
            ? "Del's Theatre · Ενημέρωση κράτησης"
            : "Del's Theatre · Ασφαλής πληρωμή"}
        </Text>
        <Text style={[styles.title, isPhone && styles.titleCompact]}>
          {isModification ? 'Χρέωση διαφοράς κράτησης' : 'Ολοκλήρωση πληρωμής'}
        </Text>
        <Text style={styles.copy}>
          Συμπλήρωσε τα στοιχεία της κάρτας σου για να ολοκληρωθεί η συναλλαγή με
          ασφάλεια.
        </Text>

        <View style={styles.pillRow}>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>Κρυπτογράφηση SSL</Text>
          </View>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>Ασφαλής ολοκλήρωση</Text>
          </View>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>Del&apos;s Theatre</Text>
          </View>
        </View>
      </View>

      <View style={[styles.grid, isCompact && styles.gridCompact]}>
        <Card style={styles.leftCard}>
          <Text style={styles.sectionTitle}>Σύνοψη παραγγελίας</Text>

          <View style={[styles.visualCard, isPhone && styles.visualCardCompact]}>
            <View style={styles.visualGlowA} />
            <View style={styles.visualGlowB} />

            <View style={styles.visualCardTop}>
              <View>
                <Text style={styles.visualBrand}>Del&apos;s Theatre</Text>
                <Text style={styles.visualSubBrand}>SECURE PAYMENT</Text>
              </View>
              <View style={styles.visualChip} />
            </View>

            <Text style={[styles.visualNumber, isPhone && styles.visualNumberCompact]}>
              {displayCardNumber(card.number)}
            </Text>

            <View style={styles.visualCardBottom}>
              <View style={styles.visualHolderBlock}>
                <Text style={styles.visualSmallLabel}>ΚΑΤΟΧΟΣ ΚΑΡΤΑΣ</Text>
                <Text numberOfLines={1} style={styles.visualMainValue}>
                  {displayHolder(card.holder)}
                </Text>
              </View>

              <View style={styles.visualExpiryWrap}>
                <Text style={styles.visualSmallLabel}>ΛΗΞΗ</Text>
                <Text style={styles.visualMainValue}>{displayExpiry(card.expiry)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.summaryBlock}>
            <Text style={styles.metaLabel}>Παράσταση</Text>
            <Text style={styles.metaValue}>{decodedTitle}</Text>

            <Text style={styles.metaLabel}>Θέσεις</Text>
            <Text style={styles.metaValue}>{prettySeatLabels || '—'}</Text>

            <Text style={styles.metaLabel}>Προβολή ID</Text>
            <Text style={styles.metaValue}>#{showtimeId}</Text>

            <Text style={styles.metaLabel}>Κωδικός προσφοράς</Text>
            <Text style={styles.metaValue}>
              {appliedPromoCode || 'Χωρίς κωδικό'}
            </Text>

            {isModification ? (
              <>
                <Text style={styles.metaLabel}>Τύπος αλλαγής</Text>
                <Text style={styles.metaValue}>
                  Ενημέρωση υπάρχουσας κράτησης
                </Text>
              </>
            ) : null}
          </View>

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Αρχικό σύνολο</Text>
            <Text style={styles.baseTotalValue}>€{originalTotal.toFixed(2)}</Text>

            {promoDiscount > 0 ? (
              <>
                <Text style={styles.totalLabel}>Έκπτωση</Text>
                <Text style={styles.discountValue}>-€{promoDiscount.toFixed(2)}</Text>
              </>
            ) : null}

            <Text style={styles.totalLabel}>
              {isModification ? 'Νέο σύνολο' : 'Τελικό σύνολο'}
            </Text>
            <Text style={styles.totalValue}>€{finalTotal.toFixed(2)}</Text>

            {isModification ? (
              <>
                <Text style={styles.totalLabel}>Διαφορά</Text>
                <Text style={styles.totalValue}>
                  €{modificationAmountDelta.toFixed(2)}
                </Text>
                <Text style={styles.totalLabel}>Προς πληρωμή</Text>
                <Text style={styles.totalValue}>
                  €{modificationAmountDue.toFixed(2)}
                </Text>
              </>
            ) : null}
          </View>
        </Card>

        <Card style={styles.rightCard}>
          <Text style={styles.sectionTitle}>Στοιχεία κάρτας</Text>
          <Text style={styles.sectionCopy}>
            Συμπλήρωσε τα απαραίτητα στοιχεία για την ολοκλήρωση της πληρωμής.
          </Text>

          <FormBanner type="error" text={error} />
          <FormBanner type="success" text={success} />

          <Input
            label="Όνομα κατόχου"
            value={card.holder}
            onChangeText={(holder) => setCard((prev) => ({ ...prev, holder: normalizeName(holder, 80).toUpperCase() }))}
            required
            maxLength={80}
            helper="Μόνο γράμματα, χωρίς αριθμούς ή σύμβολα."
            placeholder="π.χ. ANASTASIOS PAPADOPOULOS"
          />

          <Input
            label="Αριθμός κάρτας"
            value={card.number}
            onChangeText={(number) =>
              setCard((prev) => ({ ...prev, number: maskCardNumber(number) }))
            }
            keyboardType="number-pad"
            required
            placeholder="1234 5678 9012 3456"
          />

          <View style={[styles.row, isPhone && styles.rowCompact]}>
            <View style={styles.half}>
              <Input
                label="Ημερομηνία λήξης"
                value={card.expiry}
                onChangeText={(expiry) =>
                  setCard((prev) => ({ ...prev, expiry: formatExpiry(expiry) }))
                }
                keyboardType="number-pad"
                required
                placeholder="MM/YY"
              />
            </View>

            <View style={styles.half}>
              <Input
                label="CVV"
                value={card.cvv}
                onChangeText={(cvv) =>
                  setCard((prev) => ({ ...prev, cvv: formatCvv(cvv) }))
                }
                keyboardType="number-pad"
                secureTextEntry
                required
                placeholder="123"
              />
            </View>
          </View>

          <View style={styles.formActions}>
            <Button
              title={submitting ? 'Ολοκλήρωση...' : 'Ολοκλήρωση πληρωμής'}
              onPress={submitPayment}
              loading={submitting}
              disabled={submitting}
            />

            <Button
              title="Πίσω στην κράτηση"
              variant="secondary"
              onPress={() => router.back()}
            />
          </View>
        </Card>
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

  heroWrap: {
    marginBottom: 20,
    padding: 24,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: 'rgba(4,10,22,0.95)'
  },

  heroWrapCompact: {
    padding: 18,
    borderRadius: 24
  },

  kicker: {
    color: theme.colors.gold,
    fontWeight: '800',
    marginBottom: 8,
    fontSize: 15
  },

  title: {
    color: theme.colors.text,
    fontSize: 48,
    lineHeight: 54,
    fontWeight: '900'
  },

  titleCompact: {
    fontSize: 30,
    lineHeight: 36
  },

  copy: {
    color: theme.colors.muted,
    lineHeight: 24,
    marginTop: 10,
    maxWidth: 760,
    fontSize: 16
  },

  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 18
  },

  heroPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(232,192,106,0.28)',
    backgroundColor: 'rgba(255,255,255,0.03)'
  },

  heroPillText: {
    color: theme.colors.text,
    fontWeight: '700'
  },

  grid: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'stretch'
  },

  gridCompact: {
    flexDirection: 'column'
  },

  leftCard: {
    flex: 1.08,
    width: '100%'
  },

  rightCard: {
    flex: 0.92,
    width: '100%'
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 12
  },

  sectionCopy: {
    color: theme.colors.muted,
    lineHeight: 22,
    marginBottom: 14
  },

visualCard: {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 28,
  padding: 24,
  minHeight: 290,
  marginBottom: 22,
  justifyContent: 'space-between',
  backgroundColor: '#2a160c',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.10)',
  ...(Platform.OS === 'web'
    ? {
        boxShadow: '0px 14px 26px rgba(0,0,0,0.28)'
      }
    : {
        shadowColor: '#000',
        shadowOpacity: 0.28,
        shadowRadius: 26,
        shadowOffset: { width: 0, height: 12 },
        elevation: 8
      })
},

  visualCardCompact: {
    minHeight: 250,
    padding: 18,
    borderRadius: 22
  },

  visualGlowA: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(247,196,77,0.18)',
    top: -55,
    left: -70
  },

  visualGlowB: {
    position: 'absolute',
    width: 170,
    height: 120,
    borderRadius: 999,
    backgroundColor: 'rgba(255,170,64,0.10)',
    bottom: -35,
    right: -30
  },

  visualCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },

  visualBrand: {
    color: '#fff4d0',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.5
  },

  visualSubBrand: {
    color: 'rgba(255,244,208,0.76)',
    marginTop: 6,
    fontWeight: '700',
    letterSpacing: 2
  },

  visualChip: {
    width: 58,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#f2ca69',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)'
  },

  visualNumber: {
    color: '#fff8e8',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 4,
    marginTop: 18,
    marginBottom: 18
  },

  visualNumberCompact: {
    fontSize: 22,
    letterSpacing: 2.2
  },

  visualCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 6
  },

  visualHolderBlock: {
    flex: 1,
    paddingRight: 10
  },

  visualExpiryWrap: {
    alignItems: 'flex-end',
    minWidth: 90
  },

  visualSmallLabel: {
    color: 'rgba(255,244,208,0.72)',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 1.2
  },

  visualMainValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900'
  },

  summaryBlock: {
    marginBottom: 4
  },

  metaLabel: {
    color: theme.colors.muted,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4
  },

  metaValue: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 16
  },

  totalBox: {
    marginTop: 18,
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,214,107,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,214,107,0.26)'
  },

  totalLabel: {
    color: theme.colors.muted,
    fontWeight: '700'
  },

  baseTotalValue: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6
  },

  discountValue: {
    color: '#86efac',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 6
  },

  totalValue: {
    color: '#ffd66b',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 6
  },

  row: {
    flexDirection: 'row',
    gap: 12
  },

  rowCompact: {
    flexDirection: 'column'
  },

  half: {
    flex: 1
  },

  formActions: {
    gap: 10
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
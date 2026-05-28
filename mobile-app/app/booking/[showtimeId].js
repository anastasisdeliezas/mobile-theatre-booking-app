import React, { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native';
import api from '../../src/api/client';
import Button from '../../src/components/Button';
import Screen from '../../src/components/Screen';
import Card from '../../src/components/Card';
import TopNav from '../../src/components/TopNav';
import Footer from '../../src/components/Footer';
import { useAuth } from '../../src/context/AuthContext';
import { theme } from '../../src/constants/theme';

const prices = { VIP: 28, Economy: 16, Regular: 22 };

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

export default function BookingScreen() {
  const { showtimeId, showTitle, reservationId, selectedSeatIds = '' } =
    useLocalSearchParams();
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const isPhone = width < 680;
  const isCompact = width < 980;
  const isStickySummary = Platform.OS === 'web' && !isCompact;

  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const preselectedSeatIds = useMemo(
    () =>
      String(selectedSeatIds || '')
        .split(',')
        .map((value) => Number(value))
        .filter(Boolean),
    [selectedSeatIds]
  );

  const decodedTitle = decodeURIComponent(showTitle || 'Κράτηση εισιτηρίου');

  const rows = useMemo(() => {
    const grouped = {};
    seats.forEach((seat) => {
      grouped[seat.row_label] = grouped[seat.row_label] || [];
      grouped[seat.row_label].push(seat);
    });
    return grouped;
  }, [seats]);

  const selectedSeats = selected
    .map((id) => seats.find((seat) => seat.seat_id === id))
    .filter(Boolean);

  const estimatedTotal = selectedSeats.reduce(
    (sum, seat) => sum + (prices[seat.category] || 22),
    0
  );

  const availableSeats = seats.filter((seat) => !seat.is_reserved).length;

  const loadSeats = async () => {
    try {
      setLoadingSeats(true);
      setError('');

      const { data } = await api.get('/seats', { params: { showtimeId } });
      setSeats(data || []);

      if (preselectedSeatIds.length) {
        setSelected(preselectedSeatIds);
      }
    } catch (error) {
      setError(error?.response?.data?.message || 'Η φόρτωση θέσεων απέτυχε.');
      setSeats([]);
    } finally {
      setLoadingSeats(false);
    }
  };

  useEffect(() => {
    loadSeats();
  }, [showtimeId, selectedSeatIds]);

  const toggleSeat = (seat) => {
    if (seat.is_reserved) return;

    setError('');
    setSuccess('');

    setSelected((prev) =>
      prev.includes(seat.seat_id)
        ? prev.filter((id) => id !== seat.seat_id)
        : [...prev, seat.seat_id]
    );
  };

  const submit = async () => {
    setError('');
    setSuccess('');

    if (!user) {
      setError('Πρέπει να συνδεθείς πριν συνεχίσεις στο checkout.');
      return;
    }

    if (!selected.length) {
      setError('Επίλεξε τουλάχιστον μία θέση.');
      return;
    }

    const selectedSeatLabels = selectedSeats
      .map((seat) => `${seat.row_label}${seat.seat_number}`)
      .join(',');

    const selectedSeatIdsValue = selected.join(',');

    router.push(
      `/checkout/${showtimeId}?showTitle=${encodeURIComponent(
        decodedTitle
      )}&seatIds=${encodeURIComponent(
        selectedSeatIdsValue
      )}&seatLabels=${encodeURIComponent(
        selectedSeatLabels
      )}&total=${estimatedTotal}&reservationId=${
        reservationId ? encodeURIComponent(String(reservationId)) : ''
      }`
    );
  };

  return (
    <Screen scroll contentStyle={[styles.page, isPhone && styles.pagePhone]}>
      <TopNav />

      <Card style={styles.heroCard}>
        <Text style={styles.kicker}>
          {reservationId ? 'Τροποποίηση κράτησης' : 'Κράτηση θέσεων'}
        </Text>
        <Text style={[styles.title, isPhone && styles.titleCompact]}>
          {decodedTitle}
        </Text>
        <Text style={styles.copy}>
          Διάλεξε τις θέσεις σου και συνέχισε στο checkout για να ελέγξεις τα
          στοιχεία και να ολοκληρώσεις την κράτηση ή την αλλαγή της υπάρχουσας
          κράτησης.
        </Text>
      </Card>

      <View style={[styles.grid, isCompact && styles.gridCompact]}>
        <View style={[styles.leftCol, !isCompact && styles.leftColWide]}>
          <Card style={styles.legendCard}>
            <Text style={styles.screenLabel}>Οθόνη / Σκηνή</Text>
            <View style={styles.stage} />
            <View style={styles.legendRow}>
              <Legend label="Διαθέσιμη" color="#17333A" />
              <Legend label="Επιλεγμένη" color={theme.colors.gold} />
              <Legend label="Κρατημένη" color="#53262B" />
            </View>
          </Card>

          <Card>
            <FormBanner type="error" text={error} />
            <FormBanner type="success" text={success} />

            <View style={styles.seatsMetaRow}>
              <Text style={styles.seatsMetaText}>
                Διαθέσιμες θέσεις: {availableSeats}
              </Text>
              <Text style={styles.seatsMetaText}>
                Επιλεγμένες: {selectedSeats.length}
              </Text>
            </View>

            {loadingSeats ? (
              <Text style={styles.helperText}>Φόρτωση θέσεων...</Text>
            ) : seats.length ? (
              Object.entries(rows).map(([row, rowSeats]) => (
                <View key={row} style={styles.rowWrap}>
                  <Text style={styles.rowLabel}>{row}</Text>
                  <View style={styles.rowSeats}>
                    {rowSeats.map((seat) => {
                      const active = selected.includes(seat.seat_id);

                      return (
                        <Pressable
                          key={seat.seat_id}
                          onPress={() => toggleSeat(seat)}
                          style={[
                            styles.seat,
                            isPhone && styles.seatCompact,
                            seat.is_reserved && styles.reserved,
                            active && styles.selectedSeat
                          ]}
                        >
                          <Text
                            style={[
                              styles.seatText,
                              active && styles.selectedSeatText,
                              seat.is_reserved && styles.reservedText
                            ]}
                          >
                            {seat.seat_number}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.helperText}>
                Δεν υπάρχουν διαθέσιμες θέσεις για αυτή την παράσταση αυτή τη
                στιγμή.
              </Text>
            )}
          </Card>
        </View>

        <View style={[styles.rightCol, !isCompact && styles.rightColWide]}>
          <Card
            style={[
              styles.summaryCard,
              isStickySummary ? styles.summaryCardSticky : styles.summaryCardStatic
            ]}
          >
            <Text style={styles.summaryTitle}>Σύνοψη κράτησης</Text>

            <Text style={styles.detailLabel}>Παράσταση</Text>
            <Text style={styles.detailValue}>{decodedTitle}</Text>

            <Text style={styles.detailLabel}>Επιλεγμένες θέσεις</Text>
            <Text style={styles.detailValue}>
              {selectedSeats.length
                ? selectedSeats
                    .map((seat) => `${seat.row_label}${seat.seat_number}`)
                    .join(', ')
                : 'Δεν έχεις επιλέξει ακόμη θέσεις.'}
            </Text>

            <Text style={styles.detailLabel}>Εκτιμώμενο σύνολο</Text>
            <Text style={styles.totalValue}>€{estimatedTotal}</Text>

            <Text style={styles.summaryCopy}>
              Στο επόμενο βήμα θα ελέγξεις τα στοιχεία σου, το σύνολο και θα
              ολοκληρώσεις την κράτηση ή την αλλαγή της κράτησής σου από το
              checkout.
            </Text>

            {!user ? (
              <View style={styles.loginNote}>
                <Text style={styles.loginNoteText}>
                  Για να συνεχίσεις στο checkout πρέπει πρώτα να συνδεθείς.
                </Text>
              </View>
            ) : null}

            <View style={styles.summaryActions}>
              <Button
                title={
                  !user
                    ? 'Απαιτείται σύνδεση'
                    : reservationId
                      ? 'Συνέχεια στην αλλαγή κράτησης'
                      : 'Συνέχεια στο checkout'
                }
                onPress={submit}
                disabled={!selected.length || !user || loadingSeats}
              />

              <Button
                title="Πίσω στην παράσταση"
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

function Legend({ label, color }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
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
    flex: 1.15
  },

  rightCol: {
    width: '100%'
  },

  rightColWide: {
    flex: 0.85
  },

  legendCard: {
    marginBottom: 14
  },

  screenLabel: {
    textAlign: 'center',
    color: theme.colors.text,
    fontWeight: '800',
    marginBottom: 12
  },

  stage: {
    height: 16,
    borderRadius: 999,
    backgroundColor: theme.colors.gold,
    opacity: 0.85,
    marginBottom: 16
  },

  legendRow: {
    flexDirection: 'row',
    gap: 18,
    justifyContent: 'center',
    flexWrap: 'wrap'
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },

  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 999
  },

  legendText: {
    color: theme.colors.muted
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

  seatsMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 14
  },

  seatsMetaText: {
    color: theme.colors.muted,
    fontWeight: '700'
  },

  helperText: {
    color: theme.colors.muted,
    lineHeight: 22
  },

  rowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },

  rowLabel: {
    width: 22,
    color: theme.colors.gold,
    fontWeight: '900'
  },

  rowSeats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1
  },

  seat: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17333A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },

  seatCompact: {
    width: 36,
    height: 36,
    borderRadius: 12
  },

  seatText: {
    color: '#D7EEF4',
    fontWeight: '800'
  },

  selectedSeat: {
    backgroundColor: theme.colors.gold
  },

  selectedSeatText: {
    color: theme.colors.darkText
  },

  reserved: {
    backgroundColor: '#53262B'
  },

  reservedText: {
    color: '#F8C4C4'
  },

  summaryCardSticky: {
    position: 'sticky',
    top: 92
  },

  summaryCardStatic: {
    position: 'relative',
    top: 0
  },

  summaryTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 10
  },

  detailLabel: {
    color: theme.colors.muted,
    fontWeight: '700',
    marginTop: 10
  },

  detailValue: {
    color: theme.colors.text,
    fontWeight: '700',
    marginTop: 6
  },

  totalValue: {
    color: theme.colors.gold,
    fontSize: 32,
    fontWeight: '900',
    marginTop: 8
  },

  summaryCopy: {
    color: theme.colors.muted,
    lineHeight: 22,
    marginVertical: 14
  },

  loginNote: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(232,192,106,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232,192,106,0.28)',
    marginBottom: 14
  },

  loginNoteText: {
    color: theme.colors.gold,
    fontWeight: '700',
    lineHeight: 20
  },

  summaryActions: {
    gap: 10
  }
});
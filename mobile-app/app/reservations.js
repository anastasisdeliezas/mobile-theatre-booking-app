import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import api from '../src/api/client';
import Screen from '../src/components/Screen';
import TopNav from '../src/components/TopNav';
import Footer from '../src/components/Footer';
import Card from '../src/components/Card';
import Button from '../src/components/Button';
import { theme } from '../src/constants/theme';

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

function paymentMethodLabel(method) {
  if (method === 'card_demo') return 'Κάρτα';
  if (method === 'counter') return 'Πληρωμή στο ταμείο';
  return method || '—';
}

function maskCard(last4) {
  if (!last4) return '—';
  return `**** **** **** ${last4}`;
}

function money(value) {
  return `€${Number(value || 0).toFixed(2)}`;
}

function isFutureReservation(startTime) {
  return new Date(startTime) > new Date();
}

function resolveTicketStatusLabel(status) {
  if (status === 'cancelled') return 'Ακυρωμένο';
  if (status === 'used') return 'Χρησιμοποιημένο';
  return 'Έγκυρο';
}

function resolveTicketStatusStyle(status) {
  if (status === 'cancelled') return styles.cancelledBadge;
  if (status === 'used') return styles.usedBadge;
  return styles.activeBadge;
}

function getPublicAppUrl() {
  return (
    process.env.EXPO_PUBLIC_PUBLIC_APP_URL ||
    process.env.EXPO_PUBLIC_WEB_URL ||
    'http://localhost:8081'
  );
}

function buildTicketUrl(item) {
  const token = encodeURIComponent(item.ticket_token || item.booking_code || '');
  return `${getPublicAppUrl()}/ticket/verify?token=${token}`;
}

export default function ReservationsPage() {
  const { width } = useWindowDimensions();

  const isPhone = width < 560;
  const isTablet = width >= 760;
  const isDesktop = width >= 1180;
  const isCompact = width < 980;

  const qrSize = isPhone ? 98 : 116;

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');

      const { data } = await api.get('/reservations/user/reservations');
      setReservations(data || []);
    } catch (error) {
      setError(
        error?.response?.data?.message || 'Η φόρτωση των κρατήσεων απέτυχε.'
      );
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(
    () => ({
      total: reservations.length,
      active: reservations.filter((item) => item.status !== 'cancelled').length,
      cancelled: reservations.filter((item) => item.status === 'cancelled').length
    }),
    [reservations]
  );

  const cancel = async (id) => {
    try {
      setBusyId(id);
      setError('');
      setSuccess('');

      await api.patch(`/reservations/${id}/cancel`);
      setSuccess('Η κράτηση ακυρώθηκε επιτυχώς.');
      await load();
    } catch (error) {
      setError(error?.response?.data?.message || 'Η ακύρωση απέτυχε.');
    } finally {
      setBusyId(null);
    }
  };

  const resend = async (id) => {
    try {
      setBusyId(id);
      setError('');
      setSuccess('');

      const { data } = await api.post(`/reservations/${id}/resend-receipt`);
      setSuccess(data?.message || 'Η απόδειξη στάλθηκε ξανά επιτυχώς.');
    } catch (error) {
      setError(error?.response?.data?.message || 'Η επαναποστολή απέτυχε.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Screen scroll contentStyle={[styles.page, isPhone && styles.pagePhone]}>
      <TopNav />

      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.kicker}>Οι κρατήσεις μου</Text>
          <Text style={[styles.title, isPhone && styles.titleCompact]}>
            Ιστορικό κρατήσεων και εισιτηρίων
          </Text>
          <Text style={styles.copy}>
            Εδώ εμφανίζονται οι κρατήσεις σου, ο κωδικός κράτησης, το QR και οι
            διαθέσιμες ενέργειες διαχείρισης.
          </Text>
        </View>
      </View>

      <FormBanner type="error" text={error} />
      <FormBanner type="success" text={success} />

      <View style={styles.summaryWrap}>
        <Metric value={stats.total} label="Σύνολο" />
        <Metric value={stats.active} label="Ενεργές" />
        <Metric value={stats.cancelled} label="Ακυρωμένες" />
      </View>

      <View style={styles.listWrap}>
        {reservations.map((item) => {
          const isBusy = busyId === item.reservation_id;
          const canManage =
            item.status !== 'cancelled' && isFutureReservation(item.start_time);
          const ticketUrl = buildTicketUrl(item);
          const ticketStatus =
            item.ticket_status || (item.status === 'cancelled' ? 'cancelled' : 'valid');

          return (
            <Card key={item.reservation_id} style={styles.card}>
              <View style={[styles.ticketHeader, isPhone && styles.ticketHeaderStack]}>
                <View style={styles.ticketHeaderMain}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardMeta}>
                    {item.theatre_name} · {new Date(item.start_time).toLocaleString('el-GR')}
                  </Text>
                  <Text style={styles.cardMeta}>Θέσεις · {item.seats || '—'}</Text>
                </View>

                <Text style={[styles.statusBadge, resolveTicketStatusStyle(ticketStatus)]}>
                  {resolveTicketStatusLabel(ticketStatus)}
                </Text>
              </View>

              <View style={[styles.ticketBody, isCompact && styles.ticketBodyCompact]}>
                <View style={styles.ticketColumn}>
                  <Text style={styles.detailLabel}>Κωδικός κράτησης</Text>
                  <Text style={styles.codeValue}>{item.booking_code}</Text>

                  <Text style={styles.detailLabel}>Πληρωμή</Text>
                  <Text style={styles.detailValue}>
                    {paymentMethodLabel(item.payment_method)}
                  </Text>

                  <Text style={styles.detailLabel}>Κάρτα</Text>
                  <Text style={styles.detailValue}>
                    {maskCard(item.card_last4)}
                  </Text>

                  <Text style={styles.detailLabel}>Κωδικός προσφοράς</Text>
                  <Text style={styles.detailValue}>
                    {item.promo_code || 'Χωρίς κωδικό'}
                  </Text>

                  <Text style={styles.detailLabel}>Έκπτωση</Text>
                  <Text style={styles.detailValue}>
                    {money(item.discount_amount)}
                  </Text>

                  <Text style={styles.detailLabel}>Τελική τιμή</Text>
                  <Text style={styles.finalPriceValue}>
                    {money(item.final_price ?? item.calculated_base_total ?? item.base_price)}
                  </Text>

                  <Text style={styles.detailLabel}>Ticket URL</Text>
                  <Text numberOfLines={isPhone ? 3 : 2} style={styles.ticketUrlText}>
                    {ticketUrl}
                  </Text>
                </View>

                <View style={[styles.qrSection, isCompact && styles.qrSectionCompact]}>
                  <View style={styles.qrWrap}>
                    <QRCode
                      value={ticketUrl}
                      size={qrSize}
                      color="#0B1628"
                      backgroundColor="#FFFFFF"
                    />
                  </View>
                  <Text style={styles.qrHint}>
                    Σκάναρε για επαλήθευση εισιτηρίου
                  </Text>
                </View>
              </View>

              <View style={[styles.actionsRow, isCompact && styles.actionsRowCompact]}>
                <View style={[styles.actionItem, isDesktop && styles.actionItemDesktop]}>
                  <Button
                    title={isBusy ? 'Επεξεργασία...' : 'Επαναποστολή απόδειξης'}
                    onPress={() => resend(item.reservation_id)}
                    variant="dark"
                    disabled={isBusy}
                    style={styles.fullWidthButton}
                  />
                </View>

                <View style={[styles.actionItem, isDesktop && styles.actionItemDesktop]}>
                  <Button
                    title="Προβολή εισιτηρίου"
                    variant="secondary"
                    onPress={() =>
                      router.push(
                        `/ticket/verify?token=${encodeURIComponent(
                          item.ticket_token || item.booking_code
                        )}`
                      )
                    }
                    style={styles.fullWidthButton}
                  />
                </View>

                {canManage ? (
                  <View style={[styles.actionItem, isDesktop && styles.actionItemDesktop]}>
                    <Button
                      title="Αλλαγή θέσεων"
                      onPress={() =>
                        router.push(
                          `/booking/${item.showtime_id}?showTitle=${encodeURIComponent(
                            item.title
                          )}&reservationId=${item.reservation_id}&selectedSeatIds=${encodeURIComponent(
                            item.seat_ids || ''
                          )}`
                        )
                      }
                      variant="secondary"
                      disabled={isBusy}
                      style={styles.fullWidthButton}
                    />
                  </View>
                ) : null}

                {canManage ? (
                  <View style={[styles.actionItem, isDesktop && styles.actionItemDesktop]}>
                    <Button
                      title={isBusy ? 'Επεξεργασία...' : 'Ακύρωση'}
                      onPress={() => cancel(item.reservation_id)}
                      variant="secondary"
                      disabled={isBusy}
                      style={styles.fullWidthButton}
                    />
                  </View>
                ) : null}
              </View>
            </Card>
          );
        })}
      </View>

      {!loading && !reservations.length ? (
        <Card>
          <Text style={styles.emptyTitle}>Δεν υπάρχουν ακόμη κρατήσεις</Text>
          <Text style={styles.emptyText}>
            Μόλις ολοκληρώσεις μια κράτηση, εδώ θα εμφανιστούν τα στοιχεία και το
            εισιτήριό σου.
          </Text>
        </Card>
      ) : null}

      {loading ? (
        <Card>
          <Text style={styles.emptyText}>Φόρτωση κρατήσεων...</Text>
        </Card>
      ) : null}

      <Footer />
    </Screen>
  );
}

function Metric({ value, label }) {
  return (
    <Card style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Card>
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

  headerRow: {
    gap: 14,
    marginBottom: 16
  },

  headerTextWrap: {
    maxWidth: 860
  },

  kicker: {
    color: theme.colors.gold,
    fontWeight: '800',
    marginBottom: 8
  },

  title: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: '900'
  },

  titleCompact: {
    fontSize: 24,
    lineHeight: 30
  },

  copy: {
    color: theme.colors.muted,
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 720
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

  summaryWrap: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap'
  },

  metric: {
    flex: 1,
    minWidth: 150,
    alignItems: 'center'
  },

  metricValue: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '900'
  },

  metricLabel: {
    color: theme.colors.muted,
    marginTop: 8
  },

  listWrap: {
    gap: 16
  },

  card: {},

  ticketHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },

  ticketHeaderStack: {
    flexDirection: 'column'
  },

  ticketHeaderMain: {
    flex: 1
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.text
  },

  cardMeta: {
    marginTop: 6,
    color: theme.colors.muted
  },

  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    fontWeight: '800',
    overflow: 'hidden',
    textTransform: 'capitalize'
  },

  activeBadge: {
    backgroundColor: theme.colors.goldSoft,
    color: theme.colors.gold
  },

  usedBadge: {
    backgroundColor: 'rgba(59,130,246,0.18)',
    color: '#BFDBFE'
  },

  cancelledBadge: {
    backgroundColor: 'rgba(239,68,68,0.18)',
    color: '#FECACA'
  },

  ticketBody: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
  },

  ticketBodyCompact: {
    flexDirection: 'column',
    alignItems: 'stretch'
  },

  ticketColumn: {
    flex: 1,
    width: '100%'
  },

  detailLabel: {
    color: theme.colors.muted,
    fontWeight: '700',
    marginBottom: 6
  },

  detailValue: {
    color: theme.colors.text,
    fontWeight: '700',
    marginBottom: 12
  },

  codeValue: {
    color: theme.colors.gold,
    fontWeight: '900',
    fontSize: 18,
    marginBottom: 12
  },

  finalPriceValue: {
    color: theme.colors.gold,
    fontWeight: '900',
    fontSize: 22,
    marginBottom: 12
  },

  ticketUrlText: {
    color: theme.colors.muted,
    marginBottom: 12,
    lineHeight: 20
  },

  qrSection: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 170
  },

  qrSectionCompact: {
    minWidth: 0,
    width: '100%'
  },

  qrWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    alignSelf: 'center'
  },

  qrHint: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center'
  },

  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap'
  },

  actionsRowCompact: {
    flexDirection: 'column'
  },

  actionItem: {
    width: '100%'
  },

  actionItemDesktop: {
    flex: 1,
    minWidth: 220
  },

  fullWidthButton: {
    width: '100%'
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.text
  },

  emptyText: {
    marginTop: 8,
    color: theme.colors.muted,
    lineHeight: 22
  }
});
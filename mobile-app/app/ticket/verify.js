import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import api from '../../src/api/client';
import Screen from '../../src/components/Screen';
import TopNav from '../../src/components/TopNav';
import Footer from '../../src/components/Footer';
import Card from '../../src/components/Card';
import Button from '../../src/components/Button';
import { theme } from '../../src/constants/theme';

function formatDate(value) {
  try {
    return new Date(value).toLocaleString('el-GR', {
      dateStyle: 'full',
      timeStyle: 'short'
    });
  } catch {
    return value || '—';
  }
}

function statusStyles(state) {
  if (state === 'valid') {
    return {
      wrap: styles.validBadge,
      text: styles.validBadgeText
    };
  }

  if (state === 'used') {
    return {
      wrap: styles.usedBadge,
      text: styles.usedBadgeText
    };
  }

  if (state === 'cancelled') {
    return {
      wrap: styles.cancelledBadge,
      text: styles.cancelledBadgeText
    };
  }

  return {
    wrap: styles.notFoundBadge,
    text: styles.notFoundBadgeText
  };
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );
}

export default function TicketVerifyPage() {
  const { token } = useLocalSearchParams();
  const { width } = useWindowDimensions();

  const isPhone = width < 560;
  const isTablet = width >= 760;
  const isCompact = width < 900;

  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadTicket() {
      try {
        setLoading(true);
        setError('');

        const normalizedToken = String(token || '').trim();
        if (!normalizedToken) {
          throw new Error('Δεν δόθηκε token εισιτηρίου.');
        }

        const { data } = await api.get(
          `/reservations/ticket/verify/${encodeURIComponent(normalizedToken)}`
        );

        if (!active) return;
        setTicket(data || null);
      } catch (e) {
        if (!active) return;
        setError(
          e?.response?.data?.message ||
            e?.message ||
            'Δεν ήταν δυνατή η επαλήθευση του εισιτηρίου.'
        );
        setTicket(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTicket();

    return () => {
      active = false;
    };
  }, [token]);

  const badge = statusStyles(ticket?.ticket_state);

  return (
    <Screen scroll contentStyle={[styles.page, isPhone && styles.pagePhone]}>
      <TopNav />

      <View style={styles.header}>
        <Text style={styles.kicker}>Ticket verification</Text>
        <Text style={[styles.title, isPhone && styles.titleCompact]}>
          Επαλήθευση εισιτηρίου
        </Text>
        <Text style={styles.copy}>
          Η σελίδα αυτή εμφανίζει την πραγματική κατάσταση του εισιτηρίου μετά από
          σκανάρισμα του QR.
        </Text>
      </View>

      {loading ? (
        <Card style={styles.centerCard}>
          <ActivityIndicator size="large" color={theme.colors.gold} />
          <Text style={styles.loadingText}>Έλεγχος εισιτηρίου...</Text>
        </Card>
      ) : null}

      {!loading && error ? (
        <Card>
          <Text style={styles.errorTitle}>Αποτυχία επαλήθευσης</Text>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      ) : null}

      {!loading && ticket ? (
        <Card style={styles.ticketCard}>
          <View style={[styles.ticketTop, isCompact && styles.ticketTopCompact]}>
            <View style={styles.ticketTopMain}>
              <Text style={[styles.showTitle, isPhone && styles.showTitleCompact]}>
                {ticket?.reservation?.title || 'Εισιτήριο'}
              </Text>
              <Text style={styles.theatreText}>
                {ticket?.reservation?.theatre_name || '—'}
              </Text>
            </View>

            <View style={[styles.statusPill, badge.wrap]}>
              <Text style={[styles.statusPillText, badge.text]}>
                {ticket?.status_label || 'Άγνωστη κατάσταση'}
              </Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <InfoRow
              label="Κωδικός κράτησης"
              value={ticket?.reservation?.booking_code}
            />
            <InfoRow
              label="Ημερομηνία & ώρα"
              value={formatDate(ticket?.reservation?.start_time)}
            />
            <InfoRow label="Αίθουσα" value={ticket?.reservation?.hall_name} />
            <InfoRow
              label="Θέατρο / περιοχή"
              value={`${ticket?.reservation?.theatre_name || '—'} · ${ticket?.reservation?.location || '—'}`}
            />
            <InfoRow label="Θέσεις" value={ticket?.reservation?.seats} />
            <InfoRow
              label="Τιμή"
              value={`€${Number(ticket?.reservation?.final_price || 0).toFixed(2)}`}
            />
            {ticket?.reservation?.checked_in_at ? (
              <InfoRow
                label="Χρόνος χρήσης"
                value={formatDate(ticket?.reservation?.checked_in_at)}
              />
            ) : null}
          </View>

          <View style={styles.noticeBox}>
            <Text style={styles.noticeTitle}>Κατάσταση</Text>
            <Text style={styles.noticeText}>
              {ticket?.ticket_state === 'valid' &&
                'Το εισιτήριο είναι έγκυρο και μπορεί να χρησιμοποιηθεί για είσοδο.'}
              {ticket?.ticket_state === 'used' &&
                'Το εισιτήριο έχει ήδη χρησιμοποιηθεί.'}
              {ticket?.ticket_state === 'cancelled' &&
                'Το εισιτήριο έχει ακυρωθεί και δεν είναι πλέον ενεργό.'}
              {ticket?.ticket_state === 'not_found' &&
                'Το εισιτήριο δεν βρέθηκε στο σύστημα.'}
            </Text>
          </View>

          <View style={[styles.actionsRow, !isTablet && styles.actionsRowCompact]}>
            <Button
              title="Οι κρατήσεις μου"
              variant="secondary"
              onPress={() => router.push('/reservations')}
              style={styles.actionButton}
            />
            <Button
              title="Αρχική"
              onPress={() => router.push('/')}
              style={styles.actionButton}
            />
          </View>
        </Card>
      ) : null}

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

  header: {
    marginBottom: 16
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
    marginTop: 10,
    lineHeight: 22,
    maxWidth: 760
  },

  centerCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220
  },

  loadingText: {
    color: theme.colors.muted,
    marginTop: 14
  },

  ticketCard: {
    paddingVertical: 22
  },

  ticketTop: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },

  ticketTopCompact: {
    flexDirection: 'column'
  },

  ticketTopMain: {
    flex: 1
  },

  showTitle: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '900'
  },

  showTitleCompact: {
    fontSize: 24,
    lineHeight: 30
  },

  theatreText: {
    color: theme.colors.muted,
    marginTop: 8,
    fontSize: 16
  },

  statusPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    alignSelf: 'flex-start'
  },

  statusPillText: {
    fontWeight: '900'
  },

  validBadge: {
    backgroundColor: 'rgba(36,193,141,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(36,193,141,0.30)'
  },

  validBadgeText: {
    color: '#86efac'
  },

  usedBadge: {
    backgroundColor: 'rgba(59,130,246,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.30)'
  },

  usedBadgeText: {
    color: '#bfdbfe'
  },

  cancelledBadge: {
    backgroundColor: 'rgba(239,68,68,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.30)'
  },

  cancelledBadgeText: {
    color: '#fecaca'
  },

  notFoundBadge: {
    backgroundColor: 'rgba(148,163,184,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)'
  },

  notFoundBadgeText: {
    color: '#cbd5e1'
  },

  infoGrid: {
    gap: 12
  },

  infoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)'
  },

  infoLabel: {
    color: theme.colors.muted,
    fontWeight: '700',
    marginBottom: 6
  },

  infoValue: {
    color: theme.colors.text,
    fontWeight: '800',
    lineHeight: 22
  },

  noticeBox: {
    marginTop: 18,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: 'rgba(255,255,255,0.03)'
  },

  noticeTitle: {
    color: theme.colors.text,
    fontWeight: '900',
    marginBottom: 8,
    fontSize: 16
  },

  noticeText: {
    color: theme.colors.muted,
    lineHeight: 22
  },

  actionsRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 12
  },

  actionsRowCompact: {
    flexDirection: 'column'
  },

  actionButton: {
    flex: 1
  },

  errorTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 10
  },

  errorText: {
    color: '#fecaca',
    lineHeight: 22
  }
});
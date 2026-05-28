import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native';
import { router } from 'expo-router';
import api from '../src/api/client';
import Screen from '../src/components/Screen';
import TopNav from '../src/components/TopNav';
import Footer from '../src/components/Footer';
import Card from '../src/components/Card';
import Input from '../src/components/Input';
import Button from '../src/components/Button';
import { theme } from '../src/constants/theme';
import { sanitizeText } from '../src/utils/validation';
import { resolveMediaUrl } from '../src/utils/media';

const fallbackTheatre =
  'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1200&q=80';

export default function TheatresScreen() {
  const { width } = useWindowDimensions();

  const isPhone = width < 560;
  const isTablet = width >= 760;
  const isDesktop = width >= 1180;

  const columns = isDesktop ? 3 : isTablet ? 2 : 1;
  const ITEMS_PER_PAGE = isDesktop ? 6 : isTablet ? 4 : 4;

  const [theatres, setTheatres] = useState([]);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const [theatresRes, showsRes] = await Promise.all([
          api.get('/theatres'),
          api.get('/shows')
        ]);

        setTheatres(theatresRes.data || []);
        setShows(showsRes.data || []);
      } catch (e) {
        setError(
          e?.response?.data?.message ||
            'Δεν ήταν δυνατή η φόρτωση των θεάτρων.'
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, columns]);

  const showCountByTheatre = useMemo(() => {
    const map = new Map();

    shows.forEach((show) => {
      map.set(Number(show.theatre_id), (map.get(Number(show.theatre_id)) || 0) + 1);
    });

    return map;
  }, [shows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return theatres;

    return theatres.filter((item) =>
      [item.name, item.location, item.description].some((value) =>
        String(value || '').toLowerCase().includes(q)
      )
    );
  }, [query, theatres]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedTheatres = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;

    return filtered.slice(start, end);
  }, [filtered, safePage, ITEMS_PER_PAGE]);

  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, index) => index + 1),
    [totalPages]
  );

  const visibleStart = filtered.length
    ? (safePage - 1) * ITEMS_PER_PAGE + 1
    : 0;

  const visibleEnd = filtered.length
    ? Math.min(safePage * ITEMS_PER_PAGE, filtered.length)
    : 0;

  return (
    <Screen scroll contentStyle={[styles.page, isPhone && styles.pagePhone]}>
      <TopNav />

      <Card style={styles.hero}>
        <Text style={styles.kicker}>Θέατρα</Text>

        <Text style={[styles.title, isPhone && styles.titleCompact]}>
          Βρες τον χώρο που σε ενδιαφέρει και δες τι φιλοξενεί
        </Text>

        <Text style={styles.copy}>
          Περιηγήσου στα θέατρα της πλατφόρμας, ανακάλυψε την τοποθεσία και τον
          χαρακτήρα κάθε χώρου και συνέχισε στις παραστάσεις που παρουσιάζονται εκεί.
        </Text>

        <View style={styles.heroStats}>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{theatres.length}</Text>
            <Text style={styles.statLabel}>Θέατρα</Text>
          </View>

          <View style={styles.statPill}>
            <Text style={styles.statValue}>{shows.length}</Text>
            <Text style={styles.statLabel}>Παραστάσεις</Text>
          </View>

          <View style={styles.statPill}>
            <Text style={styles.statValue}>{filtered.length}</Text>
            <Text style={styles.statLabel}>Αποτελέσματα</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.searchCard}>
        <Input
          label="Αναζήτηση θεάτρου ή τοποθεσίας"
          value={query}
          onChangeText={(value) => setQuery(sanitizeText(value, 80))}
          placeholder="π.χ. Αθήνα ή Θέατρο Παλλάς"
        />

        <View style={[styles.searchMetaRow, isPhone && styles.searchMetaRowStack]}>
          <Text style={styles.searchMetaText}>
            {visibleStart}-{visibleEnd} από {filtered.length}
          </Text>

          {query.trim() ? (
            <Button
              title="Καθαρισμός"
              variant="secondary"
              onPress={() => setQuery('')}
              style={isPhone ? styles.fullWidthButton : null}
            />
          ) : null}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Card>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.colors.gold}
          style={styles.loader}
        />
      ) : null}

      {!loading && paginatedTheatres.length ? (
        <View style={styles.grid}>
          {paginatedTheatres.map((item) => (
            <View
              key={item.theatre_id}
              style={[
                styles.gridItem,
                columns === 1
                  ? styles.gridItemSingle
                  : columns === 2
                    ? styles.gridItemDouble
                    : styles.gridItemTriple
              ]}
            >
              <Card style={styles.theatreCard}>
                <Image
                  source={{
                    uri: resolveMediaUrl(item.avatar_url, fallbackTheatre)
                  }}
                  style={[styles.theatreImage, isPhone && styles.theatreImagePhone]}
                />

                <View style={[styles.theatreBody, isPhone && styles.theatreBodyPhone]}>
                  <Text style={styles.location}>{item.location || 'Θέατρο'}</Text>

                  <Text style={styles.cardTitle}>{item.name}</Text>

                  <Text style={styles.description} numberOfLines={isPhone ? 4 : 3}>
                    {item.description ||
                      'Θεατρικός χώρος με σύγχρονη εμπειρία παρακολούθησης και οργανωμένη παρουσίαση παραστάσεων.'}
                  </Text>

                  <View style={styles.infoRow}>
                    <View style={styles.infoChip}>
                      <Text style={styles.infoChipText}>
                        {showCountByTheatre.get(Number(item.theatre_id)) || 0} παραστάσεις
                      </Text>
                    </View>

                    <View style={styles.infoChip}>
                      <Text style={styles.infoChipText}>{item.location || '—'}</Text>
                    </View>
                  </View>

                  <View style={styles.actionRow}>
                    <Button
                      title="Προβολή θεάτρου"
                      onPress={() => router.push(`/theatre/${item.theatre_id}`)}
                    />

                    <View style={styles.buttonGap} />

                    <Button
                      title="Παραστάσεις χώρου"
                      variant="secondary"
                      onPress={() =>
                        router.push(`/movies?theatreId=${item.theatre_id}`)
                      }
                    />
                  </View>
                </View>
              </Card>
            </View>
          ))}
        </View>
      ) : null}

      {!loading && filtered.length > ITEMS_PER_PAGE ? (
        <View style={styles.paginationWrap}>
          <Text style={styles.paginationMeta}>
            Σελίδα {safePage} από {totalPages}
          </Text>

          <View style={styles.paginationControls}>
            <Pressable
              onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safePage === 1}
              style={[
                styles.paginationNavButton,
                isPhone && styles.paginationNavButtonCompact,
                safePage === 1 && styles.paginationNavButtonDisabled
              ]}
            >
              <Text
                style={[
                  styles.paginationNavText,
                  isPhone && styles.paginationNavTextCompact,
                  safePage === 1 && styles.paginationNavTextDisabled
                ]}
              >
                Προηγούμενη
              </Text>
            </Pressable>

            <View style={styles.pageNumbersWrap}>
              {pageNumbers.map((page) => {
                const active = page === safePage;

                return (
                  <Pressable
                    key={page}
                    onPress={() => setCurrentPage(page)}
                    style={[
                      styles.pageNumberButton,
                      isPhone && styles.pageNumberButtonCompact,
                      active && styles.pageNumberButtonActive
                    ]}
                  >
                    <Text
                      style={[
                        styles.pageNumberText,
                        isPhone && styles.pageNumberTextCompact,
                        active && styles.pageNumberTextActive
                      ]}
                    >
                      {page}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={safePage === totalPages}
              style={[
                styles.paginationNavButton,
                isPhone && styles.paginationNavButtonCompact,
                safePage === totalPages && styles.paginationNavButtonDisabled
              ]}
            >
              <Text
                style={[
                  styles.paginationNavText,
                  isPhone && styles.paginationNavTextCompact,
                  safePage === totalPages && styles.paginationNavTextDisabled
                ]}
              >
                Επόμενη
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {!loading && !filtered.length ? (
        <Card>
          <Text style={styles.cardTitle}>Δεν βρέθηκαν θέατρα</Text>
          <Text style={styles.description}>
            Δοκίμασε άλλο όνομα ή διαφορετική τοποθεσία.
          </Text>
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

  hero: {
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
    fontWeight: '900',
    lineHeight: 38
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

  heroStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18
  },

  statPill: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: theme.colors.line,
    minWidth: 102
  },

  statValue: {
    color: theme.colors.text,
    fontWeight: '900',
    fontSize: 15,
    marginBottom: 2
  },

  statLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '700'
  },

  searchCard: {
    marginBottom: 14
  },

  searchMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap'
  },

  searchMetaRowStack: {
    flexDirection: 'column',
    alignItems: 'stretch'
  },

  searchMetaText: {
    color: theme.colors.muted,
    fontWeight: '700'
  },

  fullWidthButton: {
    width: '100%'
  },

  error: {
    color: '#ef4444',
    fontWeight: '700',
    marginTop: 10
  },

  loader: {
    marginVertical: 18
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -7,
    marginBottom: 14
  },

  gridItem: {
    paddingHorizontal: 7,
    marginBottom: 14
  },

  gridItemSingle: {
    width: '100%'
  },

  gridItemDouble: {
    width: '50%'
  },

  gridItemTriple: {
    width: '33.3333%'
  },

  theatreCard: {
    overflow: 'hidden',
    padding: 0
  },

  theatreImage: {
    width: '100%',
    height: 220
  },

  theatreImagePhone: {
    height: 178
  },

  theatreBody: {
    padding: 18
  },

  theatreBodyPhone: {
    padding: 16
  },

  location: {
    color: theme.colors.gold,
    fontWeight: '800',
    marginBottom: 8
  },

  cardTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8
  },

  description: {
    color: theme.colors.muted,
    lineHeight: 22
  },

  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14
  },

  infoChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: theme.colors.line
  },

  infoChipText: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 12
  },

  actionRow: {
    marginTop: 16
  },

  buttonGap: {
    height: 10
  },

  paginationWrap: {
    marginTop: 14,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14
  },

  paginationMeta: {
    color: theme.colors.muted,
    fontWeight: '700',
    textAlign: 'center'
  },

  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12
  },

  pageNumbersWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10
  },

  paginationNavButton: {
    minWidth: 150,
    height: 58,
    paddingHorizontal: 20,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: theme.colors.line
  },

  paginationNavButtonCompact: {
    minWidth: 120,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 16
  },

  paginationNavButtonDisabled: {
    opacity: 0.45
  },

  paginationNavText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '900'
  },

  paginationNavTextCompact: {
    fontSize: 14
  },

  paginationNavTextDisabled: {
    color: theme.colors.muted
  },

  pageNumberButton: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: theme.colors.line
  },

  pageNumberButtonCompact: {
    width: 44,
    height: 44
  },

  pageNumberButtonActive: {
    backgroundColor: 'rgba(214,184,107,0.18)',
    borderColor: theme.colors.gold
  },

  pageNumberText: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '900'
  },

  pageNumberTextCompact: {
    fontSize: 14
  },

  pageNumberTextActive: {
    color: theme.colors.gold
  }
});
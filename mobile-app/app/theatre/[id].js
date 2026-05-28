import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import api from '../../src/api/client';
import Screen from '../../src/components/Screen';
import TopNav from '../../src/components/TopNav';
import Footer from '../../src/components/Footer';
import Card from '../../src/components/Card';
import Button from '../../src/components/Button';
import { theme } from '../../src/constants/theme';
import { resolveMediaUrl } from '../../src/utils/media';

const fallbackTheatre =
  'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1400&q=80';

const fallbackPoster =
  'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80';

function enrichShow(show) {
  return {
    ...show,
    poster_url: show.poster_url || fallbackPoster,
    genre:
      show.genre ||
      (show.age_rating ? `Κατάλληλο για ${show.age_rating}` : 'Παράσταση'),
    subtitle:
      show.description ||
      'Ανακάλυψε την παράσταση και προχώρησε σε online κράτηση θέσεων.'
  };
}

function formatFromPrice(show) {
  const value = Number(show.base_price || show.ticket_price || 0);
  if (!Number.isFinite(value) || value <= 0) return 'Από 18.90€';
  return `Από ${value.toFixed(2)}€`;
}

export default function TheatreDetailsPage() {
  const { id } = useLocalSearchParams();
  const { width } = useWindowDimensions();

  const theatreId = Number(id);
  const isPhone = width < 560;
  const isTablet = width >= 760;
  const isDesktop = width >= 1180;
  const isWideDesktop = width >= 1280;

  const showColumns = isDesktop ? 3 : isTablet ? 2 : 1;
  const infoColumns = isWideDesktop ? 3 : isTablet ? 2 : 1;
  const relatedColumns = isDesktop ? 3 : isTablet ? 2 : 1;

  const [theatre, setTheatre] = useState(null);
  const [shows, setShows] = useState([]);
  const [allTheatres, setAllTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');

        const [theatresRes, showsRes] = await Promise.all([
          api.get('/theatres'),
          api.get('/shows', {
            params: { theatreId }
          })
        ]);

        const theatresList = theatresRes.data || [];
        const theatreItem = theatresList.find(
          (item) => Number(item.theatre_id) === theatreId
        );

        setAllTheatres(theatresList);
        setTheatre(theatreItem || null);
        setShows((showsRes.data || []).map(enrichShow));
      } catch (e) {
        setError(
          e?.response?.data?.message ||
            'Δεν ήταν δυνατή η φόρτωση του θεάτρου.'
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [theatreId]);

  const relatedTheatres = useMemo(() => {
    if (!theatre) return [];

    return allTheatres
      .filter((item) => Number(item.theatre_id) !== Number(theatre.theatre_id))
      .filter(
        (item) =>
          String(item.location || '').trim().toLowerCase() ===
          String(theatre.location || '').trim().toLowerCase()
      )
      .slice(0, 3);
  }, [allTheatres, theatre]);

  const theatreStats = useMemo(() => {
    return {
      showsCount: shows.length,
      location: theatre?.location || '—',
      availability: shows.length
        ? 'Διαθέσιμες παραστάσεις'
        : 'Χωρίς ενεργές παραστάσεις'
    };
  }, [shows, theatre]);

  const introText =
    theatre?.intro_text?.trim() ||
    theatre?.description?.trim() ||
    'Θεατρικός χώρος με επιλεγμένες παραγωγές, σύγχρονη παρουσίαση προγράμματος και οργανωμένη εμπειρία κράτησης.';

  const spaceOverview =
    theatre?.space_overview?.trim() ||
    `Το θέατρο αυτό φιλοξενεί σήμερα ${shows.length} ${
      shows.length === 1 ? 'παράσταση' : 'παραστάσεις'
    } μέσα στην πλατφόρμα.`;

  const bookingInfo =
    theatre?.booking_info?.trim() ||
    'Μπορείς να δεις λεπτομέρειες παράστασης, να επιλέξεις προβολή και να προχωρήσεις σε online κράτηση θέσεων από το ίδιο flow.';

  return (
    <Screen scroll contentStyle={[styles.page, isPhone && styles.pagePhone]}>
      <TopNav />

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={theme.colors.gold} />
        </View>
      ) : null}

      {!loading && theatre ? (
        <>
          <Card style={styles.heroCard}>
            <Image
              source={{
                uri: resolveMediaUrl(theatre.avatar_url, fallbackTheatre)
              }}
              style={[styles.heroImage, isPhone && styles.heroImagePhone]}
            />

            <View style={[styles.heroContent, isPhone && styles.heroContentPhone]}>
              <Text style={styles.location}>{theatre.location}</Text>
              <Text style={[styles.title, isPhone && styles.titleCompact]}>
                {theatre.name}
              </Text>
              <Text style={[styles.copy, isPhone && styles.copyCompact]}>
                {introText}
              </Text>

              <View style={styles.infoRow}>
                <View style={[styles.infoChip, isPhone && styles.infoChipPhone]}>
                  <Text style={styles.infoChipValue}>{theatreStats.showsCount}</Text>
                  <Text style={styles.infoChipLabel}>Παραστάσεις</Text>
                </View>

                <View style={[styles.infoChip, isPhone && styles.infoChipPhone]}>
                  <Text numberOfLines={1} style={styles.infoChipValueText}>
                    {theatreStats.location}
                  </Text>
                  <Text style={styles.infoChipLabel}>Περιοχή</Text>
                </View>

                <View style={[styles.infoChip, isPhone && styles.infoChipPhone]}>
                  <Text numberOfLines={1} style={styles.infoChipValueText}>
                    {theatreStats.availability}
                  </Text>
                  <Text style={styles.infoChipLabel}>Κατάσταση</Text>
                </View>
              </View>

              <View style={[styles.heroActions, isTablet && styles.heroActionsRow]}>
                <View style={styles.heroActionItem}>
                  <Button
                    title="Όλα τα θέατρα"
                    variant="secondary"
                    onPress={() => router.push('/theatres')}
                  />
                </View>

                <View style={[styles.heroActionSpacer, isTablet && styles.heroActionSpacerRow]} />

                <View style={styles.heroActionItem}>
                  <Button
                    title="Παραστάσεις"
                    onPress={() => router.push(`/movies?theatreId=${theatre.theatre_id}`)}
                  />
                </View>
              </View>
            </View>
          </Card>

          <View style={styles.sectionRow}>
            <View style={styles.sectionHeadingWrap}>
              <Text style={styles.sectionEyebrow}>Σχετικά με τον χώρο</Text>
              <Text style={[styles.sectionTitle, isPhone && styles.sectionTitleCompact]}>
                Πληροφορίες θεάτρου
              </Text>
              <Text style={styles.sectionLead}>
                Βασικά στοιχεία για τον χώρο, το προφίλ του και τον τρόπο κράτησης μέσα από την πλατφόρμα.
              </Text>
            </View>
          </View>

          <View style={styles.grid}>
            <View
              style={[
                styles.gridItem,
                infoColumns === 1
                  ? styles.gridItemSingle
                  : infoColumns === 2
                    ? styles.gridItemDouble
                    : styles.gridItemTriple
              ]}
            >
              <Card style={styles.detailCard}>
                <Text style={styles.detailTitle}>Τοποθεσία</Text>
                <Text style={styles.detailCopy}>
                  {theatre.location || 'Δεν έχει οριστεί τοποθεσία.'}
                </Text>
              </Card>
            </View>

            <View
              style={[
                styles.gridItem,
                infoColumns === 1
                  ? styles.gridItemSingle
                  : infoColumns === 2
                    ? styles.gridItemDouble
                    : styles.gridItemTriple
              ]}
            >
              <Card style={styles.detailCard}>
                <Text style={styles.detailTitle}>Προφίλ χώρου</Text>
                <Text style={styles.detailCopy}>{spaceOverview}</Text>
              </Card>
            </View>

            <View
              style={[
                styles.gridItem,
                infoColumns === 1
                  ? styles.gridItemSingle
                  : infoColumns === 2
                    ? styles.gridItemDouble
                    : styles.gridItemTriple
              ]}
            >
              <Card style={styles.detailCard}>
                <Text style={styles.detailTitle}>Κράτηση & πρόσβαση</Text>
                <Text style={styles.detailCopy}>{bookingInfo}</Text>
              </Card>
            </View>
          </View>

          <View style={styles.sectionRow}>
            <View style={styles.sectionHeadingWrap}>
              <Text style={styles.sectionEyebrow}>Παραστάσεις χώρου</Text>
              <Text style={[styles.sectionTitle, isPhone && styles.sectionTitleCompact]}>
                Τι παίζεται σε αυτό το θέατρο
              </Text>
            </View>
          </View>

          {shows.length ? (
            <View style={styles.grid}>
              {shows.map((item) => (
                <View
                  key={item.show_id}
                  style={[
                    styles.gridItem,
                    showColumns === 1
                      ? styles.gridItemSingle
                      : showColumns === 2
                        ? styles.gridItemDouble
                        : styles.gridItemTriple
                  ]}
                >
                  <Card style={styles.showCard}>
                    <Image
                      source={{
                        uri: resolveMediaUrl(item.poster_url, fallbackPoster)
                      }}
                      style={[styles.showImage, isPhone && styles.showImagePhone]}
                    />

                    <View style={styles.showBody}>
                      <Text style={styles.showGenre}>{item.genre}</Text>
                      <Text style={styles.showTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.showCopy} numberOfLines={3}>
                        {item.subtitle}
                      </Text>
                      <Text style={styles.showPrice}>{formatFromPrice(item)}</Text>

                      <View style={styles.showActions}>
                        <Button
                          title="Λεπτομέρειες"
                          onPress={() => router.push(`/show/${item.show_id}`)}
                        />
                      </View>
                    </View>
                  </Card>
                </View>
              ))}
            </View>
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Δεν υπάρχουν παραστάσεις</Text>
              <Text style={styles.emptyCopy}>
                Δεν έχουν συνδεθεί ακόμη διαθέσιμες παραστάσεις με αυτό το θέατρο.
              </Text>
            </Card>
          )}

          {relatedTheatres.length ? (
            <>
              <View style={styles.sectionRow}>
                <View style={styles.sectionHeadingWrap}>
                  <Text style={styles.sectionEyebrow}>Στην ίδια περιοχή</Text>
                  <Text style={[styles.sectionTitle, isPhone && styles.sectionTitleCompact]}>
                    Άλλοι χώροι που μπορεί να σε ενδιαφέρουν
                  </Text>
                </View>
              </View>

              <View style={styles.grid}>
                {relatedTheatres.map((item) => (
                  <View
                    key={item.theatre_id}
                    style={[
                      styles.gridItem,
                      relatedColumns === 1
                        ? styles.gridItemSingle
                        : relatedColumns === 2
                          ? styles.gridItemDouble
                          : styles.gridItemTriple
                    ]}
                  >
                    <Card style={styles.relatedCard}>
                      <Text style={styles.relatedLocation}>{item.location}</Text>
                      <Text style={styles.relatedTitle}>{item.name}</Text>
                      <Text style={styles.relatedCopy} numberOfLines={2}>
                        {item.description ||
                          'Θεατρικός χώρος με επιλεγμένες παραγωγές και οργανωμένο πρόγραμμα.'}
                      </Text>

                      <View style={styles.relatedAction}>
                        <Button
                          title="Προβολή θεάτρου"
                          variant="secondary"
                          onPress={() => router.push(`/theatre/${item.theatre_id}`)}
                        />
                      </View>
                    </Card>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </>
      ) : null}

      {!loading && !theatre ? (
        <Card>
          <Text style={styles.emptyTitle}>Το θέατρο δεν βρέθηκε</Text>
          <Text style={styles.emptyCopy}>
            Επέστρεψε στη λίστα θεάτρων και δοκίμασε ξανά.
          </Text>
          <View style={styles.emptyActions}>
            <Button
              title="Επιστροφή στα θέατρα"
              onPress={() => router.push('/theatres')}
            />
          </View>
        </Card>
      ) : null}

      {error ? (
        <Card>
          <Text style={styles.errorText}>{error}</Text>
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

  loaderWrap: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center'
  },

  heroCard: {
    overflow: 'hidden',
    padding: 0,
    marginBottom: 26
  },

  heroImage: {
    width: '100%',
    height: 360
  },

  heroImagePhone: {
    height: 230
  },

  heroContent: {
    padding: 22
  },

  heroContentPhone: {
    padding: 18
  },

  location: {
    color: theme.colors.gold,
    fontWeight: '800',
    marginBottom: 8
  },

  title: {
    color: theme.colors.text,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '900'
  },

  titleCompact: {
    fontSize: 28,
    lineHeight: 34
  },

  copy: {
    color: theme.colors.muted,
    lineHeight: 24,
    marginTop: 12,
    maxWidth: 920,
    fontSize: 16
  },

  copyCompact: {
    fontSize: 15,
    lineHeight: 22
  },

  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 22
  },

  infoChip: {
    flexGrow: 1,
    minWidth: 150,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: theme.colors.line
  },

  infoChipPhone: {
    width: '100%'
  },

  infoChipValue: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4
  },

  infoChipValueText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4
  },

  infoChipLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '700'
  },

  heroActions: {
    marginTop: 22
  },

  heroActionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    maxWidth: 720
  },

  heroActionItem: {
    width: '100%',
    flex: 1
  },

  heroActionSpacer: {
    height: 10
  },

  heroActionSpacerRow: {
    width: 12,
    height: 0
  },

  sectionRow: {
    marginBottom: 14,
    marginTop: 4
  },

  sectionHeadingWrap: {
    flex: 1
  },

  sectionEyebrow: {
    color: theme.colors.gold,
    fontWeight: '800',
    marginBottom: 6
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900'
  },

  sectionTitleCompact: {
    fontSize: 22,
    lineHeight: 28
  },

  sectionLead: {
    color: theme.colors.muted,
    lineHeight: 23,
    marginTop: 10,
    maxWidth: 900
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -7,
    marginBottom: 24
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

  detailCard: {
    minHeight: 0,
    justifyContent: 'flex-start'
  },

  detailTitle: {
    color: theme.colors.text,
    fontSize: 21,
    fontWeight: '900',
    marginBottom: 12
  },

  detailCopy: {
    color: theme.colors.muted,
    lineHeight: 24,
    fontSize: 15
  },

  showCard: {
    overflow: 'hidden',
    padding: 0,
    minHeight: 0
  },

  showImage: {
    width: '100%',
    height: 210
  },

  showImagePhone: {
    height: 190
  },

  showBody: {
    padding: 18
  },

  showGenre: {
    color: theme.colors.gold,
    fontWeight: '800',
    marginBottom: 8
  },

  showTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8
  },

  showCopy: {
    color: theme.colors.muted,
    lineHeight: 22
  },

  showPrice: {
    color: theme.colors.gold,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 14
  },

  showActions: {
    marginTop: 16
  },

  relatedCard: {
    minHeight: 0
  },

  relatedLocation: {
    color: theme.colors.gold,
    fontWeight: '800',
    marginBottom: 8
  },

  relatedTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8
  },

  relatedCopy: {
    color: theme.colors.muted,
    lineHeight: 22
  },

  relatedAction: {
    marginTop: 16
  },

  emptyCard: {
    marginBottom: 24
  },

  emptyTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8
  },

  emptyCopy: {
    color: theme.colors.muted,
    lineHeight: 22
  },

  emptyActions: {
    marginTop: 16
  },

  errorText: {
    color: '#fca5a5',
    fontWeight: '700'
  }
});
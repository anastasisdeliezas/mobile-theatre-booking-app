import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
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
import MovieCard from '../src/components/MovieCard';
import Input from '../src/components/Input';
import Button from '../src/components/Button';
import Card from '../src/components/Card';
import { theme } from '../src/constants/theme';
import { sanitizeText } from '../src/utils/validation';

const fallbackPoster =
  'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80';

const sortOptions = ['Προτεινόμενες', 'A-Z', 'Χαμηλότερη τιμή'];
const ITEMS_PER_PAGE = 12;

function mapShow(show) {
  return {
    ...show,
    poster_url: show.poster_url || fallbackPoster,
    genre:
      show.genre ||
      (show.age_rating ? `Κατάλληλο για ${show.age_rating}` : 'Παράσταση'),
    shortDescription:
      show.description || 'Θεατρική εμπειρία με εύκολη online κράτηση θέσεων.',
    theatre_name: show.theatre_name || 'Κεντρική Σκηνή',
    duration: show.duration_minutes ? `${show.duration_minutes} λεπτά` : '120 λεπτά',
    age_rating: show.age_rating || '13+',
    ticket_price: Number(show.ticket_price || show.base_price || 18.9)
  };
}

function formatPrice(item) {
  const value = Number(item.ticket_price || item.base_price || 0);
  if (!Number.isFinite(value) || value <= 0) return '18.90€';
  return `${value.toFixed(2)}€`;
}

function HoverEffect({ children, type = 'card', style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const lift = useRef(new Animated.Value(0)).current;
  const [active, setActive] = useState(false);

  const animate = (isActive) => {
    setActive(isActive);

    let nextScale = 1;
    let nextLift = 0;

    if (isActive) {
      if (type === 'button') {
        nextScale = 1.035;
        nextLift = -2;
      } else if (type === 'featured') {
        nextScale = 1.018;
        nextLift = -6;
      } else if (type === 'panel') {
        nextScale = 1.006;
        nextLift = -3;
      } else {
        nextScale = 1.018;
        nextLift = -6;
      }
    }

    Animated.parallel([
      Animated.timing(scale, {
        toValue: nextScale,
        duration: isActive ? 150 : 190,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(lift, {
        toValue: nextLift,
        duration: isActive ? 150 : 190,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    ]).start();
  };

  const shellStyle =
    type === 'button'
      ? styles.buttonHoverShell
      : type === 'featured'
        ? styles.featuredHoverShell
        : type === 'panel'
          ? styles.panelHoverShell
          : styles.cardHoverShell;

  const activeStyle =
    type === 'button'
      ? styles.buttonHoverShellActive
      : type === 'featured'
        ? styles.featuredHoverShellActive
        : type === 'panel'
          ? styles.panelHoverShellActive
          : styles.cardHoverShellActive;

  return (
    <Animated.View
      onMouseEnter={() => animate(true)}
      onMouseLeave={() => animate(false)}
      onTouchStart={() => animate(true)}
      onTouchEnd={() => animate(false)}
      onTouchCancel={() => animate(false)}
      style={[
        shellStyle,
        active && activeStyle,
        style,
        { transform: [{ translateY: lift }, { scale }] }
      ]}
    >
      {children}
    </Animated.View>
  );
}

export default function MoviesScreen() {
  const { width } = useWindowDimensions();

  const isPhone = width < 560;
  const isTablet = width >= 760;
  const isDesktop = width >= 1180;
  const isWideHero = width >= 980;

  const columns = isDesktop ? 3 : isTablet ? 2 : 1;

  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Όλα');
  const [selectedTheatre, setSelectedTheatre] = useState('Όλα');
  const [sortBy, setSortBy] = useState('Προτεινόμενες');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/shows');
        setShows((data || []).map(mapShow));
      } catch (error) {
        console.log('Movies load error:', error?.response?.status, error?.message);
        setShows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const theatreOptions = useMemo(
    () => ['Όλα', ...new Set(shows.map((item) => item.theatre_name).filter(Boolean))],
    [shows]
  );

  const genreOptions = useMemo(
    () => ['Όλα', ...new Set(shows.map((item) => item.genre).filter(Boolean))],
    [shows]
  );

  const filtered = useMemo(() => {
    const result = shows.filter((item) => {
      const haystack =
        `${item.title} ${item.theatre_name || ''} ${item.genre || ''} ${item.location || ''}`.toLowerCase();

      const matchesSearch = !query || haystack.includes(query.toLowerCase());
      const matchesGenre = selectedGenre === 'Όλα' || item.genre === selectedGenre;
      const matchesTheatre =
        selectedTheatre === 'Όλα' || item.theatre_name === selectedTheatre;

      return matchesSearch && matchesGenre && matchesTheatre;
    });

    if (sortBy === 'A-Z') {
      return [...result].sort((a, b) => a.title.localeCompare(b.title, 'el'));
    }

    if (sortBy === 'Χαμηλότερη τιμή') {
      return [...result].sort(
        (a, b) => Number(a.ticket_price || 0) - Number(b.ticket_price || 0)
      );
    }

    return result;
  }, [query, selectedGenre, selectedTheatre, shows, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedGenre, selectedTheatre, sortBy]);

  const featured = filtered[0] || shows[0] || null;

  const catalogue = useMemo(() => {
    return featured
      ? filtered.filter((item) => item.show_id !== featured.show_id)
      : filtered;
  }, [filtered, featured]);

  const totalPages = Math.max(1, Math.ceil(catalogue.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedCatalogue = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return catalogue.slice(start, start + ITEMS_PER_PAGE);
  }, [catalogue, safePage]);

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  return (
    <Screen scroll contentStyle={styles.page}>
      <TopNav />

      <View style={[styles.heroShell, !isWideHero && styles.heroShellStack]}>
        <View style={styles.heroContent}>
          <Text style={styles.kicker}>Τρέχουσες παραστάσεις</Text>
          <Text
            style={[
              styles.heading,
              !isWideHero && styles.headingCompact,
              isPhone && styles.headingPhone
            ]}
          >
            Αναζήτησε παραγωγές με βάση τίτλο, είδος ή θέατρο
          </Text>
          <Text style={[styles.copy, isPhone && styles.copyPhone]}>
            Η σελίδα αυτή είναι σχεδιασμένη για γρήγορη περιήγηση: search, φίλτρα,
            featured παράσταση και καθαρές κάρτες με όσα χρειάζεται ο χρήστης για να
            αποφασίσει.
          </Text>

          <View style={styles.heroFacts}>
            <HoverEffect type="panel" style={styles.factHoverWrap}>
              <View style={styles.factPill}>
                <Text style={styles.factValue}>{shows.length}</Text>
                <Text style={styles.factLabel}>Παραστάσεις</Text>
              </View>
            </HoverEffect>

            <HoverEffect type="panel" style={styles.factHoverWrap}>
              <View style={styles.factPill}>
                <Text style={styles.factValue}>{Math.max(0, theatreOptions.length - 1)}</Text>
                <Text style={styles.factLabel}>Θέατρα</Text>
              </View>
            </HoverEffect>

            <HoverEffect type="panel" style={styles.factHoverWrap}>
              <View style={styles.factPill}>
                <Text style={styles.factValue}>Live</Text>
                <Text style={styles.factLabel}>Ώρες & θέσεις</Text>
              </View>
            </HoverEffect>
          </View>
        </View>

        {featured ? (
          <View style={[styles.featuredWrap, !isWideHero && styles.featuredWrapStack]}>
            <HoverEffect type="featured">
              <MovieCard
                item={featured}
                featured
                onPress={() => router.push(`/show/${featured.show_id}`)}
              />
            </HoverEffect>
          </View>
        ) : null}
      </View>

      <Card style={styles.filtersCard}>
        <Text style={styles.filtersTitle}>Φίλτρα αναζήτησης</Text>
        <Text style={styles.filtersSubtitle}>
          Συνδύασε αναζήτηση, είδος και θέατρο για πιο γρήγορο εντοπισμό της
          κατάλληλης παράστασης.
        </Text>

        <Input
          label="Αναζήτηση παράστασης, είδους ή θεάτρου"
          value={query}
          onChangeText={(value) => setQuery(sanitizeText(value, 80))}
          placeholder="π.χ. Αντιγόνη, Κωμωδία, Θέατρο Παλλάς"
        />

        <Text style={styles.filterLabel}>Είδος</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {genreOptions.map((genre) => {
            const active = selectedGenre === genre;
            return (
              <Pressable
                key={genre}
                onPress={() => setSelectedGenre(genre)}
                style={({ hovered, pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  hovered && styles.chipHover,
                  pressed && styles.chipPressed
                ]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {genre}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.filterLabel}>Θέατρο</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {theatreOptions.map((name) => {
            const active = selectedTheatre === name;
            return (
              <Pressable
                key={name}
                onPress={() => setSelectedTheatre(name)}
                style={({ hovered, pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  hovered && styles.chipHover,
                  pressed && styles.chipPressed
                ]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sortRow}>
          {sortOptions.map((option) => {
            const active = sortBy === option;
            return (
              <Pressable
                key={option}
                onPress={() => setSortBy(option)}
                style={({ hovered, pressed }) => [
                  styles.sortPill,
                  active && styles.sortPillActive,
                  hovered && styles.sortPillHover,
                  pressed && styles.sortPillPressed
                ]}
              >
                <Text style={[styles.sortText, active && styles.sortTextActive]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <View style={[styles.catalogHeader, !isTablet && styles.catalogHeaderStack]}>
        <View style={styles.catalogHeaderText}>
          <Text style={styles.catalogTitle}>Κατάλογος παραστάσεων</Text>
          <Text style={styles.catalogMeta}>
            {filtered.length} διαθέσιμες επιλογές για online κράτηση
          </Text>
        </View>

        <HoverEffect type="button" style={!isTablet && styles.fullWidthButtonHover}>
          <Button
            title="Θέατρα"
            variant="secondary"
            onPress={() => router.push('/theatres')}
          />
        </HoverEffect>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.colors.gold}
          style={styles.loaderSpacing}
        />
      ) : null}

      {!loading && featured ? (
        <Card style={styles.featuredInfoCard}>
          <View style={[styles.featuredInfoTop, !isTablet && styles.featuredInfoTopStack]}>
            <View style={styles.featuredInfoMain}>
              <Text style={styles.featuredEyebrow}>Featured επιλογή</Text>
              <Text style={styles.featuredTitle}>{featured.title}</Text>
              <Text style={styles.featuredDescription} numberOfLines={3}>
                {featured.shortDescription}
              </Text>
            </View>

            <View
              style={[
                styles.featuredBadgeWrap,
                !isTablet && styles.featuredBadgeWrapStack
              ]}
            >
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeLabel}>Θέατρο</Text>
                <Text style={styles.featuredBadgeValue}>{featured.theatre_name}</Text>
              </View>

              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeLabel}>Τιμή</Text>
                <Text style={styles.featuredBadgeValue}>Από {formatPrice(featured)}</Text>
              </View>
            </View>
          </View>
        </Card>
      ) : null}

      <View style={styles.grid}>
        {paginatedCatalogue.map((item) => (
          <View
            key={item.show_id}
            style={[
              styles.gridItem,
              columns === 1
                ? styles.gridItemSingle
                : columns === 2
                  ? styles.gridItemDouble
                  : styles.gridItemTriple
            ]}
          >
            <HoverEffect type="card" style={styles.movieCardHoverWrap}>
              <MovieCard
                item={item}
                compact
                onPress={() => router.push(`/show/${item.show_id}`)}
              />
            </HoverEffect>
          </View>
        ))}
      </View>

      {!loading && catalogue.length > ITEMS_PER_PAGE ? (
        <View style={styles.paginationWrap}>
          <Pressable
            onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            style={({ hovered, pressed }) => [
              styles.paginationButton,
              hovered && safePage !== 1 && styles.paginationButtonHover,
              pressed && safePage !== 1 && styles.paginationButtonPressed,
              safePage === 1 && styles.paginationButtonDisabled
            ]}
          >
            <Text
              style={[
                styles.paginationText,
                safePage === 1 && styles.paginationTextDisabled
              ]}
            >
              Προηγούμενη
            </Text>
          </Pressable>

          <View style={styles.paginationCenter}>
            {pageNumbers.map((page) => {
              const active = page === safePage;
              return (
                <Pressable
                  key={page}
                  onPress={() => setCurrentPage(page)}
                  style={({ hovered, pressed }) => [
                    styles.pageNumber,
                    active && styles.pageNumberActive,
                    hovered && !active && styles.pageNumberHover,
                    pressed && styles.pageNumberPressed
                  ]}
                >
                  <Text
                    style={[
                      styles.pageNumberText,
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
            onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            style={({ hovered, pressed }) => [
              styles.paginationButton,
              hovered && safePage !== totalPages && styles.paginationButtonHover,
              pressed && safePage !== totalPages && styles.paginationButtonPressed,
              safePage === totalPages && styles.paginationButtonDisabled
            ]}
          >
            <Text
              style={[
                styles.paginationText,
                safePage === totalPages && styles.paginationTextDisabled
              ]}
            >
              Επόμενη
            </Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && !filtered.length ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Δεν βρέθηκαν παραστάσεις</Text>
          <Text style={styles.emptyCopy}>
            Δοκίμασε άλλο είδος, διαφορετικό θέατρο ή νέο όρο αναζήτησης.
          </Text>
        </Card>
      ) : null}

      <Footer />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardHoverShell: {
    borderRadius: 28,
    overflow: 'visible'
  },

  cardHoverShellActive: {
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.24,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12
  },

  featuredHoverShell: {
    borderRadius: 30,
    overflow: 'visible'
  },

  featuredHoverShellActive: {
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.26,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12
  },

  panelHoverShell: {
    borderRadius: 30,
    overflow: 'visible'
  },

  panelHoverShellActive: {
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10
  },

  buttonHoverShell: {
    borderRadius: 999,
    overflow: 'visible'
  },

  buttonHoverShellActive: {
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 10
  },

  movieCardHoverWrap: {
    width: '100%',
    borderRadius: 28
  },

  fullWidthButtonHover: {
    width: '100%'
  },

  factHoverWrap: {
    borderRadius: 18
  },

  page: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 34
  },

  heroShell: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 20,
    padding: 22,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(232,192,106,0.18)',
    backgroundColor: 'rgba(10,18,33,0.92)',
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.12,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 10
  },

  heroShellStack: {
    flexDirection: 'column',
    padding: 16
  },

  heroContent: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0
  },

  featuredWrap: {
    flex: 0.92,
    minWidth: 320
  },

  featuredWrapStack: {
    flex: undefined,
    minWidth: 0,
    width: '100%'
  },

  kicker: {
    color: theme.colors.gold,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.4
  },

  heading: {
    color: theme.colors.text,
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '900',
    marginBottom: 12
  },

  headingCompact: {
    fontSize: 30,
    lineHeight: 36
  },

  headingPhone: {
    fontSize: 26,
    lineHeight: 32
  },

  copy: {
    color: theme.colors.muted,
    lineHeight: 23,
    fontSize: 16,
    maxWidth: 680
  },

  copyPhone: {
    fontSize: 15,
    lineHeight: 22
  },

  heroFacts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18
  },

  factPill: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: theme.colors.line,
    minWidth: 102
  },

  factValue: {
    color: theme.colors.text,
    fontWeight: '900',
    fontSize: 15,
    marginBottom: 2
  },

  factLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '700'
  },

  filtersCard: {
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(232,192,106,0.12)',
    overflow: 'visible',
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6
  },

  filtersTitle: {
    color: theme.colors.text,
    fontWeight: '900',
    fontSize: 20,
    marginBottom: 4
  },

  filtersSubtitle: {
    color: theme.colors.muted,
    lineHeight: 21,
    marginBottom: 16
  },

  filterLabel: {
    color: theme.colors.text,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 6
  },

  chipRow: {
    gap: 10,
    paddingTop: 4,
    paddingBottom: 8,
    paddingRight: 6
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: 'rgba(255,255,255,0.03)'
  },

  chipActive: {
    backgroundColor: theme.colors.goldSoft,
    borderColor: 'rgba(232,192,106,0.36)'
  },

  chipHover: {
    borderColor: 'rgba(232,192,106,0.46)',
    backgroundColor: 'rgba(232,192,106,0.10)',
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  },

  chipPressed: {
    opacity: 0.86
  },

  chipText: {
    color: theme.colors.text,
    fontWeight: '700'
  },

  chipTextActive: {
    color: theme.colors.gold
  },

  sortRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 16
  },

  sortPill: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: 'rgba(255,255,255,0.03)'
  },

  sortPillActive: {
    backgroundColor: theme.colors.goldSoft,
    borderColor: 'rgba(232,192,106,0.36)'
  },

  sortPillHover: {
    borderColor: 'rgba(232,192,106,0.46)',
    backgroundColor: 'rgba(232,192,106,0.10)',
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  },

  sortPillPressed: {
    opacity: 0.86
  },

  sortText: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 13
  },

  sortTextActive: {
    color: theme.colors.gold
  },

  catalogHeader: {
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center'
  },

  catalogHeaderStack: {
    flexDirection: 'column',
    alignItems: 'flex-start'
  },

  catalogHeaderText: {
    flexShrink: 1
  },

  catalogTitle: {
    color: theme.colors.text,
    fontWeight: '900',
    fontSize: 24
  },

  catalogMeta: {
    color: theme.colors.muted,
    lineHeight: 21
  },

  loaderSpacing: {
    marginVertical: 26
  },

  featuredInfoCard: {
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(232,192,106,0.14)',
    overflow: 'visible',
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6
  },

  featuredInfoTop: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center'
  },

  featuredInfoTopStack: {
    flexDirection: 'column',
    alignItems: 'flex-start'
  },

  featuredInfoMain: {
    flex: 1,
    minWidth: 0
  },

  featuredEyebrow: {
    color: theme.colors.gold,
    fontWeight: '800',
    marginBottom: 6
  },

  featuredTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8
  },

  featuredDescription: {
    color: theme.colors.muted,
    lineHeight: 22
  },

  featuredBadgeWrap: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap'
  },

  featuredBadgeWrapStack: {
    flexDirection: 'column',
    width: '100%'
  },

  featuredBadge: {
    minWidth: 150,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: theme.colors.line
  },

  featuredBadgeLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    marginBottom: 4
  },

  featuredBadgeValue: {
    color: theme.colors.text,
    fontWeight: '800'
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8
  },

  gridItem: {
    paddingHorizontal: 8,
    marginBottom: 16
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

  paginationWrap: {
    marginTop: 10,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap'
  },

  paginationCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center'
  },

  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: 'rgba(255,255,255,0.04)',
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center'
  },

  paginationButtonHover: {
    borderColor: 'rgba(232,192,106,0.42)',
    backgroundColor: 'rgba(232,192,106,0.09)'
  },

  paginationButtonPressed: {
    opacity: 0.86
  },

  paginationButtonDisabled: {
    opacity: 0.45
  },

  paginationText: {
    color: theme.colors.text,
    fontWeight: '800'
  },

  paginationTextDisabled: {
    color: theme.colors.muted
  },

  pageNumber: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: 'rgba(255,255,255,0.03)'
  },

  pageNumberActive: {
    backgroundColor: theme.colors.goldSoft,
    borderColor: 'rgba(232,192,106,0.36)'
  },

  pageNumberHover: {
    borderColor: 'rgba(232,192,106,0.44)',
    backgroundColor: 'rgba(232,192,106,0.09)'
  },

  pageNumberPressed: {
    opacity: 0.86
  },

  pageNumberText: {
    color: theme.colors.text,
    fontWeight: '800'
  },

  pageNumberTextActive: {
    color: theme.colors.gold
  },

  emptyCard: {
    marginTop: 8
  },

  emptyTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8
  },

  emptyCopy: {
    color: theme.colors.muted,
    lineHeight: 22
  }
});
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Animated,
  Easing,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/api/client';
import Screen from '../src/components/Screen';
import Card from '../src/components/Card';
import TopNav from '../src/components/TopNav';
import Footer from '../src/components/Footer';
import HeroCarousel from '../src/components/HeroCarousel';
import Button from '../src/components/Button';
import MovieCard from '../src/components/MovieCard';
import { theme } from '../src/constants/theme';
import { resolveMediaUrl } from '../src/utils/media';

const fallbackPoster =
  'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80';

const fallbackTheatreImages = [
  'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1507924538820-ede94a04019d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1515169067865-5387ec356754?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80'
];

const fallbackHeroShow = {
  show_id: null,
  title: "Del's Theatre",
  image: fallbackPoster,
  poster_url: fallbackPoster,
  subtitle:
    'Ανακάλυψε θεατρικές παραστάσεις, δες διαθέσιμες προβολές και κλείσε τις θέσεις σου online.',
  genre: 'Online theatre booking',
  ticket_price: 18.9
};

function enrichShow(show) {
  return {
    ...show,
    image: show.hero_image_url || show.poster_url || fallbackPoster,
    poster_url: show.poster_url || show.hero_image_url || fallbackPoster,
    subtitle:
      show.description ||
      'Ανακάλυψε την παράσταση, επίλεξε ημερομηνία και προχώρησε σε online κράτηση θέσεων.',
    genre:
      show.genre ||
      (show.age_rating ? `Κατάλληλο για ${show.age_rating}` : 'Παράσταση'),
    ticket_price: Number(show.ticket_price || show.base_price || 18.9)
  };
}

function formatFromPrice(show) {
  const value = Number(show.base_price || show.ticket_price || 0);
  if (!Number.isFinite(value) || value <= 0) return 'Από 18.90€';
  return `Από ${value.toFixed(2)}€`;
}

function formatDateTime(value) {
  if (!value) return 'Σύντομα διαθέσιμο';

  try {
    return new Date(value).toLocaleString('el-GR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  } catch {
    return 'Σύντομα διαθέσιμο';
  }
}

function getShowImage(show) {
  return resolveMediaUrl(
    show?.hero_image_url ||
      show?.poster_url ||
      show?.image ||
      show?.show_image ||
      fallbackPoster
  );
}

function getTheatreImage(theatre, index) {
  return resolveMediaUrl(
    theatre?.image_url ||
      theatre?.photo_url ||
      theatre?.hero_image_url ||
      theatre?.poster_url ||
      fallbackTheatreImages[index % fallbackTheatreImages.length]
  );
}

function buildUpcomingShowtimes(showtimes, shows, theatres) {
  const showMap = new Map(shows.map((item) => [Number(item.show_id), item]));
  const theatreMap = new Map(
    theatres.map((item) => [Number(item.theatre_id), item])
  );

  return (showtimes || [])
    .map((showtime) => {
      const show = showMap.get(Number(showtime.show_id));
      const theatre =
        theatreMap.get(Number(show?.theatre_id)) ||
        theatreMap.get(Number(showtime.theatre_id));

      return {
        showtime_id: showtime.showtime_id,
        show_id: show?.show_id || showtime.show_id,
        title: show?.title || showtime.show_title || 'Παράσταση',
        theatre_name: theatre?.name || showtime.theatre_name || 'Θέατρο',
        location: theatre?.location || showtime.location || '',
        hall_name: showtime.hall_name || 'Αίθουσα',
        start_time: showtime.start_time,
        base_price: Number(
          showtime.base_price || show?.base_price || show?.ticket_price || 0
        ),
        show_image:
          show?.hero_image_url ||
          show?.poster_url ||
          show?.image ||
          showtime.hero_image_url ||
          showtime.poster_url ||
          fallbackPoster,
        genre: show?.genre || 'Παράσταση'
      };
    })
    .filter((item) => item.show_id)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    .slice(0, 6);
}

function InfoPill({ label, value, tone = 'gold' }) {
  return (
    <View style={[styles.infoPill, styles[`infoPill${tone}`]]}>
      <Text style={styles.infoPillLabel}>{label}</Text>
      <Text style={styles.infoPillValue}>{value}</Text>
    </View>
  );
}

function HoverEffect({ children, type = 'card', style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const lift = useRef(new Animated.Value(0)).current;
  const [active, setActive] = useState(false);

  const animate = (isActive) => {
    setActive(isActive);

    let nextScale = 1;
    let nextOpacity = 1;
    let nextLift = 0;

    if (isActive) {
      if (type === 'button') {
        nextScale = 1.03;
        nextLift = -2;
      } else if (type === 'featured') {
        nextScale = 1.012;
        nextOpacity = 0.98;
        nextLift = -5;
      } else {
        nextScale = 1.018;
        nextLift = -6;
      }
    }

    Animated.parallel([
      Animated.timing(scale, {
        toValue: nextScale,
        duration: isActive ? 150 : 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: nextOpacity,
        duration: isActive ? 150 : 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(lift, {
        toValue: nextLift,
        duration: isActive ? 150 : 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    ]).start();
  };

  const shellStyle =
    type === 'button'
      ? styles.buttonHoverShell
      : type === 'featured'
        ? styles.featuredCardHoverShell
        : styles.cardHoverShell;

  const activeStyle =
    type === 'button'
      ? styles.buttonHoverShellActive
      : type === 'featured'
        ? styles.featuredCardHoverShellActive
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
        { opacity, transform: [{ translateY: lift }, { scale }] }
      ]}
    >
      {children}
    </Animated.View>
  );
}

export default function Index() {
  const { width } = useWindowDimensions();
  const { loading } = useAuth();

  const isPhone = width < 560;
  const isTablet = width >= 760;
  const isDesktop = width >= 1180;

  const upcomingColumns = isDesktop ? 4 : isTablet ? 2 : 1;
  const theatreColumns = isDesktop ? 4 : isTablet ? 2 : 1;

  const [shows, setShows] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const results = await Promise.allSettled([
          api.get('/shows'),
          api.get('/theatres'),
          api.get('/showtimes')
        ]);

        const showsRes =
          results[0].status === 'fulfilled' ? results[0].value.data : [];
        const theatresRes =
          results[1].status === 'fulfilled' ? results[1].value.data : [];
        const showtimesRes =
          results[2].status === 'fulfilled' ? results[2].value.data : [];

        setShows((showsRes || []).map(enrichShow));
        setTheatres(theatresRes || []);
        setShowtimes(showtimesRes || []);
      } finally {
        setFetching(false);
      }
    })();
  }, []);

  const featured = useMemo(() => shows.slice(0, 3), [shows]);
  const heroItems = featured.length ? featured : [fallbackHeroShow];
  const trending = useMemo(() => shows.slice(0, 6), [shows]);
  const upcoming = useMemo(() => shows.slice(3, 7), [shows]);
  const theatreHighlights = useMemo(() => theatres.slice(0, 4), [theatres]);

  const upcomingShowtimes = useMemo(
    () => buildUpcomingShowtimes(showtimes, shows, theatres),
    [showtimes, shows, theatres]
  );

  const goToShow = (item) => {
    if (item?.show_id) {
      router.push(`/show/${item.show_id}`);
      return;
    }

    router.push('/movies');
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.gold} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll contentStyle={[styles.page, isPhone && styles.pagePhone]}>
      <TopNav />

      <HeroCarousel items={heroItems} onBook={goToShow} onDetails={goToShow} />

      <View style={[styles.sectionRow, !isTablet && styles.sectionRowStack]}>
        <View style={styles.sectionHeadingWrap}>
          <Text style={styles.sectionEyebrow}>Προτεινόμενες παραστάσεις</Text>
          <Text style={[styles.sectionTitle, isPhone && styles.sectionTitleCompact]}>
            Επιλογές που ξεχωρίζουν αυτή την περίοδο
          </Text>
        </View>

        <View
          style={[
            styles.sectionButtonWrap,
            !isTablet && styles.sectionButtonWrapFull
          ]}
        >
          <HoverEffect type="button">
            <Button
              title="Όλες οι παραστάσεις"
              variant="secondary"
              onPress={() => router.push('/movies')}
            />
          </HoverEffect>
        </View>
      </View>

      {fetching ? (
        <ActivityIndicator
          size="large"
          color={theme.colors.gold}
          style={styles.loaderSpacing}
        />
      ) : trending.length ? (
        <ScrollView
          horizontal
          style={[styles.featuredRail, isPhone && styles.featuredRailPhone]}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalRow}
        >
          {trending.map((item) => (
            <View
              key={item.show_id}
              style={[
                styles.featuredCardSlot,
                isPhone && styles.featuredCardSlotPhone
              ]}
            >
              <HoverEffect
                type="featured"
                style={[
                  styles.featuredHoverShell,
                  isPhone && styles.featuredHoverShellPhone
                ]}
              >
                <MovieCard
                  item={item}
                  onPress={() => router.push(`/show/${item.show_id}`)}
                />
              </HoverEffect>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Δεν υπάρχουν ακόμη παραστάσεις</Text>
          <Text style={styles.emptyCopy}>
            Μόλις προστεθούν παραστάσεις από το admin panel, θα εμφανιστούν εδώ.
          </Text>
          <View style={styles.emptyAction}>
            <HoverEffect type="button">
              <Button
                title="Δες τον κατάλογο"
                variant="secondary"
                onPress={() => router.push('/movies')}
              />
            </HoverEffect>
          </View>
        </Card>
      )}

      <View style={styles.sectionRowOnly}>
        <View style={styles.sectionHeadingWrap}>
          <Text style={styles.sectionEyebrow}>Επόμενες προβολές</Text>
          <Text style={[styles.sectionTitle, isPhone && styles.sectionTitleCompact]}>
            Προβολές που μπορείς να κλείσεις τώρα
          </Text>
        </View>
      </View>

      {upcomingShowtimes.length ? (
        <ScrollView
          horizontal
          style={styles.showtimeRail}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.showtimeRow}
        >
          {upcomingShowtimes.map((item) => (
            <HoverEffect key={item.showtime_id} style={styles.horizontalHoverShell}>
              <Card
                style={[styles.showtimeCard, isPhone && styles.showtimeCardPhone]}
              >
                <ImageBackground
                  source={{ uri: getShowImage(item) }}
                  imageStyle={styles.showtimeImageRadius}
                  style={styles.showtimeImage}
                >
                  <LinearGradient
                    colors={['rgba(5,7,13,0.08)', 'rgba(5,7,13,0.86)']}
                    style={styles.showtimeImageOverlay}
                  >
                    <View style={styles.showtimeTopRow}>
                      <Text style={styles.showtimeImageBadge} numberOfLines={1}>
                        {item.genre}
                      </Text>
                      <Text style={styles.showtimeDateBadgeText} numberOfLines={1}>
                        {formatDateTime(item.start_time)}
                      </Text>
                    </View>
                  </LinearGradient>
                </ImageBackground>

                <View style={styles.showtimeBody}>
                  <View>
                    <Text style={styles.showtimeTitle} numberOfLines={2}>
                      {item.title}
                    </Text>

                    <Text style={styles.showtimeMeta} numberOfLines={2}>
                      {item.theatre_name}
                      {item.location ? ` · ${item.location}` : ''}
                    </Text>

                    <Text style={styles.showtimeMeta} numberOfLines={1}>
                      {item.hall_name}
                    </Text>
                  </View>

                  <View style={styles.showtimeFooter}>
                    <Text style={styles.showtimePrice}>
                      {item.base_price > 0
                        ? `Από ${item.base_price.toFixed(2)}€`
                        : 'Δες διαθεσιμότητα'}
                    </Text>

                    <View style={styles.showtimeActions}>
                      <HoverEffect type="button">
                        <Button
                          title="Κράτηση"
                          onPress={() =>
                            router.push(`/booking/${item.showtime_id}`)
                          }
                        />
                      </HoverEffect>
                      <View style={styles.actionGap} />
                      <HoverEffect type="button">
                        <Button
                          title="Παράσταση"
                          variant="secondary"
                          onPress={() => router.push(`/show/${item.show_id}`)}
                        />
                      </HoverEffect>
                    </View>
                  </View>
                </View>
              </Card>
            </HoverEffect>
          ))}
        </ScrollView>
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            Δεν υπάρχουν ακόμη διαθέσιμες προβολές
          </Text>
          <Text style={styles.emptyCopy}>
            Οι επόμενες ημερομηνίες θα εμφανιστούν εδώ μόλις είναι διαθέσιμες.
          </Text>
        </Card>
      )}

      <View style={styles.sectionRowOnly}>
        <View style={styles.sectionHeadingWrap}>
          <Text style={styles.sectionEyebrow}>Επόμενες επιλογές</Text>
          <Text style={[styles.sectionTitle, isPhone && styles.sectionTitleCompact]}>
            Παραστάσεις που μπορείς να δεις στη συνέχεια
          </Text>
        </View>
      </View>

      {upcoming.length ? (
        <View style={styles.grid}>
          {upcoming.map((item) => (
            <View
              key={item.show_id}
              style={[
                styles.gridItem,
                upcomingColumns === 1
                  ? styles.gridItemSingle
                  : upcomingColumns === 2
                    ? styles.gridItemDouble
                    : styles.gridItemQuarter
              ]}
            >
              <HoverEffect style={styles.gridHoverShell}>
                <Card style={styles.upcomingCard}>
                  <ImageBackground
                    source={{ uri: getShowImage(item) }}
                    imageStyle={styles.categoryImageRadius}
                    style={styles.categoryImage}
                  >
                    <LinearGradient
                      colors={['rgba(5,7,13,0.10)', 'rgba(5,7,13,0.78)']}
                      style={styles.categoryImageOverlay}
                    >
                      <Text style={styles.categoryBadge} numberOfLines={1}>
                        {item.genre}
                      </Text>
                    </LinearGradient>
                  </ImageBackground>

                  <View style={styles.categoryBody}>
                    <View>
                      <Text style={styles.upcomingTitle} numberOfLines={2}>
                        {item.title}
                      </Text>

                      <Text style={styles.upcomingCopy} numberOfLines={2}>
                        {item.subtitle}
                      </Text>
                    </View>

                    <View style={styles.categoryFooter}>
                      <Text style={styles.upcomingPrice}>
                        {formatFromPrice(item)}
                      </Text>

                      <View style={styles.upcomingActions}>
                        <HoverEffect type="button">
                          <Button
                            title="Λεπτομέρειες"
                            variant="secondary"
                            onPress={() => router.push(`/show/${item.show_id}`)}
                          />
                        </HoverEffect>
                      </View>
                    </View>
                  </View>
                </Card>
              </HoverEffect>
            </View>
          ))}
        </View>
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Περισσότερες επιλογές σύντομα</Text>
          <Text style={styles.emptyCopy}>
            Πρόσθεσε περισσότερες παραστάσεις από το admin panel για να γεμίσει
            αυτή η ενότητα.
          </Text>
        </Card>
      )}

      <View style={[styles.sectionRow, !isTablet && styles.sectionRowStack]}>
        <View style={styles.sectionHeadingWrap}>
          <Text style={styles.sectionEyebrow}>Θέατρα</Text>
          <Text style={[styles.sectionTitle, isPhone && styles.sectionTitleCompact]}>
            Χώροι που φιλοξενούν τις επόμενες παραγωγές
          </Text>
        </View>

        <View
          style={[
            styles.sectionButtonWrap,
            !isTablet && styles.sectionButtonWrapFull
          ]}
        >
          <HoverEffect type="button">
            <Button
              title="Όλα τα θέατρα"
              variant="secondary"
              onPress={() => router.push('/theatres')}
            />
          </HoverEffect>
        </View>
      </View>

      {theatreHighlights.length ? (
        <View style={styles.grid}>
          {theatreHighlights.map((item, index) => (
            <View
              key={item.theatre_id}
              style={[
                styles.gridItem,
                theatreColumns === 1
                  ? styles.gridItemSingle
                  : theatreColumns === 2
                    ? styles.gridItemDouble
                    : styles.gridItemQuarter
              ]}
            >
              <HoverEffect style={styles.gridHoverShell}>
                <Card style={styles.theatreCard}>
                  <ImageBackground
                    source={{ uri: getTheatreImage(item, index) }}
                    imageStyle={styles.categoryImageRadius}
                    style={styles.categoryImage}
                  >
                    <LinearGradient
                      colors={['rgba(5,7,13,0.04)', 'rgba(5,7,13,0.80)']}
                      style={styles.categoryImageOverlay}
                    >
                      <Text style={styles.categoryBadge} numberOfLines={1}>
                        {item.location || 'Θέατρο'}
                      </Text>
                    </LinearGradient>
                  </ImageBackground>

                  <View style={styles.theatreCardInner}>
                    <View>
                      <Text style={styles.theatreName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.theatreCopy} numberOfLines={2}>
                        {item.description ||
                          'Θεατρικός χώρος με επιλεγμένες παραστάσεις και σύγχρονη εμπειρία κράτησης.'}
                      </Text>
                    </View>

                    <View style={styles.theatreActionWrap}>
                      <HoverEffect type="button">
                        <Button
                          title="Δες παραστάσεις"
                          variant="secondary"
                          onPress={() => router.push('/movies')}
                        />
                      </HoverEffect>
                    </View>
                  </View>
                </Card>
              </HoverEffect>
            </View>
          ))}
        </View>
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Δεν υπάρχουν ακόμη θέατρα</Text>
          <Text style={styles.emptyCopy}>
            Τα θέατρα που θα δημιουργήσεις από το admin panel θα εμφανιστούν εδώ.
          </Text>
        </Card>
      )}

      <Footer />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardHoverShell: {
    borderRadius: 28
  },

  cardHoverShellActive: {
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12
  },

  featuredCardHoverShell: {
    borderRadius: 28,
    overflow: 'visible',
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0
  },

  featuredCardHoverShellActive: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0
  },

  featuredHoverShell: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    overflow: 'visible'
  },

  featuredHoverShellPhone: {
    width: '100%'
  },

  horizontalHoverShell: {
    borderRadius: 28,
    marginRight: 16
  },

  gridHoverShell: {
    flex: 1,
    borderRadius: 28
  },

  buttonHoverShell: {
    borderRadius: 999,
    shadowColor: theme.colors.gold,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0
  },

  buttonHoverShellActive: {
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 10
  },

  page: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 34
  },

  pagePhone: {
    paddingHorizontal: 14
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },

  infoStrip: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 28
  },

  infoStripPhone: {
    flexDirection: 'column',
    marginBottom: 24
  },

  infoPill: {
    flex: 1,
    minHeight: 82,
    justifyContent: 'center',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    overflow: 'hidden'
  },

  infoPillgold: {
    backgroundColor: 'rgba(232,192,106,0.12)',
    borderColor: 'rgba(232,192,106,0.26)'
  },

  infoPillviolet: {
    backgroundColor: 'rgba(126,97,255,0.14)',
    borderColor: 'rgba(126,97,255,0.30)'
  },

  infoPillblue: {
    backgroundColor: 'rgba(66,153,225,0.12)',
    borderColor: 'rgba(66,153,225,0.28)'
  },

  infoPillLabel: {
    color: theme.colors.gold,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6
  },

  infoPillValue: {
    color: theme.colors.text,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900'
  },

  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 4
  },

  sectionRowOnly: {
    marginBottom: 14,
    marginTop: 4
  },

  sectionRowStack: {
    flexDirection: 'column',
    alignItems: 'flex-start'
  },

  sectionHeadingWrap: {
    flex: 1,
    minWidth: 0
  },

  sectionButtonWrap: {},

  sectionButtonWrapFull: {
    width: '100%'
  },

  sectionEyebrow: {
    alignSelf: 'flex-start',
    color: theme.colors.gold,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
    marginBottom: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(232,192,106,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232,192,106,0.22)'
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

  loaderSpacing: {
    marginVertical: 20
  },

  featuredRail: {
    flexGrow: 0,
    height: 470,
    marginBottom: 32,
    overflow: 'visible'
  },

  featuredRailPhone: {
    height: 440
  },

  horizontalRow: {
    paddingVertical: 8,
    paddingRight: 18,
    alignItems: 'flex-start'
  },

  featuredCardSlot: {
    width: 340,
    height: '100%',
    flexShrink: 0,
    marginRight: 16,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    overflow: 'visible'
  },

  featuredCardSlotPhone: {
    width: 290
  },

  showtimeRail: {
    flexGrow: 0,
    marginBottom: 34
  },

  showtimeRow: {
    paddingVertical: 8,
    paddingRight: 6,
    alignItems: 'flex-start'
  },

  showtimeCard: {
    width: 330,
    height: 450,
    flexShrink: 0,
    marginRight: 0,
    marginBottom: 0,
    padding: 0,
    overflow: 'hidden',
    backgroundColor: 'rgba(12,18,31,0.96)',
    borderColor: 'rgba(232,192,106,0.16)'
  },

  showtimeCardPhone: {
    width: 294,
    height: 450
  },

  showtimeImage: {
    height: 150,
    justifyContent: 'flex-end',
    overflow: 'hidden'
  },

  showtimeImageRadius: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28
  },

  showtimeImageOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14
  },

  showtimeTopRow: {
    gap: 8
  },

  showtimeImageBadge: {
    alignSelf: 'flex-start',
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(8,12,18,0.74)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)'
  },

  showtimeDateBadgeText: {
    alignSelf: 'flex-start',
    color: theme.colors.gold,
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(8,12,18,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(232,192,106,0.20)'
  },

  showtimeBody: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between'
  },

  showtimeTitle: {
    color: theme.colors.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    marginBottom: 10
  },

  showtimeMeta: {
    color: theme.colors.muted,
    lineHeight: 22,
    marginBottom: 4
  },

  showtimeFooter: {
    marginTop: 14
  },

  showtimePrice: {
    color: theme.colors.gold,
    fontSize: 18,
    fontWeight: '900'
  },

  showtimeActions: {
    marginTop: 14
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 34,
    alignItems: 'stretch'
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

  gridItemQuarter: {
    width: '25%'
  },

  upcomingCard: {
    height: 430,
    padding: 0,
    overflow: 'hidden',
    backgroundColor: 'rgba(12,18,31,0.96)',
    borderColor: 'rgba(232,192,106,0.14)'
  },

  categoryImage: {
    height: 158,
    justifyContent: 'flex-end',
    overflow: 'hidden'
  },

  categoryImageRadius: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28
  },

  categoryImageOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14
  },

  categoryBadge: {
    alignSelf: 'flex-start',
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(8,12,18,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)'
  },

  categoryBody: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between'
  },

  categoryFooter: {
    marginTop: 14
  },

  upcomingTitle: {
    color: theme.colors.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    marginBottom: 8
  },

  upcomingCopy: {
    color: theme.colors.muted,
    lineHeight: 21
  },

  upcomingPrice: {
    color: theme.colors.gold,
    fontSize: 18,
    fontWeight: '900'
  },

  upcomingActions: {
    marginTop: 14
  },

  theatreCard: {
    height: 430,
    padding: 0,
    overflow: 'hidden',
    backgroundColor: 'rgba(12,18,31,0.96)',
    borderColor: 'rgba(126,97,255,0.20)'
  },

  theatreCardInner: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between'
  },

  theatreName: {
    color: theme.colors.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    marginBottom: 8
  },

  theatreCopy: {
    color: theme.colors.muted,
    lineHeight: 21
  },

  theatreActionWrap: {
    marginTop: 16
  },

  emptyCard: {
    marginBottom: 24,
    backgroundColor: 'rgba(12,18,31,0.94)',
    borderColor: 'rgba(232,192,106,0.13)'
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
  },

  emptyAction: {
    marginTop: 16
  },

  actionGap: {
    height: 10
  }
});
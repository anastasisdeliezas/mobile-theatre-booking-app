import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  ImageBackground,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native';
import api from '../../src/api/client';
import Button from '../../src/components/Button';
import ShowReviews from '../../src/components/ShowReviews';
import Screen from '../../src/components/Screen';
import Card from '../../src/components/Card';
import TopNav from '../../src/components/TopNav';
import Footer from '../../src/components/Footer';
import { theme } from '../../src/constants/theme';
import { resolveMediaUrl } from '../../src/utils/media';

const fallbackHero =
  'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1600&q=80';

const fallbackPoster =
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80';

function formatDate(value) {
  try {
    return new Date(value).toLocaleString('el-GR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  } catch {
    return value || '';
  }
}

function toEmbedUrl(url) {
  if (!url) return null;
  if (url.includes('youtube.com/embed/')) return url;

  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch?.[1]) return `https://www.youtube.com/embed/${watchMatch[1]}`;

  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch?.[1]) return `https://www.youtube.com/embed/${shortMatch[1]}`;

  return null;
}

function toTrailerThumbnail(url, fallback) {
  if (!url) return fallback;

  const watchMatch = url.match(/[?&]v=([^&]+)/);
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  const videoId = watchMatch?.[1] || shortMatch?.[1];

  if (videoId) return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  return fallback;
}

function normalizeText(value) {
  if (!value) return '';
  return String(value).trim();
}

function normalizeList(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (!item) return '';
        if (typeof item === 'string') return item.trim();
        if (typeof item === 'object') {
          const name = item.name || item.title || item.label || '';
          const role = item.role || item.job || item.character || '';

          if (name && role) return `${name} — ${role}`;
          return name || role;
        }
        return String(item);
      })
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
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
      } else if (type === 'media') {
        nextScale = 1.012;
        nextLift = -4;
      } else if (type === 'showtime') {
        nextScale = 1.006;
        nextLift = -2;
      } else if (type === 'panel') {
        nextScale = 1.004;
        nextLift = -2;
      } else {
        nextScale = 1.01;
        nextLift = -3;
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
      : type === 'media'
        ? styles.mediaHoverShell
        : type === 'showtime'
          ? styles.showtimeHoverShell
          : type === 'panel'
            ? styles.panelHoverShell
            : styles.cardHoverShell;

  const activeStyle =
    type === 'button'
      ? styles.buttonHoverShellActive
      : type === 'media'
        ? styles.mediaHoverShellActive
        : type === 'showtime'
          ? styles.showtimeHoverShellActive
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

function MetaPill({ label, value }) {
  return (
    <View style={styles.metaPill}>
      <Text style={styles.metaPillLabel}>{label}</Text>
      <Text style={styles.metaPillValue}>{value}</Text>
    </View>
  );
}

function ListSection({ title, items, compact = false }) {
  if (!Array.isArray(items) || !items.length) return null;

  return (
    <Card style={styles.softCard}>
      <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>
        {title}
      </Text>
      <View style={styles.listWrap}>
        {items.map((item, index) => (
          <View key={`${title}-${index}`} style={styles.listItem}>
            <Text style={styles.listBullet}>•</Text>
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

async function fetchShowtimesForShow(showId) {
  const candidates = [
    () => api.get('/shows/meta/showtimes', { params: { showId } }),
    () => api.get(`/showtimes/${showId}`),
    () => api.get(`/shows/${showId}/showtimes`)
  ];

  for (const request of candidates) {
    try {
      const res = await request();
      if (Array.isArray(res?.data)) return res.data;
    } catch {
      // try next
    }
  }

  return [];
}

export default function ShowDetails() {
  const { id } = useLocalSearchParams();
  const [show, setShow] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);

  const { width } = useWindowDimensions();

  const isPhone = width < 560;
  const isWideDesktop = width >= 1180;
  const isCompact = width < 1020;

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const showRes = await api.get(`/shows/${id}`);
        if (!active) return;
        setShow(showRes?.data || null);

        const showtimesData = await fetchShowtimesForShow(id);
        if (!active) return;
        setShowtimes(showtimesData);
      } catch (error) {
        console.log(
          'Show load error:',
          error?.response?.status,
          error?.response?.data,
          error?.message
        );
        if (active) {
          setShow(null);
          setShowtimes([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [id]);

  const heroImage = useMemo(
    () => resolveMediaUrl(show?.hero_image_url || fallbackHero),
    [show]
  );

  const posterImage = useMemo(
    () => resolveMediaUrl(show?.poster_url || fallbackPoster),
    [show]
  );

  const trailerEmbedUrl = useMemo(() => toEmbedUrl(show?.trailer_url), [show]);

  const trailerThumb = useMemo(
    () => toTrailerThumbnail(show?.trailer_url, heroImage),
    [show, heroImage]
  );

  const overviewText = useMemo(
    () => normalizeText(show?.overview_text || show?.overview || show?.details_overview),
    [show]
  );

  const castItems = useMemo(
    () => normalizeList(show?.cast_text || show?.cast || show?.actors || show?.performers),
    [show]
  );

  const creativeItems = useMemo(
    () =>
      normalizeList(
        show?.creatives_text ||
          show?.creatives ||
          show?.production_team ||
          show?.contributors ||
          show?.crew
      ),
    [show]
  );

  const highlightItems = useMemo(
    () =>
      normalizeList(
        show?.highlights_text ||
          show?.highlights ||
          show?.why_watch ||
          show?.reasons_to_watch
      ),
    [show]
  );

  const audienceText = useMemo(
    () => normalizeText(show?.audience_text || show?.audience),
    [show]
  );

  const contentWarningItems = useMemo(
    () =>
      normalizeList(
        show?.content_warnings_text ||
          show?.contentWarnings ||
          show?.content_warnings
      ),
    [show]
  );

  const openTrailer = async () => {
    if (!show?.trailer_url) return;
    try {
      await Linking.openURL(show.trailer_url);
    } catch {}
  };

  const goBack = () => router.replace('/movies');

  const goBooking = (showtimeId) => {
    if (!showtimeId) return;
    router.push(`/booking/${showtimeId}?showTitle=${encodeURIComponent(show?.title || '')}`);
  };

  if (loading) {
    return (
      <Screen>
        <TopNav />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.gold} />
        </View>
        <Footer />
      </Screen>
    );
  }

  if (!show) {
    return (
      <Screen scroll contentStyle={styles.page}>
        <TopNav />
        <Card style={styles.softCard}>
          <Text style={styles.errorTitle}>Η παράσταση δεν είναι διαθέσιμη.</Text>
          <HoverEffect type="button">
            <Button title="Επιστροφή" variant="secondary" onPress={goBack} />
          </HoverEffect>
        </Card>
        <Footer />
      </Screen>
    );
  }

  return (
    <Screen scroll contentStyle={[styles.page, isPhone && styles.pagePhone]}>
      <TopNav />

      <View style={styles.heroShell}>
        <View style={[styles.hero, isCompact && styles.heroCompact]}>
          {isCompact ? (
            <View style={styles.mobileHeroInner}>
              <Image
                source={{ uri: posterImage }}
                style={[styles.mobilePoster, isPhone && styles.mobilePosterPhone]}
              />

              <View style={styles.mobileInfoCard}>
                <Text style={styles.kicker}>{show.theatre_name || 'Παράσταση'}</Text>
                <Text
                  style={[
                    styles.title,
                    styles.titleCompact,
                    isPhone && styles.titlePhone
                  ]}
                >
                  {show.title}
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    styles.subtitleCompact,
                    isPhone && styles.subtitlePhone
                  ]}
                >
                  {show.description ||
                    'Μια ολοκληρωμένη εμπειρία θεατρικής κράτησης με πληροφορίες και άμεση επιλογή θέσεων.'}
                </Text>

                <View style={styles.heroMetaRow}>
                  <MetaPill label="Είδος" value={show.genre || 'Παράσταση'} />
                  <MetaPill
                    label="Διάρκεια"
                    value={`${show.duration_minutes || 120} λεπτά`}
                  />
                  <MetaPill label="Καταλληλότητα" value={show.age_rating || '12+'} />
                  <MetaPill
                    label="Τοποθεσία"
                    value={show.location || 'Θεατρικός χώρος'}
                  />
                </View>

                <View style={styles.mobileActions}>
                  {showtimes[0] ? (
                    <HoverEffect type="button" style={styles.fullWidthButtonHover}>
                      <Button
                        title="Κλείσε εισιτήριο"
                        onPress={() =>
                          goBooking(showtimes[0].showtime_id || showtimes[0].id)
                        }
                        style={styles.fullWidthButton}
                      />
                    </HoverEffect>
                  ) : null}

                  {show?.trailer_url ? (
                    <HoverEffect type="button" style={styles.fullWidthButtonHover}>
                      <Button
                        title="Trailer"
                        variant="secondary"
                        onPress={openTrailer}
                        style={styles.fullWidthButton}
                      />
                    </HoverEffect>
                  ) : null}

                  <HoverEffect type="button" style={styles.fullWidthButtonHover}>
                    <Button
                      title="Πίσω"
                      variant="dark"
                      onPress={goBack}
                      style={styles.fullWidthButton}
                    />
                  </HoverEffect>
                </View>
              </View>

              {show?.trailer_url ? (
                <Pressable
                  onPress={openTrailer}
                  style={({ hovered, pressed }) => [
                    styles.mobileTrailerCard,
                    hovered && styles.mobileTrailerCardHover,
                    pressed && styles.mobileTrailerCardPressed
                  ]}
                >
                  <ImageBackground
                    source={{ uri: trailerThumb }}
                    imageStyle={styles.mobileTrailerImage}
                    style={styles.mobileTrailerImageWrap}
                  >
                    <View style={styles.mobileTrailerOverlay} />
                    <View style={styles.mobileTrailerPlay}>
                      <Text style={styles.mobileTrailerPlayText}>▶</Text>
                    </View>
                    <View style={styles.mobileTrailerLabelWrap}>
                      <Text style={styles.mobileTrailerEyebrow}>Trailer</Text>
                      <Text style={styles.mobileTrailerTitle}>
                        Δες preview της παράστασης
                      </Text>
                    </View>
                  </ImageBackground>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View style={styles.webHeroRow}>
              <View style={styles.webHeroInfo}>
                <Text style={styles.kicker}>{show.theatre_name || 'Παράσταση'}</Text>
                <Text
                  style={[
                    styles.title,
                    !isWideDesktop && styles.titleDesktopCompact
                  ]}
                >
                  {show.title}
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    !isWideDesktop && styles.subtitleDesktopCompact
                  ]}
                >
                  {show.description ||
                    'Μια ολοκληρωμένη εμπειρία θεατρικής κράτησης με πληροφορίες και άμεση επιλογή θέσεων.'}
                </Text>

                <View style={styles.heroMetaRow}>
                  <MetaPill label="Είδος" value={show.genre || 'Παράσταση'} />
                  <MetaPill
                    label="Διάρκεια"
                    value={`${show.duration_minutes || 120} λεπτά`}
                  />
                  <MetaPill label="Καταλληλότητα" value={show.age_rating || '12+'} />
                  <MetaPill
                    label="Τοποθεσία"
                    value={show.location || 'Θεατρικός χώρος'}
                  />
                </View>

                <View style={styles.heroActions}>
                  {showtimes[0] ? (
                    <HoverEffect type="button">
                      <Button
                        title="Κλείσε εισιτήριο"
                        onPress={() =>
                          goBooking(showtimes[0].showtime_id || showtimes[0].id)
                        }
                      />
                    </HoverEffect>
                  ) : null}

                  {show?.trailer_url ? (
                    <HoverEffect type="button">
                      <Button title="Trailer" variant="secondary" onPress={openTrailer} />
                    </HoverEffect>
                  ) : null}

                  <HoverEffect type="button">
                    <Button title="Πίσω" variant="dark" onPress={goBack} />
                  </HoverEffect>
                </View>
              </View>

              <View style={styles.webHeroMedia}>
                {trailerEmbedUrl ? (
                  <View style={styles.trailerFrameShell}>
                    <iframe
                      src={trailerEmbedUrl}
                      title={`${show.title} trailer`}
                      style={styles.trailerFrame}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </View>
                ) : (
                  <Image source={{ uri: heroImage }} style={styles.heroFallbackImage} />
                )}
              </View>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.detailsLayout, isCompact && styles.detailsLayoutCompact]}>
        {!isCompact ? (
          <HoverEffect
            type="media"
            style={[styles.posterHoverWrap, !isWideDesktop && styles.posterHoverWrapCompact]}
          >
            <Card style={styles.posterCard}>
              <Image source={{ uri: posterImage }} style={styles.poster} />
            </Card>
          </HoverEffect>
        ) : null}

        <View style={styles.mainInfoCol}>
          <Card style={styles.softCard}>
            <Text style={[styles.sectionTitle, isPhone && styles.sectionTitleCompact]}>
              Σύνοψη
            </Text>
            <Text style={styles.sectionCopy}>
              {show.description ||
                'Η συγκεκριμένη παράσταση προσφέρει μια ολοκληρωμένη εμπειρία κράτησης με μοντέρνο booking flow, δυναμικό visual περιβάλλον και άμεση πρόσβαση στις διαθέσιμες ώρες.'}
            </Text>
          </Card>

          {overviewText ? (
            <Card style={styles.softCard}>
              <Text style={[styles.sectionTitle, isPhone && styles.sectionTitleCompact]}>
                Τι θα δεις στην παράσταση
              </Text>
              <Text style={styles.sectionCopy}>{overviewText}</Text>
            </Card>
          ) : null}

          {castItems.length > 0 || creativeItems.length > 0 ? (
            <View style={[styles.dualGrid, isCompact && styles.dualGridCompact]}>
              {castItems.length > 0 ? (
                <View style={styles.dualItem}>
                  <ListSection
                    title="Ηθοποιοί & ρόλοι"
                    items={castItems}
                    compact={isPhone}
                  />
                </View>
              ) : null}

              {creativeItems.length > 0 ? (
                <View style={styles.dualItem}>
                  <ListSection
                    title="Συντελεστές παραγωγής"
                    items={creativeItems}
                    compact={isPhone}
                  />
                </View>
              ) : null}
            </View>
          ) : null}

          {highlightItems.length > 0 ? (
            <ListSection
              title="Γιατί να τη δεις"
              items={highlightItems}
              compact={isPhone}
            />
          ) : null}

          <Card style={styles.softCard}>
            <Text style={[styles.sectionTitle, isPhone && styles.sectionTitleCompact]}>
              Διαθέσιμες ημερομηνίες & ώρες
            </Text>

            <View style={styles.showtimesGrid}>
              {showtimes.length ? (
                showtimes.map((item, idx) => {
                  const showtimeId = item.showtime_id || item.id;

                  return (
                    <HoverEffect
                      key={showtimeId || idx}
                      type="showtime"
                      style={styles.showtimeHoverWrap}
                    >
                      <View
                        style={[
                          styles.showtimeCard,
                          isCompact && styles.showtimeCardCompact
                        ]}
                      >
                        <View style={styles.showtimeInfo}>
                          <Text style={styles.showtimeDate}>
                            {formatDate(item.start_time)}
                          </Text>
                          <Text style={styles.showtimeMeta}>
                            {item.hall_name || 'Αίθουσα'} · Από €
                            {item.base_price || item.price || 0}
                          </Text>
                          <Text style={styles.showtimeStatus}>
                            Live διαθεσιμότητα θέσεων
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.showtimeAction,
                            isCompact && styles.showtimeActionCompact
                          ]}
                        >
                          <HoverEffect
                            type="button"
                            style={isCompact ? styles.fullWidthButtonHover : null}
                          >
                            <Button
                              title="Επιλογή θέσεων"
                              onPress={() => goBooking(showtimeId)}
                              style={isCompact ? styles.fullWidthButton : null}
                            />
                          </HoverEffect>
                        </View>
                      </View>
                    </HoverEffect>
                  );
                })
              ) : (
                <Text style={styles.sectionCopy}>
                  Δεν υπάρχουν διαθέσιμες ημερομηνίες αυτή τη στιγμή.
                </Text>
              )}
            </View>
          </Card>

          <ShowReviews showId={show?.show_id || Number(id)} />

          {audienceText || contentWarningItems.length > 0 ? (
            <Card style={styles.softCard}>
              <Text style={[styles.sectionTitle, isPhone && styles.sectionTitleCompact]}>
                Χρήσιμες πληροφορίες
              </Text>

              {audienceText ? (
                <Text style={[styles.sectionCopy, styles.infoSpacing]}>
                  {audienceText}
                </Text>
              ) : null}

              {contentWarningItems.length > 0 ? (
                <View style={styles.tagWrap}>
                  {contentWarningItems.map((item, index) => (
                    <View key={`${item}-${index}`} style={styles.infoTag}>
                      <Text style={styles.infoTagText}>{item}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>
          ) : null}
        </View>
      </View>

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
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 9
  },

  panelHoverShell: {
    borderRadius: 24,
    overflow: 'visible'
  },

  panelHoverShellActive: {
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7
  },

  mediaHoverShell: {
    borderRadius: 24,
    overflow: 'visible'
  },

  mediaHoverShellActive: {
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.24,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12
  },

  showtimeHoverShell: {
    borderRadius: 22,
    overflow: 'visible'
  },

  showtimeHoverShellActive: {
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8
  },

  buttonHoverShell: {
    borderRadius: 999,
    overflow: 'visible'
  },

  buttonHoverShellActive: {
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 10
  },

  posterHoverWrap: {
    width: 300
  },

  posterHoverWrapCompact: {
    width: 270
  },

  showtimeHoverWrap: {
    width: '100%'
  },

  fullWidthButtonHover: {
    width: '100%'
  },

  softCard: {
    borderWidth: 1,
    borderColor: 'rgba(232,192,106,0.10)',
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 },
    elevation: 5
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
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center'
  },

  errorTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 12
  },

  heroShell: {
    marginBottom: 18,
    borderRadius: 28,
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.1,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 18 },
    elevation: 10
  },

  hero: {
    minHeight: 520,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: '#050b16',
    borderWidth: 1,
    borderColor: 'rgba(232,192,106,0.14)'
  },

  heroCompact: {
    minHeight: 0
  },

  webHeroRow: {
    flexDirection: 'row',
    minHeight: 520,
    alignItems: 'stretch',
    overflow: 'hidden',
    borderRadius: 28
  },

  webHeroInfo: {
    flex: 1,
    maxWidth: 760,
    padding: 30,
    justifyContent: 'center',
    backgroundColor: 'rgba(4,12,28,0.92)'
  },

  webHeroMedia: {
    flex: 1.05,
    justifyContent: 'stretch',
    alignItems: 'stretch',
    backgroundColor: 'rgba(3,8,16,0.96)'
  },

  heroFallbackImage: {
    width: '100%',
    height: '100%',
    minHeight: 520,
    resizeMode: 'cover'
  },

  trailerFrameShell: {
    width: '100%',
    height: '100%',
    minHeight: 520,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8
  },

  trailerFrame: {
    width: '100%',
    height: '100%',
    border: '0px'
  },

  mobileHeroInner: {
    padding: 0
  },

  mobilePoster: {
    width: '100%',
    height: 240,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    resizeMode: 'cover'
  },

  mobilePosterPhone: {
    height: 220
  },

  mobileInfoCard: {
    padding: 16,
    backgroundColor: 'rgba(4,12,28,0.94)'
  },

  mobileActions: {
    marginTop: 18,
    gap: 10
  },

  mobileTrailerCard: {
    marginTop: 12,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },

  mobileTrailerCardHover: {
    borderColor: 'rgba(232,192,106,0.28)',
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8
  },

  mobileTrailerCardPressed: {
    opacity: 0.9
  },

  mobileTrailerImageWrap: {
    minHeight: 190,
    justifyContent: 'space-between'
  },

  mobileTrailerImage: {
    borderRadius: 22
  },

  mobileTrailerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,10,18,0.42)'
  },

  mobileTrailerPlay: {
    alignSelf: 'flex-end',
    marginTop: 14,
    marginRight: 14,
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)'
  },

  mobileTrailerPlayText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginLeft: 3
  },

  mobileTrailerLabelWrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 10
  },

  mobileTrailerEyebrow: {
    color: theme.colors.gold,
    fontWeight: '800',
    marginBottom: 4
  },

  mobileTrailerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900'
  },

  kicker: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.goldSoft,
    color: theme.colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
    fontWeight: '800',
    marginBottom: 12
  },

  title: {
    color: '#fff',
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '900',
    maxWidth: 760
  },

  titleCompact: {
    fontSize: 28,
    lineHeight: 34
  },

  titleDesktopCompact: {
    fontSize: 34,
    lineHeight: 40
  },

  titlePhone: {
    fontSize: 24,
    lineHeight: 30
  },

  subtitle: {
    color: 'rgba(255,255,255,0.88)',
    marginTop: 12,
    lineHeight: 24,
    maxWidth: 820,
    fontSize: 16
  },

  subtitleCompact: {
    fontSize: 14,
    lineHeight: 22
  },

  subtitleDesktopCompact: {
    fontSize: 15,
    lineHeight: 23
  },

  subtitlePhone: {
    fontSize: 14,
    lineHeight: 21
  },

  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
    marginBottom: 4
  },

  metaPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(7,15,28,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    minWidth: 120,
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3
  },

  metaPillLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    marginBottom: 4
  },

  metaPillValue: {
    color: '#fff',
    fontWeight: '800'
  },

  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 20,
    alignItems: 'center'
  },

  fullWidthButton: {
    width: '100%'
  },

  detailsLayout: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start'
  },

  detailsLayoutCompact: {
    flexDirection: 'column'
  },

  posterCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(232,192,106,0.14)'
  },

  poster: {
    width: '100%',
    height: 420,
    borderRadius: 20,
    resizeMode: 'cover'
  },

  mainInfoCol: {
    flex: 1,
    gap: 14,
    width: '100%'
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 10
  },

  sectionTitleCompact: {
    fontSize: 20,
    lineHeight: 26
  },

  sectionCopy: {
    color: theme.colors.muted,
    lineHeight: 24
  },

  dualGrid: {
    flexDirection: 'row',
    gap: 16
  },

  dualGridCompact: {
    flexDirection: 'column'
  },

  dualItem: {
    flex: 1
  },

  listWrap: {
    gap: 10
  },

  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8
  },

  listBullet: {
    color: theme.colors.gold,
    fontWeight: '900',
    lineHeight: 22
  },

  listText: {
    flex: 1,
    color: theme.colors.muted,
    lineHeight: 22
  },

  showtimesGrid: {
    gap: 14
  },

  showtimeCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.025)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    alignItems: 'center'
  },

  showtimeCardCompact: {
    flexDirection: 'column',
    alignItems: 'stretch'
  },

  showtimeInfo: {
    flex: 1
  },

  showtimeAction: {
    minWidth: 180
  },

  showtimeActionCompact: {
    minWidth: 0
  },

  showtimeDate: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '900'
  },

  showtimeMeta: {
    color: theme.colors.muted,
    marginTop: 8
  },

  showtimeStatus: {
    color: theme.colors.gold,
    marginTop: 12,
    fontWeight: '800'
  },

  infoSpacing: {
    marginBottom: 12
  },

  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },

  infoTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.goldSoft,
    borderWidth: 1,
    borderColor: 'rgba(232,192,106,0.18)',
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },

  infoTagText: {
    color: theme.colors.gold,
    fontWeight: '800',
    fontSize: 12
  }
});
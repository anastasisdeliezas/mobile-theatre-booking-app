import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native';
import { theme } from '../constants/theme';
import { resolveMediaUrl } from '../utils/media';

export default function HeroCarousel({ items = [], onBook, onDetails }) {
  const { width } = useWindowDimensions();
  const isMobile = Platform.OS !== 'web';
  const slideWidth = isMobile ? Math.max(width - 28, 280) : Math.min(width - 36, 1040);
  const slideHeight = isMobile ? 290 : 430;

  const fallback = useMemo(
    () =>
      items.length
        ? items
        : [
            {
              title: 'Άμλετ',
              subtitle: 'Μια σύγχρονη θεατρική εμπειρία κράτησης με ατμόσφαιρα πρεμιέρας.',
              image:
                'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1600&q=80'
            },
            {
              title: 'Μήδεια',
              subtitle:
                'Βρες παραστάσεις, διάλεξε θέσεις και κράτησε το εισιτήριό σου μέσα σε λίγα βήματα.',
              image:
                'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80'
            },
            {
              title: 'Ο Γυάλινος Κόσμος',
              subtitle:
                'Το QR εισιτήριο και η απόδειξη στο email ολοκληρώνουν την εμπειρία κράτησης.',
              image:
                'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1600&q=80'
            }
          ],
    [items]
  );

  const ref = useRef(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (fallback.length <= 1) return;

    const id = setInterval(() => {
      const next = (index + 1) % fallback.length;
      ref.current?.scrollTo({ x: next * slideWidth, animated: true });
      setIndex(next);
    }, 4800);

    return () => clearInterval(id);
  }, [fallback.length, index, slideWidth]);

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        pagingEnabled
        snapToInterval={slideWidth + 14}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        ref={ref}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / slideWidth))}
      >
        {fallback.map((item, idx) => (
          <ImageBackground
            key={idx}
            source={{ uri: resolveMediaUrl(item.image || item.hero_image_url || item.poster_url) }}
            imageStyle={[styles.image, { borderRadius: isMobile ? 22 : 30 }]}
            style={[styles.slide, { width: slideWidth, height: slideHeight }]}
          >
            <View style={[styles.overlay, { borderRadius: isMobile ? 22 : 30, padding: isMobile ? 16 : 26 }]}>
              <View style={styles.topPills}>
                <Text style={styles.kicker}>Νέα παράσταση</Text>
                <Text style={styles.meta}>{item.genre || 'Θεατρική εμπειρία'}</Text>
              </View>

              <View style={styles.body}>
                <Text numberOfLines={isMobile ? 2 : 3} style={[styles.title, { fontSize: isMobile ? 26 : 42, lineHeight: isMobile ? 30 : 46 }]}>
                  {item.title}
                </Text>

                <Text numberOfLines={isMobile ? 3 : 4} style={[styles.subtitle, { lineHeight: isMobile ? 21 : 25, fontSize: isMobile ? 14 : 16 }]}>
                  {item.subtitle || item.description}
                </Text>

                <View style={styles.actions}>
                  <Pressable
                    style={({ hovered, pressed }) => [
                      styles.primary,
                      hovered && styles.primaryHover,
                      pressed && styles.buttonPressed
                    ]}
                    onPress={() => onBook?.(item)}
                  >
                    <Text style={styles.primaryText}>Κλείσε τώρα</Text>
                  </Pressable>

                  <Pressable
                    style={({ hovered, pressed }) => [
                      styles.secondary,
                      hovered && styles.secondaryHover,
                      pressed && styles.buttonPressed
                    ]}
                    onPress={() => onDetails?.(item)}
                  >
                    <Text style={styles.secondaryText}>Λεπτομέρειες</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </ImageBackground>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {fallback.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  slide: {
    marginRight: 14,
    justifyContent: 'flex-end',
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.10,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 8
  },
  image: {},
  overlay: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(4,8,16,0.30)'
  },
  topPills: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    flexWrap: 'wrap'
  },
  kicker: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.goldSoft,
    color: theme.colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    fontWeight: '800',
    overflow: 'hidden',
    fontSize: 12
  },
  meta: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(8,12,18,0.58)',
    color: '#fff',
    overflow: 'hidden',
    fontSize: 12
  },
  body: { maxWidth: 700 },
  title: { color: '#fff', fontWeight: '900' },
  subtitle: {
    color: 'rgba(255,255,255,0.86)',
    marginTop: 10
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16, flexWrap: 'wrap' },
  primary: {
    backgroundColor: theme.colors.gold,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(232,192,106,0.48)',
    transform: [{ translateY: 0 }, { scale: 1 }],
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 10px 20px rgba(232,192,106,0.26)', transitionDuration: '160ms' }
      : { shadowColor: theme.colors.gold, shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 5 })
  },
  primaryHover: {
    transform: [{ translateY: -2 }, { scale: 1.02 }],
    ...(Platform.OS === 'web' ? { boxShadow: '0px 14px 26px rgba(232,192,106,0.34)' } : { elevation: 9 })
  },
  primaryText: { color: theme.colors.darkText, fontWeight: '900', fontSize: 13 },
  secondary: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(11,15,25,0.28)',
    transform: [{ translateY: 0 }, { scale: 1 }]
  },
  secondaryHover: {
    borderColor: 'rgba(232,192,106,0.44)',
    backgroundColor: 'rgba(232,192,106,0.12)',
    transform: [{ translateY: -2 }, { scale: 1.02 }]
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ translateY: 0 }, { scale: 0.98 }]
  },
  secondaryText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 12 },
  dot: { width: 8, height: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive: { width: 26, backgroundColor: theme.colors.gold }
});

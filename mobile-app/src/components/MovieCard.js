import React from 'react';
import {
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native';
import { theme } from '../constants/theme';
import { resolveMediaUrl } from '../utils/media';

const isWeb = Platform.OS === 'web';

function formatPrice(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num) || num <= 0) return '12.90€';
  return `${num.toFixed(2)}€`;
}

export default function MovieCard({ item, onPress, compact = false, featured = false }) {
  const { width } = useWindowDimensions();

  const isPhone = width < 560;
  const isTablet = width >= 560 && width < 980;
  const isDesktop = width >= 980;

  const price = formatPrice(item.ticket_price || item.price);
  const theatre = item.theatre_name || 'Κεντρική Σκηνή';
  const duration =
    item.duration || (item.duration_minutes ? `${item.duration_minutes} λεπτά` : '120 λεπτά');
  const ageRating = item.age_rating || '13+';

  const radius = featured ? (isPhone ? 22 : 28) : compact ? (isPhone ? 20 : 24) : isPhone ? 22 : 28;
  const posterHeight = featured ? (isPhone ? 350 : 440) : compact ? (isPhone ? 290 : 330) : isPhone ? 320 : 380;

  const cardWidth = featured || compact
    ? '100%'
    : isDesktop
      ? 296
      : isTablet
        ? 280
        : 252;

  return (
    <Pressable
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.card,
        {
          width: cardWidth,
          marginRight: featured || compact ? 0 : 16
        },
        hovered && styles.cardHover,
        pressed && styles.cardPressed
      ]}
    >
      <ImageBackground
        source={{ uri: resolveMediaUrl(item.poster_url || item.image) }}
        imageStyle={{ borderRadius: radius }}
        style={[styles.poster, { height: posterHeight, borderRadius: radius }]}
      >
        <View style={[styles.tint, { borderRadius: radius }]} />
        <View
          style={[
            styles.bottomGlow,
            {
              borderBottomLeftRadius: radius,
              borderBottomRightRadius: radius
            }
          ]}
        />

        <View style={[styles.topRow, { padding: isPhone ? 14 : 18 }]}>
          <Text
            style={[
              styles.badge,
              {
                paddingHorizontal: isPhone ? 10 : 12,
                paddingVertical: isPhone ? 7 : 8,
                fontSize: isPhone ? 12 : 13
              }
            ]}
            numberOfLines={1}
          >
            {item.genre || 'Παράσταση'}
          </Text>

          <View style={styles.priceBadge}>
            <Text style={styles.priceLabel}>Από</Text>
            <Text style={styles.priceValue}>{price}</Text>
          </View>
        </View>

        <View style={[styles.metaBottom, { padding: isPhone ? 14 : 18 }]}>
          <View style={styles.metaChips}>
            <Text style={styles.metaChip} numberOfLines={1}>
              {theatre}
            </Text>
            <Text style={styles.metaChip}>{duration}</Text>
            <Text style={styles.metaChip}>{ageRating}</Text>
          </View>

          <Text
            style={[
              styles.title,
              {
                fontSize: featured ? (isPhone ? 24 : 30) : isPhone ? 22 : 26,
                lineHeight: featured ? (isPhone ? 28 : 34) : isPhone ? 26 : 30
              }
            ]}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          <Text
            style={[
              styles.copy,
              {
                lineHeight: isPhone ? 19 : 21,
                fontSize: isPhone ? 13 : 14
              }
            ]}
            numberOfLines={2}
          >
            {item.shortDescription ||
              item.description ||
              item.location ||
              'Κάνε κράτηση θέσεων εύκολα και γρήγορα για την επόμενη παράστασή σου.'}
          </Text>

          <View style={[styles.footer, { marginTop: isPhone ? 14 : 16 }]}>
            <Text style={[styles.footerText, { fontSize: isPhone ? 13 : 14 }]}>
              Κράτηση τώρα
            </Text>
            <Text style={[styles.footerArrow, { fontSize: isPhone ? 16 : 18 }]}>→</Text>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexShrink: 0,
    borderRadius: 28,
    transform: [{ translateY: 0 }, { scale: 1 }],
    ...(isWeb
      ? {
          transitionDuration: '170ms',
          boxShadow: '0px 14px 28px rgba(0,0,0,0.26)'
        }
      : {
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
          elevation: 6
        })
  },

  cardHover: {
    transform: [{ translateY: -5 }, { scale: 1.014 }],
    ...(isWeb
      ? {
          boxShadow: '0px 20px 38px rgba(0,0,0,0.34), 0px 0px 28px rgba(232,192,106,0.16)'
        }
      : {
          shadowColor: theme.colors.gold,
          shadowOpacity: 0.22,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 13 },
          elevation: 11
        })
  },

  cardPressed: {
    opacity: 0.9,
    transform: [{ translateY: -1 }, { scale: 0.992 }]
  },

  poster: {
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },

  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4,8,14,0.34)'
  },

  bottomGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '58%',
    backgroundColor: 'rgba(4,8,14,0.72)'
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10
  },

  metaBottom: {
    minWidth: 0
  },

  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: 'rgba(8,12,18,0.68)',
    color: theme.colors.gold,
    fontWeight: '800',
    overflow: 'hidden',
    maxWidth: '58%'
  },

  priceBadge: {
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(8,12,18,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },

  priceLabel: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 11,
    fontWeight: '700'
  },

  priceValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900'
  },

  metaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },

  metaChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden'
  },

  title: {
    color: '#fff',
    fontWeight: '900',
    marginBottom: 8
  },

  copy: {
    color: 'rgba(255,255,255,0.84)'
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.10)',
    paddingTop: 12
  },

  footerText: {
    color: '#fff',
    fontWeight: '800'
  },

  footerArrow: {
    color: theme.colors.gold,
    fontWeight: '900'
  }
});
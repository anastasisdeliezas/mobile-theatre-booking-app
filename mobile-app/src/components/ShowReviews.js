import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import api from '../api/client';
import Button from './Button';
import Card from './Card';
import { theme } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

function cleanText(value, maxLength = 500) {
  return String(value || '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function getUserName(user) {
  if (!user) return '';

  return (
    user.full_name ||
    user.fullName ||
    user.name ||
    user.username ||
    user.email ||
    ''
  );
}

function normalizeReview(item, showId) {
  if (!item || typeof item !== 'object') return null;

  const reviewShowId =
    item.show_id ||
    item.showId ||
    item.show?.show_id ||
    item.show?.id ||
    null;

  if (reviewShowId && String(reviewShowId) !== String(showId)) {
    return null;
  }

  const rating = Number(
    item.rating ||
      item.stars ||
      item.review_rating ||
      item.score ||
      item.rate ||
      0
  );

  return {
    id:
      item.review_id ||
      item.id ||
      item.user_review_id ||
      `${item.user_id || 'review'}-${item.created_at || Math.random()}`,
    rating: Number.isFinite(rating) ? rating : 0,
    title:
      item.title ||
      item.review_title ||
      item.subject ||
      'Κριτική χρήστη',
    comment:
      item.comment ||
      item.review ||
      item.review_text ||
      item.content ||
      item.body ||
      '',
    userName:
      item.user_name ||
      item.full_name ||
      item.fullName ||
      item.name ||
      item.username ||
      item.email ||
      'Χρήστης',
    createdAt:
      item.created_at ||
      item.createdAt ||
      item.updated_at ||
      item.date ||
      null
  };
}

function extractReviewsResponse(data, showId) {
  const rawReviews = Array.isArray(data)
    ? data
    : Array.isArray(data?.reviews)
      ? data.reviews
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data)
          ? data.data
          : [];

  const reviews = rawReviews
    .map((item) => normalizeReview(item, showId))
    .filter(Boolean);

  const responseAverage = Number(
    data?.average_rating ||
      data?.averageRating ||
      data?.avg_rating ||
      data?.avgRating ||
      data?.rating_avg ||
      data?.stats?.average_rating ||
      data?.stats?.average ||
      0
  );

  const computedAverage = reviews.length
    ? reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) /
      reviews.length
    : 0;

  const total = Number(
    data?.total ||
      data?.total_reviews ||
      data?.totalReviews ||
      data?.count ||
      data?.stats?.total ||
      reviews.length
  );

  return {
    reviews,
    average:
      Number.isFinite(responseAverage) && responseAverage > 0
        ? responseAverage
        : computedAverage,
    total: Number.isFinite(total) ? total : reviews.length
  };
}

async function fetchReviews(showId) {
  const requests = [
    () => api.get(`/reviews/show/${showId}`),
    () => api.get(`/shows/${showId}/reviews`),
    () => api.get('/reviews', { params: { show_id: showId } }),
    () => api.get('/reviews', { params: { showId } }),
    () => api.get(`/reviews/${showId}`)
  ];

  let lastError = null;

  for (const request of requests) {
    try {
      const res = await request();
      return extractReviewsResponse(res?.data, showId);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function submitReview(showId, payload) {
  const requests = [
    () =>
      api.post('/reviews', {
        show_id: Number(showId),
        rating: payload.rating,
        title: payload.title,
        comment: payload.comment
      }),
    () =>
      api.post('/reviews', {
        showId: Number(showId),
        rating: payload.rating,
        title: payload.title,
        content: payload.comment
      }),
    () =>
      api.post(`/shows/${showId}/reviews`, {
        rating: payload.rating,
        title: payload.title,
        comment: payload.comment
      }),
    () =>
      api.post(`/reviews/show/${showId}`, {
        rating: payload.rating,
        title: payload.title,
        comment: payload.comment
      })
  ];

  let lastError = null;

  for (const request of requests) {
    try {
      return await request();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function formatDate(value) {
  if (!value) return '';

  try {
    return new Date(value).toLocaleString('el-GR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  } catch {
    return '';
  }
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
        nextScale = 1.025;
        nextLift = -2;
      } else if (type === 'star') {
        nextScale = 1.12;
        nextLift = -2;
      } else if (type === 'review') {
        nextScale = 1.004;
        nextLift = -2;
      } else {
        nextScale = 1.01;
        nextLift = -2;
      }
    }

    Animated.parallel([
      Animated.timing(scale, {
        toValue: nextScale,
        duration: isActive ? 140 : 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(lift, {
        toValue: nextLift,
        duration: isActive ? 140 : 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    ]).start();
  };

  const shellStyle =
    type === 'button'
      ? styles.buttonHoverShell
      : type === 'star'
        ? styles.starHoverShell
        : type === 'review'
          ? styles.reviewHoverShell
          : styles.smallHoverShell;

  const activeStyle =
    type === 'button'
      ? styles.buttonHoverShellActive
      : type === 'star'
        ? styles.starHoverShellActive
        : type === 'review'
          ? styles.reviewHoverShellActive
          : styles.smallHoverShellActive;

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

function StarsDisplay({ rating = 0, size = 18 }) {
  const safeRating = Math.round(Number(rating || 0));

  return (
    <View style={styles.starsInline}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Text
          key={value}
          style={[
            styles.displayStar,
            { fontSize: size },
            value <= safeRating && styles.displayStarActive
          ]}
        >
          ★
        </Text>
      ))}
    </View>
  );
}

function StatCard({ value, label }) {
  return (
    <HoverEffect>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </HoverEffect>
  );
}

function ReviewItem({ item }) {
  return (
    <HoverEffect type="review" style={styles.reviewItemHover}>
      <View style={styles.reviewItem}>
        <View style={styles.reviewTop}>
          <View style={styles.reviewAvatar}>
            <Text style={styles.reviewAvatarText}>
              {String(item.userName || 'Χ').charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.reviewHeaderText}>
            <Text style={styles.reviewUser}>{item.userName}</Text>
            <Text style={styles.reviewDate}>{formatDate(item.createdAt)}</Text>
          </View>

          <StarsDisplay rating={item.rating} size={15} />
        </View>

        <Text style={styles.reviewTitle}>{item.title}</Text>

        {item.comment ? (
          <Text style={styles.reviewComment}>{item.comment}</Text>
        ) : null}
      </View>
    </HoverEffect>
  );
}

export default function ShowReviews({ showId }) {
  const auth = useAuth();
  const currentUser = auth?.user || auth?.currentUser || auth?.profile || null;
  const userName = getUserName(currentUser);

  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const visibleRating = hoverRating || rating;

  const loadReviews = async () => {
    if (!showId) return;

    setLoading(true);
    setError('');

    try {
      const data = await fetchReviews(showId);
      setReviews(data.reviews);
      setAverageRating(data.average || 0);
      setTotalReviews(data.total || data.reviews.length);
    } catch (loadError) {
      console.log(
        'Reviews load error:',
        loadError?.response?.status,
        loadError?.response?.data,
        loadError?.message
      );

      setReviews([]);
      setAverageRating(0);
      setTotalReviews(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [showId]);

  const normalizedAverage = useMemo(() => {
    const value = Number(averageRating || 0);
    if (!Number.isFinite(value)) return '0.0';
    return value.toFixed(1);
  }, [averageRating]);

  const handleSubmit = async () => {
    setMessage('');
    setError('');

    const safeTitle = cleanText(title, 80);
    const safeComment = cleanText(comment, 700);

    if (!rating) {
      setError('Επίλεξε βαθμολογία από 1 έως 5 αστέρια.');
      return;
    }

    if (safeTitle.length < 3) {
      setError('Ο τίτλος της κριτικής πρέπει να έχει τουλάχιστον 3 χαρακτήρες.');
      return;
    }

    if (safeComment.length < 10) {
      setError('Το σχόλιο πρέπει να έχει τουλάχιστον 10 χαρακτήρες.');
      return;
    }

    setSubmitting(true);

    try {
      await submitReview(showId, {
        rating,
        title: safeTitle,
        comment: safeComment
      });

      setRating(0);
      setHoverRating(0);
      setTitle('');
      setComment('');
      setMessage('Η κριτική σου καταχωρήθηκε επιτυχώς.');
      await loadReviews();
    } catch (submitError) {
      console.log(
        'Review submit error:',
        submitError?.response?.status,
        submitError?.response?.data,
        submitError?.message
      );

      setError(
        submitError?.response?.data?.message ||
          'Δεν ήταν δυνατή η καταχώρηση της κριτικής. Δοκίμασε ξανά.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card style={styles.reviewsCard}>
      <View style={styles.header}>
        <Text style={styles.title}>Κριτικές κοινού</Text>

        <View style={styles.statsRow}>
          <StatCard value={normalizedAverage} label="Μέση βαθμολογία" />
          <StatCard value={totalReviews} label="Σύνολο κριτικών" />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.colors.gold} size="small" />
          <Text style={styles.loadingText}>Φόρτωση κριτικών...</Text>
        </View>
      ) : reviews.length ? (
        <View style={styles.reviewList}>
          {reviews.slice(0, 5).map((item) => (
            <ReviewItem key={item.id} item={item} />
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>
          Δεν υπάρχουν ακόμη κριτικές για αυτή την παράσταση.
        </Text>
      )}

      <View style={styles.divider} />

      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>Γράψε τη δική σου κριτική</Text>

        {userName ? (
          <Text style={styles.connectedText}>Συνδεδεμένος ως {userName}</Text>
        ) : (
          <Text style={styles.connectedMuted}>
            Συνδέσου για να καταχωρήσεις κριτική.
          </Text>
        )}
      </View>

      <Text style={styles.label}>Βαθμολογία</Text>

      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((value) => {
          const active = value <= visibleRating;

          return (
            <HoverEffect key={value} type="star">
              <Pressable
                onPress={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                style={({ pressed }) => [
                  styles.starButton,
                  active && styles.starButtonActive,
                  pressed && styles.starButtonPressed
                ]}
              >
                <Text style={[styles.starText, active && styles.starTextActive]}>
                  ★
                </Text>
              </Pressable>
            </HoverEffect>
          );
        })}
      </View>

      <Text style={styles.label}>Τίτλος κριτικής</Text>
      <TextInput
        value={title}
        onChangeText={(value) => setTitle(cleanText(value, 80))}
        placeholder="π.χ. Πολύ καλή σκηνοθεσία"
        placeholderTextColor={theme.colors.muted}
        style={styles.input}
      />

      <Text style={styles.label}>Το σχόλιό σου</Text>
      <TextInput
        value={comment}
        onChangeText={(value) => setComment(cleanText(value, 700))}
        placeholder="Γράψε την εμπειρία σου από την παράσταση"
        placeholderTextColor={theme.colors.muted}
        style={[styles.input, styles.textArea]}
        multiline
        textAlignVertical="top"
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {message ? <Text style={styles.successText}>{message}</Text> : null}

      <View style={styles.submitHover}>
        <Button
          title={submitting ? 'Καταχώρηση...' : 'Καταχώρηση κριτικής'}
          onPress={handleSubmit}
          disabled={submitting}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  reviewsCard: {
    borderWidth: 1,
    borderColor: 'rgba(232,192,106,0.12)',
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 7,
    overflow: 'visible'
  },

  smallHoverShell: {
    borderRadius: 18,
    overflow: 'visible'
  },

  smallHoverShellActive: {
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 6
  },

  reviewHoverShell: {
    borderRadius: 20,
    overflow: 'visible'
  },

  reviewHoverShellActive: {
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.14,
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

  starHoverShell: {
    borderRadius: 999,
    overflow: 'visible'
  },

  starHoverShellActive: {
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.26,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8
  },

  header: {
    gap: 16
  },

  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '900'
  },

  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14
  },

  statCard: {
    minWidth: 180,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.035)'
  },

  statValue: {
    color: theme.colors.gold,
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 8
  },

  statLabel: {
    color: theme.colors.muted,
    fontWeight: '800'
  },

  loadingWrap: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },

  loadingText: {
    color: theme.colors.muted,
    fontWeight: '700'
  },

  emptyText: {
    color: theme.colors.muted,
    marginTop: 22,
    lineHeight: 22,
    fontWeight: '700'
  },

  reviewList: {
    marginTop: 20,
    gap: 12
  },

  reviewItem: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.03)'
  },

  reviewItemHover: {
    width: '100%'
  },

  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },

  reviewAvatar: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.goldSoft,
    borderWidth: 1,
    borderColor: 'rgba(232,192,106,0.24)'
  },

  reviewAvatarText: {
    color: theme.colors.gold,
    fontWeight: '900',
    fontSize: 16
  },

  reviewHeaderText: {
    flex: 1,
    minWidth: 0
  },

  reviewUser: {
    color: theme.colors.text,
    fontWeight: '900',
    marginBottom: 2
  },

  reviewDate: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '700'
  },

  starsInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2
  },

  displayStar: {
    color: 'rgba(255,255,255,0.20)',
    fontWeight: '900'
  },

  displayStarActive: {
    color: theme.colors.gold
  },

  reviewTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6
  },

  reviewComment: {
    color: theme.colors.muted,
    lineHeight: 22
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 24
  },

  formHeader: {
    marginBottom: 18
  },

  formTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 10
  },

  connectedText: {
    color: '#7ee7a2',
    fontWeight: '800'
  },

  connectedMuted: {
    color: theme.colors.muted,
    fontWeight: '700'
  },

  label: {
    color: theme.colors.text,
    fontWeight: '900',
    marginBottom: 10,
    marginTop: 8
  },

  starRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14
  },

  starButton: {
    width: 50,
    height: 50,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.goldSoft,
    borderWidth: 1,
    borderColor: 'rgba(232,192,106,0.22)'
  },

  starButtonActive: {
    backgroundColor: 'rgba(232,192,106,0.22)',
    borderColor: 'rgba(232,192,106,0.50)'
  },

  starButtonPressed: {
    opacity: 0.84
  },

  starText: {
    color: theme.colors.gold,
    fontSize: 26,
    fontWeight: '900'
  },

  starTextActive: {
    color: theme.colors.gold
  },

  input: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.035)',
    color: theme.colors.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 14,
    outlineStyle: 'none'
  },

  textArea: {
    minHeight: 130,
    lineHeight: 22
  },

  errorText: {
    color: '#ff8a8a',
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 12
  },

  successText: {
    color: '#7ee7a2',
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 12
  },

  submitHover: {
    width: '100%',
    marginTop: 4
  }
});

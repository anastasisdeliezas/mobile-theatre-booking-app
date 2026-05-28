import React, { useEffect, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import api from '../src/api/client';
import Button from '../src/components/Button';
import Input from '../src/components/Input';
import Screen from '../src/components/Screen';
import Card from '../src/components/Card';
import TopNav from '../src/components/TopNav';
import Footer from '../src/components/Footer';
import { useAuth } from '../src/context/AuthContext';
import { theme } from '../src/constants/theme';
import { resolveMediaUrl } from '../src/utils/media';
import {
  normalizeEmail,
  normalizeName,
  normalizePhone,
  sanitizeText,
  validateEmail,
  validateMessage,
  validateName,
  validateOptionalPhone,
  validateOptionalUrl,
  validatePassword
} from '../src/utils/validation';

const avatarFallback =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80';

function AvatarImage({ uri, style }) {
  const resolved = resolveMediaUrl(uri, avatarFallback);
  const flattenedStyle = StyleSheet.flatten(style) || {};

  if (Platform.OS === 'web') {
    return (
      <img
        src={resolved}
        alt="avatar"
        style={{
          width: flattenedStyle.width,
          height: flattenedStyle.height,
          borderRadius: flattenedStyle.borderRadius,
          borderWidth: flattenedStyle.borderWidth || 0,
          borderColor: flattenedStyle.borderColor,
          borderStyle: 'solid',
          objectFit: 'cover',
          display: 'block',
          maxWidth: '100%'
        }}
      />
    );
  }

  return <Image source={{ uri: resolved }} style={style} />;
}

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

function formatDateTime(value) {
  if (!value) return '—';

  return new Date(value).toLocaleString('el-GR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function messageStatusLabel(status) {
  if (status === 'new') return 'Νέο';
  if (status === 'read') return 'Διαβασμένο';
  if (status === 'replied') return 'Απαντημένο';
  return status || '—';
}

function senderLabel(senderType) {
  if (senderType === 'admin') return 'Del’s Theatre';
  if (senderType === 'user') return 'Εσύ';
  return senderType || '—';
}

const sections = [
  { key: 'home', label: 'Αρχική σελίδα', action: 'route', href: '/' },
  { key: 'account', label: 'Ο λογαριασμός μου' },
  {
    key: 'reservations',
    label: 'Οι κρατήσεις μου',
    action: 'route',
    href: '/reservations'
  },
  { key: 'messages', label: 'Μηνύματα' },
  { key: 'favorites', label: 'Προτεινόμενες παραστάσεις' },
  { key: 'password', label: 'Αλλαγή κωδικού' },
  { key: 'logout', label: 'Αποσύνδεση', action: 'logout' }
];

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuth();
  const { width } = useWindowDimensions();

  const isPhone = width < 560;
  const isTablet = width >= 760;
  const isDesktop = width >= 1180;
  const isCompact = width < 980;

  const favoriteColumns = isDesktop ? 4 : isTablet ? 3 : 2;

  const [activeSection, setActiveSection] = useState('account');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    avatar_url: '',
    bio: ''
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    cancelled: 0
  });
  const [favorites, setFavorites] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [activeThread, setActiveThread] = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [newMessage, setNewMessage] = useState({
    subject: '',
    message: ''
  });
  const [replyBody, setReplyBody] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadMessages = async () => {
    try {
      const { data } = await api.get('/contact/user/messages');
      setMessages(data || []);
    } catch {
      setMessages([]);
    }
  };

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        setLoadingProfile(true);
        setError('');
        setSuccess('');

        const [profileRes, reservationsRes, showsRes] = await Promise.all([
          api.get('/auth/profile'),
          api.get('/reservations/user/reservations'),
          api.get('/shows')
        ]);

        const profile = profileRes.data.user;
        const reservationList = reservationsRes.data || [];
        const showList = (showsRes.data || []).slice(0, 4);

        setForm({
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          avatar_url: profile.avatar_url || '',
          bio: profile.bio || ''
        });

        setStats({
          total: reservationList.length,
          active: reservationList.filter((item) => item.status !== 'cancelled').length,
          cancelled: reservationList.filter((item) => item.status === 'cancelled').length
        });

        setFavorites(showList);

        await loadMessages();
      } catch (error) {
        setError(
          error?.response?.data?.message || 'Η φόρτωση του προφίλ απέτυχε.'
        );
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, [user]);

  const save = async () => {
    try {
      setError('');
      setSuccess('');

      const payload = {
        name: normalizeName(form.name, 100).trim(),
        email: normalizeEmail(form.email),
        phone: normalizePhone(form.phone),
        avatar_url: sanitizeText(form.avatar_url, 500),
        bio: sanitizeText(form.bio, 500, { preserveNewLines: true })
      };

      const validationError =
        validateName(payload.name, 'ονοματεπώνυμο') ||
        validateEmail(payload.email, 'email') ||
        validateOptionalPhone(payload.phone) ||
        validateOptionalUrl(payload.avatar_url, 'URL εικόνας προφίλ');

      if (validationError) {
        setError(validationError);
        return;
      }

      setSavingProfile(true);

      const { data } = await api.put('/auth/profile', payload);
      setUser(data.user);
      setSuccess('Το προφίλ σου ενημερώθηκε επιτυχώς.');
    } catch (error) {
      setError(
        error?.response?.data?.message || 'Η αποθήκευση του προφίλ απέτυχε.'
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    try {
      setError('');
      setSuccess('');

      if (!passwords.currentPassword) {
        setError('Συμπλήρωσε τον τρέχοντα κωδικό.');
        return;
      }

      const passwordError = validatePassword(passwords.newPassword, 'νέος κωδικός');
      if (passwordError) {
        setError(passwordError);
        return;
      }

      if (passwords.currentPassword === passwords.newPassword) {
        setError('Ο νέος κωδικός πρέπει να είναι διαφορετικός από τον τρέχοντα.');
        return;
      }

      setChangingPassword(true);

      await api.put('/auth/password', passwords);
      setPasswords({ currentPassword: '', newPassword: '' });
      setSuccess('Ο κωδικός σου άλλαξε επιτυχώς.');
    } catch (error) {
      setError(
        error?.response?.data?.message || 'Η αλλαγή κωδικού απέτυχε.'
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const uploadImage = async () => {
    try {
      setError('');
      setSuccess('');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1]
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setUploading(true);

      const data = new FormData();

      if (Platform.OS === 'web' && asset.file) {
        data.append('image', asset.file);
      } else {
        data.append('image', {
          uri: asset.uri,
          name: asset.fileName || 'avatar.jpg',
          type: asset.mimeType || 'image/jpeg'
        });
      }

      const res = await api.post('/auth/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const nextUrl = res.data.url;
      const nextProfile = {
        name: normalizeName(form.name || user?.name || '', 100).trim(),
        email: normalizeEmail(form.email || user?.email || ''),
        phone: normalizePhone(form.phone || user?.phone || ''),
        avatar_url: nextUrl,
        bio: sanitizeText(form.bio || user?.bio || '', 500, { preserveNewLines: true })
      };

      const validationError =
        validateName(nextProfile.name, 'ονοματεπώνυμο') ||
        validateEmail(nextProfile.email, 'email') ||
        validateOptionalPhone(nextProfile.phone);

      if (validationError) {
        setForm((prev) => ({ ...prev, avatar_url: nextUrl }));
        setUser((prev) => ({ ...prev, avatar_url: nextUrl }));
        setSuccess('Η εικόνα ανέβηκε. Πάτησε «Αποθήκευση αλλαγών» για να αποθηκευτεί μόνιμα.');
        return;
      }

      const { data: savedProfile } = await api.put('/auth/profile', nextProfile);
      const savedUser = savedProfile.user || nextProfile;

      setForm((prev) => ({
        ...prev,
        name: savedUser.name || nextProfile.name,
        email: savedUser.email || nextProfile.email,
        phone: savedUser.phone || nextProfile.phone,
        avatar_url: savedUser.avatar_url || nextUrl,
        bio: savedUser.bio || nextProfile.bio
      }));
      setUser((prev) => ({ ...prev, ...savedUser, avatar_url: savedUser.avatar_url || nextUrl }));
      setSuccess('Η εικόνα προφίλ μεταφορτώθηκε και αποθηκεύτηκε επιτυχώς.');
    } catch (error) {
      setError(
        error?.response?.data?.message || 'Η μεταφόρτωση εικόνας απέτυχε.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleMenuPress = async (item) => {
    setError('');
    setSuccess('');

    if (item.action === 'route') {
      router.push(item.href);
      return;
    }

    if (item.action === 'logout') {
      await logout();
      router.replace('/');
      return;
    }

    setActiveSection(item.key);

    if (item.key === 'messages') {
      await loadMessages();
    }
  };

  const createSupportMessage = async () => {
    try {
      setError('');
      setSuccess('');

      const cleanSubject = sanitizeText(newMessage.subject, 160);
      const cleanMessage = sanitizeText(newMessage.message, 4000, { preserveNewLines: true });
      const validationError = validateMessage(cleanMessage, 'μήνυμα', 5, 4000);

      if (validationError) {
        setError(validationError);
        return;
      }

      setSendingMessage(true);

      await api.post('/contact', {
        name: normalizeName(form.name || user.name || 'Χρήστης', 120).trim(),
        email: normalizeEmail(form.email || user.email),
        subject: cleanSubject,
        message: cleanMessage
      });

      setNewMessage({ subject: '', message: '' });
      await loadMessages();
      setSuccess('Το μήνυμά σου στάλθηκε επιτυχώς.');
    } catch (error) {
      setError(
        error?.response?.data?.message || 'Η αποστολή μηνύματος απέτυχε.'
      );
    } finally {
      setSendingMessage(false);
    }
  };

  const openMessageThread = async (message) => {
    try {
      setError('');
      setSuccess('');
      setActiveMessageId(message.message_id);
      setActiveThread(null);
      setReplyBody('');
      setLoadingThread(true);

      const { data } = await api.get(`/contact/user/${message.message_id}/replies`);
      setActiveThread(data || null);
    } catch (error) {
      setError(
        error?.response?.data?.message || 'Η φόρτωση της συζήτησης απέτυχε.'
      );
    } finally {
      setLoadingThread(false);
    }
  };

  const sendReply = async () => {
    try {
      setError('');
      setSuccess('');

      if (!activeMessageId) {
        setError('Δεν έχει επιλεγεί μήνυμα.');
        return;
      }

      const cleanReply = sanitizeText(replyBody, 4000, { preserveNewLines: true });
      const validationError = validateMessage(cleanReply, 'απάντηση', 2, 4000);

      if (validationError) {
        setError(validationError);
        return;
      }

      setSendingReply(true);

      await api.post(`/contact/user/${activeMessageId}/replies`, {
        body: cleanReply
      });

      setReplyBody('');

      const { data } = await api.get(`/contact/user/${activeMessageId}/replies`);
      setActiveThread(data || null);
      await loadMessages();

      setSuccess('Η απάντησή σου στάλθηκε επιτυχώς.');
    } catch (error) {
      setError(
        error?.response?.data?.message || 'Η αποστολή απάντησης απέτυχε.'
      );
    } finally {
      setSendingReply(false);
    }
  };

  if (!user) {
    return (
      <Screen scroll contentStyle={[styles.page, isPhone && styles.pagePhone]}>
        <TopNav />
        <Card>
          <Text style={styles.heading}>Χρειάζεται σύνδεση</Text>
          <Text style={styles.copy}>
            Συνδέσου για να διαχειριστείς τον λογαριασμό σου, τα εισιτήρια και τις
            κρατήσεις σου.
          </Text>
          <Button title="Επιστροφή στην αρχική" onPress={() => router.push('/')} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll contentStyle={[styles.page, isPhone && styles.pagePhone]}>
      <TopNav />

      <View style={styles.profileHero}>
        <Text style={styles.heroKicker}>Κέντρο λογαριασμού</Text>
        <Text style={[styles.heroTitle, isPhone && styles.heroTitleCompact]}>
          Διαχειρίσου το προφίλ, τις κρατήσεις και τα εισιτήριά σου
        </Text>
        <Text style={styles.copy}>
          Όλες οι βασικές πληροφορίες του λογαριασμού σου συγκεντρωμένες σε ένα
          ενιαίο περιβάλλον.
        </Text>
      </View>

      <FormBanner type="error" text={error} />
      <FormBanner type="success" text={success} />

      <View style={[styles.dashboardWrap, isCompact && styles.dashboardWrapCompact]}>
        <Card style={[styles.sidebarCard, isCompact && styles.sidebarCardCompact]}>
          <View style={styles.userSummary}>
            <AvatarImage uri={form.avatar_url} style={styles.avatar} />
            <Text style={styles.userName}>{form.name || user.name}</Text>
            <Text style={styles.userMeta}>{form.email}</Text>
          </View>

          <View style={styles.navMenu}>
            {sections.map((item) => {
              const active = activeSection === item.key;

              return (
                <Pressable
                  key={item.key}
                  style={[
                    styles.menuItem,
                    active && !item.action && styles.menuItemActive
                  ]}
                  onPress={() => handleMenuPress(item)}
                >
                  <Text
                    style={[
                      styles.menuText,
                      active && !item.action && styles.menuTextActive
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <View style={styles.mainCol}>
          <Card style={[styles.topStatsCard, !isTablet && styles.topStatsCardCompact]}>
            <Metric label="Σύνολο κρατήσεων" value={stats.total} />
            <Metric label="Ενεργές" value={stats.active} />
            <Metric label="Ακυρωμένες" value={stats.cancelled} />
          </Card>

          {loadingProfile ? (
            <Card>
              <Text style={styles.emptyText}>Φόρτωση προφίλ...</Text>
            </Card>
          ) : null}

          {!loadingProfile && activeSection === 'account' ? (
            <Card>
              <Text style={styles.sectionTitle}>Ο λογαριασμός μου</Text>
              <Text style={styles.sectionCopy}>
                Ενημέρωσε τα προσωπικά στοιχεία και την εικόνα προφίλ που
                εμφανίζονται στον λογαριασμό σου.
              </Text>

              <View style={[styles.accountGrid, !isTablet && styles.accountGridCompact]}>
                <View style={[styles.avatarColumn, !isTablet && styles.avatarColumnCompact]}>
                  <AvatarImage uri={form.avatar_url} style={styles.largeAvatar} />
                  <Button
                    title={uploading ? 'Μεταφόρτωση...' : 'Μεταφόρτωση εικόνας'}
                    variant="secondary"
                    onPress={uploadImage}
                    disabled={uploading}
                    style={isPhone ? styles.fullWidthButton : null}
                  />
                </View>

                <View style={styles.formColumn}>
                  <Input
                    label="Ονοματεπώνυμο"
                    value={form.name}
                    onChangeText={(name) => setForm({ ...form, name: normalizeName(name, 100) })}
                    required
                    maxLength={100}
                    helper="Μόνο γράμματα, χωρίς αριθμούς."
                  />
                  <Input
                    label="Email"
                    value={form.email}
                    onChangeText={(email) => setForm({ ...form, email: sanitizeText(email, 190) })}
                    required
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <Input
                    label="Κινητό"
                    value={form.phone}
                    onChangeText={(phone) => setForm({ ...form, phone: normalizePhone(phone) })}
                    keyboardType="number-pad"
                    maxLength={10}
                    placeholder="π.χ. 69xxxxxxxx"
                  />
                  <Input
                    label="Σύντομο βιογραφικό"
                    value={form.bio}
                    onChangeText={(bio) => setForm({ ...form, bio: sanitizeText(bio, 500, { preserveNewLines: true }) })}
                    multiline
                  />
                  <Input
                    label="URL εικόνας προφίλ"
                    value={form.avatar_url}
                    onChangeText={(avatar_url) => setForm({ ...form, avatar_url: sanitizeText(avatar_url, 500) })}
                    autoCapitalize="none"
                  />
                  <Button
                    title={savingProfile ? 'Αποθήκευση...' : 'Αποθήκευση αλλαγών'}
                    onPress={save}
                    disabled={savingProfile}
                  />
                </View>
              </View>
            </Card>
          ) : null}

          {!loadingProfile && activeSection === 'messages' ? (
            <>
              <View style={[styles.messagesLayout, !isTablet && styles.messagesLayoutCompact]}>
                <Card style={styles.messageComposerCard}>
                  <Text style={styles.sectionTitle}>Νέο μήνυμα</Text>
                  <Text style={styles.sectionCopy}>
                    Στείλε μήνυμα στην ομάδα υποστήριξης και συνέχισε τη συζήτηση
                    μέσα από το app.
                  </Text>

                  <Input
                    label="Θέμα"
                    value={newMessage.subject}
                    onChangeText={(subject) =>
                      setNewMessage((prev) => ({ ...prev, subject: sanitizeText(subject, 160) }))
                    }
                    placeholder="π.χ. Ερώτηση για κράτηση"
                  />

                  <Input
                    label="Μήνυμα"
                    value={newMessage.message}
                    onChangeText={(message) =>
                      setNewMessage((prev) => ({ ...prev, message: sanitizeText(message, 4000, { preserveNewLines: true }) }))
                    }
                    multiline
                    placeholder="Γράψε εδώ το μήνυμά σου..."
                  />

                  <Button
                    title={sendingMessage ? 'Αποστολή...' : 'Αποστολή μηνύματος'}
                    onPress={createSupportMessage}
                    disabled={sendingMessage}
                  />
                </Card>

                <Card style={styles.messageListCard}>
                  <Text style={styles.sectionTitle}>Τα μηνύματά μου</Text>
                  <Text style={styles.sectionCopy}>
                    Άνοιξε ένα μήνυμα για να δεις απαντήσεις και να συνεχίσεις τη
                    συζήτηση.
                  </Text>

                  <View style={styles.messageList}>
                    {messages.length ? (
                      messages.map((item) => {
                        const active = activeMessageId === item.message_id;

                        return (
                          <Pressable
                            key={item.message_id}
                            style={[
                              styles.messageCard,
                              active && styles.messageCardActive
                            ]}
                            onPress={() => openMessageThread(item)}
                          >
                            <View style={styles.messageHeaderRow}>
                              <View style={styles.messageTitleBlock}>
                                <Text style={styles.messageSubject}>
                                  {item.subject || 'Χωρίς θέμα'}
                                </Text>
                                <Text style={styles.messageMeta}>
                                  {formatDateTime(item.created_at)}
                                </Text>
                              </View>

                              <View
                                style={[
                                  styles.statusChip,
                                  item.status === 'new' && styles.statusNew,
                                  item.status === 'read' && styles.statusRead,
                                  item.status === 'replied' && styles.statusReplied
                                ]}
                              >
                                <Text style={styles.statusChipText}>
                                  {messageStatusLabel(item.status)}
                                </Text>
                              </View>
                            </View>

                            <Text numberOfLines={3} style={styles.messageBodyPreview}>
                              {item.message}
                            </Text>

                            <Text style={styles.messageMeta}>
                              Απαντήσεις: {item.reply_count || 0}
                              {item.last_reply_at
                                ? ` · Τελευταία: ${formatDateTime(item.last_reply_at)}`
                                : ''}
                            </Text>
                          </Pressable>
                        );
                      })
                    ) : (
                      <Text style={styles.emptyText}>Δεν υπάρχουν ακόμη μηνύματα.</Text>
                    )}
                  </View>
                </Card>
              </View>

              {activeMessageId ? (
                <Card style={styles.messageThreadCard}>
                  <Text style={styles.sectionTitle}>Συζήτηση</Text>

                  {loadingThread ? (
                    <Text style={styles.emptyText}>Φόρτωση συζήτησης...</Text>
                  ) : (
                    <>
                      <View style={styles.threadReplyList}>
                        <View style={[styles.threadReply, styles.threadReplyUser]}>
                          <View style={styles.threadReplyTop}>
                            <Text style={styles.threadReplySender}>Εσύ</Text>
                            <Text style={styles.threadReplyDate}>
                              {formatDateTime(activeThread?.message?.created_at)}
                            </Text>
                          </View>
                          <Text style={styles.threadReplyText}>
                            {activeThread?.message?.message || '—'}
                          </Text>
                        </View>

                        {activeThread?.replies?.length ? (
                          activeThread.replies.map((reply) => (
                            <View
                              key={reply.reply_id}
                              style={[
                                styles.threadReply,
                                reply.sender_type === 'admin'
                                  ? styles.threadReplyAdmin
                                  : styles.threadReplyUser
                              ]}
                            >
                              <View style={styles.threadReplyTop}>
                                <Text style={styles.threadReplySender}>
                                  {senderLabel(reply.sender_type)}
                                </Text>
                                <Text style={styles.threadReplyDate}>
                                  {formatDateTime(reply.created_at)}
                                </Text>
                              </View>

                              <Text style={styles.threadReplyText}>{reply.body}</Text>
                            </View>
                          ))
                        ) : (
                          <Text style={styles.emptyText}>
                            Δεν υπάρχουν ακόμη απαντήσεις σε αυτό το μήνυμα.
                          </Text>
                        )}
                      </View>

                      <View style={styles.threadComposer}>
                        <Input
                          label="Απάντηση"
                          value={replyBody}
                          onChangeText={(value) => setReplyBody(sanitizeText(value, 4000, { preserveNewLines: true }))}
                          multiline
                          placeholder="Γράψε την απάντησή σου..."
                        />

                        <Button
                          title={sendingReply ? 'Αποστολή...' : 'Αποστολή απάντησης'}
                          onPress={sendReply}
                          disabled={sendingReply || !replyBody.trim()}
                        />
                      </View>
                    </>
                  )}
                </Card>
              ) : null}
            </>
          ) : null}

          {!loadingProfile && activeSection === 'favorites' ? (
            <Card>
              <Text style={styles.sectionTitle}>Προτεινόμενες παραστάσεις</Text>
              <Text style={styles.sectionCopy}>
                Μια σύντομη λίστα από διαθέσιμες παραστάσεις που μπορείς να
                εξερευνήσεις ξανά ή να μετατρέψεις σε νέα κράτηση.
              </Text>

              <View style={styles.favoriteGrid}>
                {favorites.map((item) => (
                  <View
                    key={item.show_id}
                    style={[
                      styles.favoriteItemWrap,
                      favoriteColumns === 2
                        ? styles.favoriteItemWrapHalf
                        : favoriteColumns === 3
                          ? styles.favoriteItemWrapThird
                          : styles.favoriteItemWrapQuarter
                    ]}
                  >
                    <Pressable
                      style={styles.favoriteItem}
                      onPress={() => router.push(`/show/${item.show_id}`)}
                    >
                      <AvatarImage
                        uri={item.poster_url}
                        style={[styles.favoriteImage, isPhone && styles.favoriteImageCompact]}
                      />
                      <Text numberOfLines={2} style={styles.favoriteTitle}>
                        {item.title}
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </Card>
          ) : null}

          {!loadingProfile && activeSection === 'password' ? (
            <Card>
              <Text style={styles.sectionTitle}>Αλλαγή κωδικού</Text>
              <Text style={styles.sectionCopy}>
                Διατήρησε τον λογαριασμό σου ασφαλή ενημερώνοντας τον κωδικό πρόσβασης.
              </Text>

              <Input
                label="Τρέχων κωδικός"
                secureTextEntry
                value={passwords.currentPassword}
                onChangeText={(currentPassword) =>
                  setPasswords({ ...passwords, currentPassword: String(currentPassword || '').slice(0, 100) })
                }
              />
              <Input
                label="Νέος κωδικός"
                helper="Τουλάχιστον 8 χαρακτήρες με κεφαλαίο, μικρό γράμμα και αριθμό."
                secureTextEntry
                value={passwords.newPassword}
                onChangeText={(newPassword) =>
                  setPasswords({ ...passwords, newPassword: String(newPassword || '').slice(0, 100) })
                }
              />
              <Button
                title={changingPassword ? 'Ενημέρωση...' : 'Ενημέρωση κωδικού'}
                onPress={changePassword}
                disabled={changingPassword}
              />
            </Card>
          ) : null}
        </View>
      </View>

      <Footer />
    </Screen>
  );
}

function Metric({ label, value }) {
  return (
    <View style={styles.metricBlock}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
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

  profileHero: {
    marginBottom: 18
  },

  heroKicker: {
    color: theme.colors.gold,
    fontWeight: '800',
    marginBottom: 8
  },

  heroTitle: {
    color: theme.colors.text,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
    marginBottom: 10
  },

  heroTitleCompact: {
    fontSize: 26,
    lineHeight: 32
  },

  copy: {
    color: theme.colors.muted,
    lineHeight: 22
  },

  heading: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 12
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

  dashboardWrap: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start'
  },

  dashboardWrapCompact: {
    flexDirection: 'column'
  },

  sidebarCard: {
    width: 290,
    alignSelf: 'flex-start'
  },

  sidebarCardCompact: {
    width: '100%',
    alignSelf: 'stretch'
  },

  userSummary: {
    alignItems: 'center',
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line
  },

  avatar: {
    width: 92,
    height: 92,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: theme.colors.gold,
    marginBottom: 12
  },

  userName: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '900'
  },

  userMeta: {
    color: theme.colors.muted,
    marginTop: 6
  },

  navMenu: {
    marginTop: 16,
    gap: 8
  },

  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)'
  },

  menuItemActive: {
    backgroundColor: theme.colors.goldSoft,
    borderWidth: 1,
    borderColor: 'rgba(232,192,106,0.32)'
  },

  menuText: {
    color: theme.colors.text,
    fontWeight: '700'
  },

  menuTextActive: {
    color: theme.colors.gold
  },

  mainCol: {
    flex: 1,
    gap: 16,
    width: '100%'
  },

  topStatsCard: {
    flexDirection: 'row',
    gap: 14
  },

  topStatsCardCompact: {
    flexDirection: 'column'
  },

  metricBlock: {
    flex: 1,
    minWidth: 120,
    padding: 8
  },

  metricValue: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '900'
  },

  metricLabel: {
    color: theme.colors.muted,
    marginTop: 6
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 10
  },

  sectionCopy: {
    color: theme.colors.muted,
    lineHeight: 22,
    marginBottom: 16
  },

  accountGrid: {
    flexDirection: 'row',
    gap: 18
  },

  accountGridCompact: {
    flexDirection: 'column'
  },

  avatarColumn: {
    width: 220,
    alignItems: 'center',
    gap: 14
  },

  avatarColumnCompact: {
    width: '100%'
  },

  largeAvatar: {
    width: 148,
    height: 148,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: theme.colors.gold
  },

  formColumn: {
    flex: 1
  },

  fullWidthButton: {
    width: '100%'
  },

  messagesLayout: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start'
  },

  messagesLayoutCompact: {
    flexDirection: 'column'
  },

  messageComposerCard: {
    flex: 0.85,
    width: '100%'
  },

  messageListCard: {
    flex: 1.15,
    width: '100%'
  },

  messageList: {
    gap: 12
  },

  messageCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: 'rgba(255,255,255,0.03)'
  },

  messageCardActive: {
    backgroundColor: theme.colors.goldSoft,
    borderColor: 'rgba(232,192,106,0.34)'
  },

  messageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10
  },

  messageTitleBlock: {
    flex: 1
  },

  messageSubject: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '900'
  },

  messageMeta: {
    color: theme.colors.muted,
    marginTop: 4,
    lineHeight: 20
  },

  messageBodyPreview: {
    color: theme.colors.muted,
    lineHeight: 22,
    marginBottom: 8
  },

  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)'
  },

  statusNew: {
    backgroundColor: 'rgba(232,192,106,0.18)'
  },

  statusRead: {
    backgroundColor: 'rgba(126,97,255,0.16)'
  },

  statusReplied: {
    backgroundColor: 'rgba(36,193,141,0.16)'
  },

  statusChipText: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 12
  },

  messageThreadCard: {
    marginTop: 16
  },

  threadReplyList: {
    gap: 12
  },

  threadReply: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.line
  },

  threadReplyAdmin: {
    backgroundColor: 'rgba(36,193,141,0.10)',
    borderColor: 'rgba(36,193,141,0.22)'
  },

  threadReplyUser: {
    backgroundColor: 'rgba(255,255,255,0.04)'
  },

  threadReplyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8
  },

  threadReplySender: {
    color: theme.colors.text,
    fontWeight: '900'
  },

  threadReplyDate: {
    color: theme.colors.muted,
    fontSize: 12
  },

  threadReplyText: {
    color: theme.colors.text,
    lineHeight: 22
  },

  threadComposer: {
    marginTop: 16
  },

  favoriteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    alignItems: 'stretch'
  },

  favoriteItemWrap: {
    paddingHorizontal: 8,
    marginBottom: 16,
    alignSelf: 'stretch'
  },

  favoriteItemWrapHalf: {
    width: '50%'
  },

  favoriteItemWrapThird: {
    width: '33.3333%'
  },

  favoriteItemWrapQuarter: {
    width: '25%'
  },

  favoriteItem: {
    width: '100%',
    minHeight: 298,
    height: '100%',
    padding: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.035)',
    justifyContent: 'space-between',
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5
  },

  favoriteImage: {
    width: '100%',
    height: 224,
    borderRadius: 18,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.04)'
  },

  favoriteImageCompact: {
    height: 196
  },

  favoriteTitle: {
    minHeight: 42,
    color: theme.colors.text,
    fontWeight: '900',
    lineHeight: 20
  },

  emptyText: {
    color: theme.colors.muted
  }
});
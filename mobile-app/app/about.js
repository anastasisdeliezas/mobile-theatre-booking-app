import React from 'react';
import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native';
import { router } from 'expo-router';
import Screen from '../src/components/Screen';
import TopNav from '../src/components/TopNav';
import Footer from '../src/components/Footer';
import Card from '../src/components/Card';
import Button from '../src/components/Button';
import { theme } from '../src/constants/theme';

const values = [
  {
    title: 'Απλή εμπειρία κράτησης',
    copy:
      'Από την αναζήτηση παράστασης μέχρι την επιλογή θέσεων και την ολοκλήρωση της αγοράς, η διαδικασία παραμένει ξεκάθαρη και γρήγορη.'
  },
  {
    title: 'Ολοκληρωμένος λογαριασμός χρήστη',
    copy:
      'Ο χρήστης έχει πρόσβαση στο ιστορικό κρατήσεων, στα ενεργά εισιτήρια, στις αποδείξεις και στις βασικές ενέργειες διαχείρισης.'
  },
  {
    title: 'Πραγματική λογική theatre platform',
    copy:
      'Η πλατφόρμα οργανώνει παραστάσεις, θέατρα, προβολές, διαθεσιμότητα θέσεων και ticket flow με τρόπο που θυμίζει σύγχρονο σύστημα κρατήσεων.'
  }
];

const platformFeatures = [
  'Αναζήτηση παραστάσεων και θεάτρων',
  'Προβολές με ώρες και τιμές',
  'Επιλογή θέσεων ανά αίθουσα',
  'Online checkout και promo codes',
  'Ψηφιακά εισιτήρια και ιστορικό κρατήσεων',
  'Διαχείριση λογαριασμού και στοιχείων χρήστη'
];

const steps = [
  {
    number: '01',
    title: 'Ανακάλυψη',
    copy: 'Ο χρήστης βρίσκει παραστάσεις, θέατρα και βασικές πληροφορίες μέσα από καθαρό κατάλογο.'
  },
  {
    number: '02',
    title: 'Επιλογή',
    copy: 'Επιλέγει διαθέσιμη προβολή, ώρα, αίθουσα και θέσεις με ξεκάθαρη παρουσίαση.'
  },
  {
    number: '03',
    title: 'Κράτηση',
    copy: 'Ολοκληρώνει την κράτηση, λαμβάνει απόδειξη και βλέπει τα εισιτήριά του στον λογαριασμό.'
  }
];

export default function AboutPage() {
  const { width } = useWindowDimensions();

  const isPhone = width < 560;
  const isTablet = width >= 760;
  const isDesktop = width >= 1180;

  const valueColumns = isDesktop ? 3 : isTablet ? 2 : 1;
  const featureColumns = isDesktop ? 2 : 1;
  const stepColumns = isDesktop ? 3 : 1;

  return (
    <Screen scroll contentStyle={[styles.page, isPhone && styles.pagePhone]}>
      <TopNav />

      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1600&q=80'
        }}
        imageStyle={[styles.heroImage, isPhone && styles.heroImageCompact]}
        style={[styles.hero, isPhone && styles.heroCompact]}
      >
        <View style={[styles.heroOverlay, isPhone && styles.heroOverlayCompact]}>
          <Text style={styles.kicker}>Ποιοι είμαστε</Text>

          <Text style={[styles.title, isPhone && styles.titleCompact]}>
            Το Del&apos;s Theatre φέρνει την εμπειρία του σύγχρονου theatre booking
            σε ένα καθαρό και εύχρηστο περιβάλλον
          </Text>

          <Text style={styles.copy}>
            Δημιουργήσαμε μια πλατφόρμα όπου ο επισκέπτης μπορεί να ανακαλύψει
            παραστάσεις, να δει διαθέσιμες προβολές, να επιλέξει θέσεις και να
            ολοκληρώσει την κράτησή του με σαφή και αξιόπιστο τρόπο.
          </Text>
        </View>
      </ImageBackground>

      <Card style={styles.missionCard}>
        <Text style={styles.sectionEyebrow}>Η αποστολή μας</Text>

        <Text style={[styles.sectionTitle, isPhone && styles.sectionTitleCompact]}>
          Να κάνουμε την κράτηση θεατρικού εισιτηρίου πιο οργανωμένη, πιο άμεση
          και πιο σύγχρονη
        </Text>

        <Text style={styles.sectionCopy}>
          Το Del&apos;s Theatre σχεδιάστηκε ώστε να συνδέει την ανακάλυψη
          παραστάσεων με μια σωστά δομημένη εμπειρία κράτησης. Ο χρήστης δεν
          βλέπει μόνο τίτλους και εικόνες, αλλά έχει πρόσβαση σε θέατρα,
          προβολές, τιμές, διαθεσιμότητα και ψηφιακά εισιτήρια μέσα από ένα
          ενιαίο flow.
        </Text>
      </Card>

      <View style={styles.grid}>
        {values.map((item) => (
          <View
            key={item.title}
            style={[
              styles.gridItem,
              valueColumns === 1
                ? styles.gridItemSingle
                : valueColumns === 2
                  ? styles.gridItemDouble
                  : styles.gridItemTriple
            ]}
          >
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardCopy}>{item.copy}</Text>
            </Card>
          </View>
        ))}
      </View>

      <View style={styles.featureSection}>
        <View style={styles.featureHeading}>
          <Text style={styles.sectionEyebrow}>Πώς λειτουργεί</Text>
          <Text style={[styles.sectionTitle, isPhone && styles.sectionTitleCompact]}>
            Από την ανακάλυψη μέχρι το ψηφιακό εισιτήριο
          </Text>
        </View>

        <View style={styles.grid}>
          {steps.map((item) => (
            <View
              key={item.number}
              style={[
                styles.gridItem,
                stepColumns === 1 ? styles.gridItemSingle : styles.gridItemTriple
              ]}
            >
              <Card style={styles.stepCard}>
                <Text style={styles.stepNumber}>{item.number}</Text>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardCopy}>{item.copy}</Text>
              </Card>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.featureSection}>
        <View style={styles.featureHeading}>
          <Text style={styles.sectionEyebrow}>Τι θα βρεις στην πλατφόρμα</Text>
          <Text style={[styles.sectionTitle, isPhone && styles.sectionTitleCompact]}>
            Όλα τα βασικά στοιχεία μιας ολοκληρωμένης εμπειρίας κράτησης
          </Text>
        </View>

        <View style={styles.grid}>
          {platformFeatures.map((item) => (
            <View
              key={item}
              style={[
                styles.gridItem,
                featureColumns === 1 ? styles.gridItemSingle : styles.gridItemDouble
              ]}
            >
              <Card style={styles.featureCard}>
                <Text style={styles.featureBullet}>•</Text>
                <Text style={styles.featureText}>{item}</Text>
              </Card>
            </View>
          ))}
        </View>
      </View>

      <Card style={[styles.ctaCard, !isTablet && styles.ctaCardCompact]}>
        <View style={styles.ctaTextWrap}>
          <Text style={styles.sectionEyebrow}>Ξεκίνα τώρα</Text>

          <Text style={[styles.ctaTitle, isPhone && styles.ctaTitleCompact]}>
            Ανακάλυψε διαθέσιμες παραστάσεις και βρες την επόμενη κράτησή σου
          </Text>

          <Text style={styles.ctaCopy}>
            Περιηγήσου στον κατάλογο, δες θέατρα και πέρασε στο booking flow της
            εφαρμογής.
          </Text>
        </View>

        <View style={[styles.ctaActions, !isTablet && styles.ctaActionsCompact]}>
          <Button title="Δες παραστάσεις" onPress={() => router.push('/movies')} />
          <View style={styles.actionGap} />
          <Button
            title="Δες θέατρα"
            variant="secondary"
            onPress={() => router.push('/theatres')}
          />
        </View>
      </Card>

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
    minHeight: 380,
    borderRadius: 30,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 22
  },

  heroCompact: {
    minHeight: 320,
    borderRadius: 24
  },

  heroImage: {
    borderRadius: 30
  },

  heroImageCompact: {
    borderRadius: 24
  },

  heroOverlay: {
    padding: 28,
    backgroundColor: 'rgba(4,10,22,0.54)'
  },

  heroOverlayCompact: {
    padding: 20
  },

  kicker: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.goldSoft,
    color: theme.colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    fontWeight: '800',
    marginBottom: 12
  },

  title: {
    color: '#fff',
    fontSize: 38,
    lineHeight: 46,
    fontWeight: '900',
    maxWidth: 860
  },

  titleCompact: {
    fontSize: 28,
    lineHeight: 34
  },

  copy: {
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 24,
    marginTop: 12,
    maxWidth: 760,
    fontSize: 16
  },

  missionCard: {
    marginBottom: 18
  },

  sectionEyebrow: {
    color: theme.colors.gold,
    fontWeight: '800',
    marginBottom: 8
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900'
  },

  sectionTitleCompact: {
    fontSize: 24,
    lineHeight: 30
  },

  sectionCopy: {
    color: theme.colors.muted,
    lineHeight: 24,
    marginTop: 12
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 20
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

  card: {
    paddingVertical: 20
  },

  cardTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 10
  },

  cardCopy: {
    color: theme.colors.muted,
    lineHeight: 24
  },

  featureSection: {
    marginBottom: 22
  },

  featureHeading: {
    marginBottom: 14
  },

  stepCard: {
    paddingVertical: 20
  },

  stepNumber: {
    color: theme.colors.gold,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 10
  },

  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 16
  },

  featureBullet: {
    color: theme.colors.gold,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 24
  },

  featureText: {
    flex: 1,
    color: theme.colors.text,
    lineHeight: 22,
    fontWeight: '700'
  },

  ctaCard: {
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 18,
    alignItems: 'center'
  },

  ctaCardCompact: {
    flexDirection: 'column',
    alignItems: 'stretch'
  },

  ctaTextWrap: {
    flex: 1
  },

  ctaTitle: {
    color: theme.colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900'
  },

  ctaTitleCompact: {
    fontSize: 22,
    lineHeight: 28
  },

  ctaCopy: {
    color: theme.colors.muted,
    lineHeight: 23,
    marginTop: 12,
    maxWidth: 720
  },

  ctaActions: {
    minWidth: 220,
    justifyContent: 'center'
  },

  ctaActionsCompact: {
    minWidth: 0,
    width: '100%'
  },

  actionGap: {
    height: 10
  }
});
import { LinearGradient } from 'expo-linear-gradient';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Screen({
  children,
  scroll = false,
  contentStyle,
  noPadding = false
}) {
  const { width } = useWindowDimensions();
  const isMobile = Platform.OS !== 'web';
  const compact = isMobile || width < 900;

  const inner = (
    <View
      style={[
        styles.content,
        compact && styles.contentCompact,
        noPadding && styles.noPadding,
        contentStyle
      ]}
    >
      {children}
    </View>
  );

  return (
    <LinearGradient
      colors={['#05070D', '#0B1322', '#0E1A2D', '#08101D']}
      locations={[0, 0.28, 0.7, 1]}
      style={styles.gradient}
    >
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {inner}
          </ScrollView>
        ) : (
          inner
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1
  },

  safeArea: {
    flex: 1
  },

  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28
  },

  contentCompact: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 22
  },

  noPadding: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0
  },

  scrollContent: {
    paddingBottom: 34
  }
});
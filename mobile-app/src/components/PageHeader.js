import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function PageHeader({ title, subtitle, canGoBack = true, right }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        {canGoBack ? (
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
        ) : <View style={{ width: 52 }} />}
        {right || <View style={{ width: 52 }} />}
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 18 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  backArrow: { color: '#F8FAFC', fontSize: 28, lineHeight: 28, marginTop: -2 },
  title: { fontSize: 28, fontWeight: '900', color: '#F8FAFC' },
  subtitle: { marginTop: 8, color: '#9DB0CE', lineHeight: 22 }
});

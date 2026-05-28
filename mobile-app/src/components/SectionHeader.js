import { StyleSheet, Text, View } from 'react-native';

export default function SectionHeader({ eyebrow, title, subtitle, right }) {
  return (
    <View style={styles.wrap}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 18, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  eyebrow: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(246,197,95,0.14)',
    color: '#F6C55F',
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden'
  },
  title: { fontSize: 28, fontWeight: '900', color: '#F8FAFC', letterSpacing: -0.4 },
  subtitle: { marginTop: 8, fontSize: 15, lineHeight: 22, color: '#9DB0CE' }
});

import { Platform, StyleSheet, View } from 'react-native';
import { theme } from '../constants/theme';

const isWeb = Platform.OS === 'web';

export default function Card({ children, style }) {
  return (
    <View
      style={[
        styles.card,
        isWeb ? styles.cardWeb : styles.cardMobile,
        style
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.panel,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(232,192,106,0.10)',
    overflow: 'hidden'
  },

  cardWeb: {
    boxShadow: '0px 18px 34px rgba(0,0,0,0.30), 0px 0px 0px 1px rgba(232,192,106,0.035)',
    transitionDuration: '180ms'
  },

  cardMobile: {
    borderRadius: 22,
    padding: 16,
    ...(isWeb
      ? {}
      : {
          shadowColor: '#000',
          shadowOpacity: 0.22,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 12 },
          elevation: 7
        })
  }
});

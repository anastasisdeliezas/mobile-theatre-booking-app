import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { theme } from '../constants/theme';

const isWeb = Platform.OS === 'web';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  style,
  textStyle,
  disabled = false
}) {
  const secondary = variant === 'secondary';
  const ghost = variant === 'ghost';
  const dark = variant === 'dark';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ hovered, pressed }) => [
        styles.button,
        secondary && styles.secondary,
        ghost && styles.ghost,
        dark && styles.dark,
        hovered && !isDisabled && styles.buttonHover,
        hovered && secondary && !isDisabled && styles.secondaryHover,
        hovered && ghost && !isDisabled && styles.secondaryHover,
        hovered && dark && !isDisabled && styles.darkHover,
        pressed && !isDisabled && styles.buttonPressed,
        isDisabled && styles.disabled,
        style
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={secondary || ghost || dark ? theme.colors.text : theme.colors.darkText}
          />
        ) : icon ? (
          <Text style={[styles.icon, (secondary || ghost || dark) && styles.altText]}>
            {icon}
          </Text>
        ) : null}

        <Text
          numberOfLines={1}
          style={[
            styles.text,
            (secondary || ghost || dark) && styles.altText,
            textStyle
          ]}
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.gold,
    minHeight: isWeb ? 54 : 50,
    paddingVertical: isWeb ? 14 : 12,
    paddingHorizontal: 18,
    borderRadius: isWeb ? 18 : 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232,192,106,0.44)',
    transform: [{ translateY: 0 }, { scale: 1 }],
    ...(isWeb
      ? {
          boxShadow: '0px 8px 16px rgba(232,192,106,0.24)',
          transitionDuration: '160ms'
        }
      : {
          shadowColor: theme.colors.gold,
          shadowOpacity: 0.22,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 5
        })
  },

  buttonHover: {
    borderColor: 'rgba(232,192,106,0.76)',
    transform: [{ translateY: -2 }, { scale: 1.018 }],
    ...(isWeb
      ? {
          boxShadow: '0px 14px 24px rgba(232,192,106,0.32)'
        }
      : {
          shadowOpacity: 0.3,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 10 },
          elevation: 9
        })
  },

  buttonPressed: {
    opacity: 0.88,
    transform: [{ translateY: 0 }, { scale: 0.985 }]
  },

  secondary: {
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.line,
    ...(isWeb ? { boxShadow: 'none' } : { elevation: 0 })
  },

  secondaryHover: {
    backgroundColor: 'rgba(232,192,106,0.10)',
    borderColor: 'rgba(232,192,106,0.42)',
    ...(isWeb
      ? {
          boxShadow: '0px 12px 22px rgba(232,192,106,0.16)'
        }
      : {
          shadowOpacity: 0.18,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 7
        })
  },

  dark: {
    backgroundColor: '#0B1628',
    borderWidth: 1,
    borderColor: theme.colors.line,
    ...(isWeb ? { boxShadow: 'none' } : { elevation: 0 })
  },

  darkHover: {
    backgroundColor: '#101D32',
    borderColor: 'rgba(232,192,106,0.28)'
  },

  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.line,
    ...(isWeb ? { boxShadow: 'none' } : { elevation: 0 })
  },

  disabled: {
    opacity: 0.55,
    transform: [{ translateY: 0 }, { scale: 1 }]
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },

  icon: {
    color: theme.colors.darkText,
    fontSize: 16
  },

  text: {
    color: theme.colors.darkText,
    fontWeight: '900',
    fontSize: 15
  },

  altText: {
    color: theme.colors.text
  }
});

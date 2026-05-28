import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../constants/theme';

const isWeb = Platform.OS === 'web';

export default function Input({
  label,
  leading,
  style,
  multiline = false,
  trailing,
  onTrailingPress,
  helper,
  error,
  required = false,
  ...props
}) {
  const [focused, setFocused] = useState(false);
  const helperText = error || helper;

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputWrap,
          focused && styles.inputWrapFocused,
          multiline && styles.multiWrap,
          error && styles.inputWrapError
        ]}
      >
        {leading ? <Text style={styles.leading}>{leading}</Text> : null}

        <TextInput
          placeholderTextColor="#7F91AE"
          selectionColor={theme.colors.gold}
          style={[
            styles.input,
            multiline && styles.multiline,
            trailing && styles.inputWithTrailing,
            style
          ]}
          multiline={multiline}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          {...props}
        />

        {trailing ? (
          onTrailingPress ? (
            <Pressable
              onPress={onTrailingPress}
              style={({ hovered, pressed }) => [
                styles.trailingButton,
                hovered && styles.trailingButtonHover,
                pressed && styles.trailingButtonPressed
              ]}
            >
              <Text style={styles.trailingText}>{trailing}</Text>
            </Pressable>
          ) : (
            <View style={styles.trailingStatic}>
              <Text style={styles.trailingText}>{trailing}</Text>
            </View>
          )
        ) : null}
      </View>

      {helperText ? (
        <Text style={[styles.helper, error && styles.helperError]}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12
  },

  label: {
    marginBottom: 7,
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 12.5,
    letterSpacing: 0.2
  },

  required: {
    color: theme.colors.gold
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    paddingHorizontal: 13,
    minHeight: 50,
    backgroundColor: 'rgba(255,255,255,0.045)',
    ...(isWeb
      ? { transitionDuration: '160ms' }
      : {
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2
        })
  },

  inputWrapFocused: {
    borderColor: 'rgba(232,192,106,0.64)',
    backgroundColor: 'rgba(232,192,106,0.085)',
    ...(isWeb
      ? { boxShadow: '0px 0px 0px 3px rgba(232,192,106,0.10), 0px 10px 20px rgba(232,192,106,0.08)' }
      : {
          shadowColor: theme.colors.gold,
          shadowOpacity: 0.14,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 7 },
          elevation: 5
        })
  },

  inputWrapError: {
    borderColor: 'rgba(239,68,68,0.62)',
    backgroundColor: 'rgba(239,68,68,0.08)'
  },

  multiWrap: {
    alignItems: 'flex-start',
    paddingTop: 12
  },

  leading: {
    color: theme.colors.muted,
    fontSize: 14
  },

  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
    paddingVertical: 12,
    outlineStyle: 'none'
  },

  inputWithTrailing: {
    paddingRight: 8
  },

  multiline: {
    minHeight: 102,
    textAlignVertical: 'top'
  },

  trailingButton: {
    minWidth: 34,
    minHeight: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 6,
    paddingRight: 6
  },

  trailingButtonHover: {
    backgroundColor: 'rgba(232,192,106,0.12)'
  },

  trailingButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }]
  },

  trailingStatic: {
    minWidth: 34,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 6
  },

  trailingText: {
    color: theme.colors.gold,
    fontSize: 17,
    fontWeight: '900'
  },

  helper: {
    marginTop: 7,
    color: theme.colors.muted,
    fontSize: 11.5,
    lineHeight: 17
  },

  helperError: {
    color: '#fecaca'
  }
});

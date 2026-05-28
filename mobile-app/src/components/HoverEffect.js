import React, { useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

export default function HoverEffect({
  children,
  type = 'card',
  style,
  disabled = false,
  scale = null,
  lift = null
}) {
  const animatedScale = useRef(new Animated.Value(1)).current;
  const animatedLift = useRef(new Animated.Value(0)).current;
  const [active, setActive] = useState(false);

  const getTarget = (isActive) => {
    if (!isActive || disabled) return { nextScale: 1, nextLift: 0 };

    if (type === 'button') {
      return { nextScale: scale ?? 1.025, nextLift: lift ?? -2 };
    }

    if (type === 'chip') {
      return { nextScale: scale ?? 1.015, nextLift: lift ?? -1 };
    }

    if (type === 'media') {
      return { nextScale: scale ?? 1.012, nextLift: lift ?? -4 };
    }

    if (type === 'panel') {
      return { nextScale: scale ?? 1.004, nextLift: lift ?? -2 };
    }

    if (type === 'star') {
      return { nextScale: scale ?? 1.12, nextLift: lift ?? -2 };
    }

    return { nextScale: scale ?? 1.012, nextLift: lift ?? -4 };
  };

  const animate = (isActive) => {
    if (disabled) return;
    setActive(isActive);

    const { nextScale, nextLift } = getTarget(isActive);

    Animated.parallel([
      Animated.timing(animatedScale, {
        toValue: nextScale,
        duration: isActive ? 140 : 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(animatedLift, {
        toValue: nextLift,
        duration: isActive ? 140 : 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    ]).start();
  };

  const shellStyle =
    type === 'button'
      ? styles.buttonShell
      : type === 'chip'
        ? styles.chipShell
        : type === 'media'
          ? styles.mediaShell
          : type === 'panel'
            ? styles.panelShell
            : type === 'star'
              ? styles.starShell
              : styles.cardShell;

  const activeStyle =
    type === 'button'
      ? styles.buttonActive
      : type === 'chip'
        ? styles.chipActive
        : type === 'media'
          ? styles.mediaActive
          : type === 'panel'
            ? styles.panelActive
            : type === 'star'
              ? styles.starActive
              : styles.cardActive;

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
        { transform: [{ translateY: animatedLift }, { scale: animatedScale }] }
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardShell: {
    borderRadius: 28,
    overflow: 'visible'
  },

  cardActive: {
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 9
  },

  panelShell: {
    borderRadius: 28,
    overflow: 'visible'
  },

  panelActive: {
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7
  },

  mediaShell: {
    borderRadius: 28,
    overflow: 'visible'
  },

  mediaActive: {
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.24,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12
  },

  buttonShell: {
    borderRadius: 999,
    overflow: 'visible'
  },

  buttonActive: {
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10
  },

  chipShell: {
    borderRadius: 999,
    overflow: 'visible'
  },

  chipActive: {
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5
  },

  starShell: {
    borderRadius: 999,
    overflow: 'visible'
  },

  starActive: {
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8
  }
});

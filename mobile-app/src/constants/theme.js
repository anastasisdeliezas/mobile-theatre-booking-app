import { Platform } from 'react-native';

export const theme = {
  colors: {
    bg: '#05070D',
    bg2: '#0A1221',
    panel: 'rgba(8, 13, 23, 0.9)',
    panelElevated: 'rgba(12, 18, 31, 0.96)',
    glass: 'rgba(255,255,255,0.06)',
    line: 'rgba(255,255,255,0.09)',
    text: '#F7F7FB',
    muted: '#9DA8BD',
    gold: '#E8C06A',
    goldSoft: 'rgba(232,192,106,0.16)',
    accent: '#7E61FF',
    success: '#24C18D',
    danger: '#FF7D7D',
    darkText: '#0C1220'
  },

  radius: {
    sm: 14,
    md: 20,
    lg: 28,
    xl: 36
  },

  shadow: {
    card:
      Platform.OS === 'web'
        ? {
            boxShadow: '0px 14px 24px rgba(0,0,0,0.28)'
          }
        : {
            shadowColor: '#000',
            shadowOpacity: 0.28,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 14 },
            elevation: 6
          }
  }
};
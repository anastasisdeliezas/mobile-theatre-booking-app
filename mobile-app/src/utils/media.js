import Constants from 'expo-constants';
import { Platform } from 'react-native';

function stripApiSuffix(url) {
  return String(url || '').replace(/\/api\/?$/, '').replace(/\/$/, '');
}

function getConfiguredApiOrigin() {
  const envUrl =
    process.env.EXPO_PUBLIC_API_URL ||
    Constants.expoConfig?.extra?.apiUrl ||
    Constants.manifest2?.extra?.expoClient?.extra?.apiUrl ||
    Constants.manifest?.extra?.apiUrl;

  if (!envUrl) return '';

  return stripApiSuffix(envUrl);
}

export function resolveApiOrigin() {
  const configuredOrigin = getConfiguredApiOrigin();

  if (configuredOrigin) {
    return configuredOrigin;
  }

  if (Platform.OS === 'web') {
    const hostname =
      typeof window !== 'undefined' && window.location?.hostname
        ? window.location.hostname
        : 'localhost';

    return `http://${hostname}:4000`;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost;

  const host = hostUri?.split(':')[0];

  if (host) {
    return `http://${host}:4000`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000';
  }

  return 'http://localhost:4000';
}

export function resolveMediaUrl(value, fallback = '') {
  if (!value) return fallback;

  const origin = resolveApiOrigin();
  const raw = String(value).trim();

  if (!raw) return fallback;

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const url = new URL(raw);

      if (
        url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        url.hostname === '0.0.0.0'
      ) {
        return `${origin}${url.pathname}${url.search}`;
      }

      return raw;
    } catch {
      return raw;
    }
  }

  if (raw.startsWith('/')) {
    return `${origin}${raw}`;
  }

  return `${origin}/${raw}`;
}
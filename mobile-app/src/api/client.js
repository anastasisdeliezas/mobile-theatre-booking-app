import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { deleteMany, getItem, setItem } from '../utils/storage';

function resolveBaseURL() {
  const envUrl =
    process.env.EXPO_PUBLIC_API_URL ||
    Constants.expoConfig?.extra?.apiUrl ||
    Constants.manifest2?.extra?.expoClient?.extra?.apiUrl ||
    Constants.manifest?.extra?.apiUrl;

  if (envUrl) return envUrl;

  if (Platform.OS === 'web') return 'http://192.168.2.43:4000/api';

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost;

  const host = hostUri?.split(':')[0];
  if (host) return `http://${host}:4000/api`;

  if (Platform.OS === 'android') return 'http://10.0.2.2:4000/api';
  return 'http://localhost:4000/api';
}

const api = axios.create({
  baseURL: resolveBaseURL()
});

// console.log('API BASE URL =>', api.defaults.baseURL);

let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
        refresh_token: refreshToken
      });

      if (data?.token) await setItem('token', data.token);
      if (data?.refresh_token) await setItem('refresh_token', data.refresh_token);

      return data?.token;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

api.interceptors.request.use(async (config) => {
  const token = await getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error?.response?.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes('/auth/login') &&
      !originalRequest?.url?.includes('/auth/register') &&
      !originalRequest?.url?.includes('/auth/refresh')
    ) {
      try {
        originalRequest._retry = true;
        const newToken = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        await deleteMany(['token', 'refresh_token']);
        throw refreshError;
      }
    }

    throw error;
  }
);

export default api;
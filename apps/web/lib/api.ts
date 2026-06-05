import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { getApiLocale } from '@/lib/locale-api';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const locale = getApiLocale();
  config.headers['Accept-Language'] = locale;
  if (config.params && typeof config.params === 'object') {
    config.params = { ...config.params, locale };
  } else if (config.method?.toLowerCase() === 'get') {
    config.params = { ...(config.params as object), locale };
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        const locale = getApiLocale();
        window.location.href = `/${locale}/login`;
      }
    }
    return Promise.reject(error);
  },
);

export function getApiBaseUrl(): string {
  return baseURL;
}

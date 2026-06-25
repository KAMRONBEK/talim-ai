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
    // A 401 from the auth entry-point endpoints (wrong password on sign-in,
    // failed sign-up) must NOT trigger the global logout+redirect — that hard
    // reload discards the inline "Invalid email or password" message the page
    // sets. Those pages handle their own errors; only redirect on 401s from
    // authenticated requests (an expired/invalid session).
    const url = error.config?.url ?? '';
    const isAuthEntryPoint = url.includes('/auth/login') || url.includes('/auth/register');
    if (error.response?.status === 401 && !isAuthEntryPoint) {
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

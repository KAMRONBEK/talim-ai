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

/**
 * Guard against a redirect stampede. A page can have several authenticated requests in flight at
 * once (the reader fires the PDF blob while podcast/summary hooks are still loading), and each
 * one seeing 401 would call logout + assign window.location, interrupting the navigation the
 * previous one started.
 */
let terminating = false;

/**
 * End the session and send the user to login. The single place that does this.
 *
 * Extracted from the interceptor because the interceptor only runs for requests made through the
 * `api` axios instance — anything using raw `fetch` (the PDF/audio blobs, the summary stream, the
 * chat stream, the SSE job stream) bypassed it entirely and stranded the user on whatever error
 * screen that caller happened to render.
 */
export function terminateSession(reason?: 'deactivated'): void {
  if (terminating) return;
  terminating = true;
  useAuthStore.getState().logout();
  if (typeof window !== 'undefined') {
    const locale = getApiLocale();
    window.location.href = `/${locale}/login${reason ? `?reason=${reason}` : ''}`;
  }
}

/**
 * Act on a response status that means the session is over.
 *
 * Status-only by design: the "don't do this on the login page" carve-out needs the request URL and
 * therefore stays at the axios call site. Folding it in here would silently break the inline
 * "wrong password" message on /login and /register.
 *
 * @returns true when the session was ended, so a caller can stop rather than retrying.
 */
export function handleAuthFailure(status: number, code?: string): boolean {
  if (status === 401) {
    terminateSession();
    return true;
  }
  // A deactivated student kept a live session and simply saw zeros — "0 materials assigned",
  // streak reset — for an account removed from the class a second earlier. Every request 403s,
  // but nothing acted on it, so the app looked like it was working and merely empty.
  if (status === 403 && code === 'ACCOUNT_DEACTIVATED') {
    terminateSession('deactivated');
    return true;
  }
  return false;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 from the auth entry-point endpoints (wrong password on sign-in, failed sign-up) must
    // NOT trigger the global logout+redirect — that hard reload discards the inline "Invalid email
    // or password" message the page sets. Those pages handle their own errors; only redirect on
    // 401s from authenticated requests (an expired/invalid session).
    const url = error.config?.url ?? '';
    const isAuthEntryPoint = url.includes('/auth/login') || url.includes('/auth/register');
    if (error.response && !isAuthEntryPoint) {
      handleAuthFailure(error.response.status, error.response?.data?.code);
    }
    return Promise.reject(error);
  },
);

export function getApiBaseUrl(): string {
  return baseURL;
}

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
});

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') ?? sessionStorage.getItem('token');
}

function clearToken() {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // The login request itself returning 401 just means "wrong credentials" —
    // that's handled by the login form's own error state, not a session expiry.
    const isLoginRequest = err.config?.url?.includes('/api/auth/login');
    if (err.response?.status === 401 && !isLoginRequest && typeof window !== 'undefined') {
      clearToken();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

/**
 * Turns an axios failure into something a user can act on.
 *
 * The distinction that matters: when the request never got a response at all
 * (`err.response` undefined) the API is unreachable — wrong URL, server down,
 * CORS/CSP block — which is NOT a credentials problem. Showing a generic
 * "please try again" there sends people off hunting for a bad password.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { error?: string } }; code?: string };

  if (e?.response?.data?.error) return e.response.data.error;

  if (!e?.response) {
    const target = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    return `Can't reach the server at ${target}. Check that the API is running and that NEXT_PUBLIC_API_URL is set correctly.`;
  }

  return fallback;
}

export default api;

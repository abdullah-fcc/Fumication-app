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

export default api;

import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const AUTH_NO_REFRESH_PATHS = [
  '/auth/login',
  '/auth/signup',
  '/auth/refresh-token',
  '/auth/google-login',
  '/auth/logout',
];

function shouldSkipTokenRefresh(url?: string) {
  if (!url) return false;
  return AUTH_NO_REFRESH_PATHS.some((path) => url.includes(path));
}

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !shouldSkipTokenRefresh(originalRequest?.url)
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefresh =
          useAuthStore.getState().refreshToken ||
          (typeof window !== 'undefined' ? localStorage.getItem('nexus_refresh') : null);

        const res = await axios.post(
          `${API_URL}/auth/refresh-token`,
          storedRefresh ? { refreshToken: storedRefresh } : {},
          { withCredentials: true }
        );

        if (res.data?.status === 'success') {
          const { accessToken, user, refreshToken } = res.data.data;

          useAuthStore.getState().login(user, accessToken, refreshToken ?? storedRefresh);

          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          processQueue(null, accessToken);
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

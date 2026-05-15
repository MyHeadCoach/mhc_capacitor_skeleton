import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const TOKEN_KEY = 'app_auth_token';

let authToken: string | null = null;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (authToken) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearAuthToken();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export async function setAuthToken(token: string): Promise<void> {
  authToken = token;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getAuthToken(): string | null {
  return authToken;
}

export async function clearAuthToken(): Promise<void> {
  authToken = null;
  localStorage.removeItem(TOKEN_KEY);
}

export async function loadAuthToken(): Promise<string | null> {
  const value = localStorage.getItem(TOKEN_KEY);
  if (value) {
    authToken = value;
  }
  return authToken;
}

export default api;

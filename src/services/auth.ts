import api, { setAuthToken, clearAuthToken, loadAuthToken } from './api';
import { ensurePushRegistration, resetPushRegistrationState } from '@/services/notifications';
import type { User } from '@/types';

const USER_DATA_KEY = 'app_user_data';

export async function persistUserData(user: User): Promise<void> {
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
}

export async function loadPersistedUserData(): Promise<User | null> {
  const value = localStorage.getItem(USER_DATA_KEY);
  if (value) {
    try { return JSON.parse(value); } catch { return null; }
  }
  return null;
}

export async function clearPersistedUserData(): Promise<void> {
  localStorage.removeItem(USER_DATA_KEY);
}

export async function login(credentials: { email: string; password: string }): Promise<{
  user: User | null;
  requiresTwoFactor: boolean;
}> {
  const response = await api.post('/api/m/auth/login', {
    email: credentials.email,
    password: credentials.password,
  });

  const data = response.data;

  if (data.two_factor) {
    return { user: null, requiresTwoFactor: true };
  }

  await setAuthToken(data.token);
  const user = data.user;
  await persistUserData(user);
  await ensurePushRegistration();

  return { user, requiresTwoFactor: false };
}

export async function selectTenant(tenantId: string): Promise<User> {
  const response = await api.post('/api/m/auth/select-tenant', { tenant_id: tenantId });
  const user = response.data.user;
  await persistUserData(user);
  return user;
}

export async function checkSession(): Promise<User | null> {
  const token = await loadAuthToken();
  if (!token) return null;

  // Use persisted user — token validated on first real API call
  const persistedUser = await loadPersistedUserData();
  if (persistedUser) return persistedUser;

  // No cached user — try to fetch
  try {
    const response = await api.get('/api/m/user');
    const user = response.data.user ?? response.data;
    if (user) {
      await persistUserData(user);
      await ensurePushRegistration();
      return user;
    }
  } catch {
    // Token may still be valid
  }

  return null;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/api/m/auth/logout');
  } catch {
    // Ignore
  }
  await clearPersistedUserData();
  await clearAuthToken();
  resetPushRegistrationState();
}

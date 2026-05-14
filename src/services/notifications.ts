import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { App } from '@capacitor/app';
import api from '@/services/api';

const TOKEN_CACHE_KEY = 'app_push_device_token';
const PUSH_TOKEN_ENDPOINT = '/api/m/mobile/push-tokens';

type CachedToken = {
  token: string;
  platform: string;
  appVersion: string | null;
};

let registrationPromise: Promise<void> | null = null;
let listenersInitialized = false;

export function resetPushRegistrationState() {
  registrationPromise = null;
  listenersInitialized = false;
  localStorage.removeItem(TOKEN_CACHE_KEY);
}

export async function ensurePushRegistration() {
  if (!Capacitor.isNativePlatform()) return;
  if (registrationPromise) return registrationPromise;

  registrationPromise = internalRegister().finally(() => {
    registrationPromise = null;
  });

  return registrationPromise;
}

async function internalRegister() {
  const { PushNotifications } = await import('@capacitor/push-notifications');

  const perm = await PushNotifications.checkPermissions();
  if (perm.receive !== 'granted') {
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') {
      console.warn('[Push] Permission denied');
      return;
    }
  }

  if (!listenersInitialized) {
    listenersInitialized = true;

    PushNotifications.addListener('registration', (token) => {
      syncDeviceToken(token.value).catch((error) => {
        console.error('[Push] Failed to sync token', error);
      });
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('[Push] Registration error', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[Push] Notification received', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[Push] Notification action', action);
      // TODO: deep link into the proper screen once routes are defined
    });
  }

  await PushNotifications.register();
}

async function syncDeviceToken(token: string) {
  const [{ platform }, appInfo] = await Promise.all([
    Device.getInfo(),
    App.getInfo(),
  ]);

  const payload: CachedToken = {
    token,
    platform,
    appVersion: appInfo.version ?? null,
  };

  const cached = getCachedToken();
  if (
    cached &&
    cached.token === payload.token &&
    cached.platform === payload.platform &&
    cached.appVersion === payload.appVersion
  ) {
    console.log('[Push] Token already synced');
    return;
  }

  await api.post(PUSH_TOKEN_ENDPOINT, payload).catch((error) => {
    console.error('[Push] Failed to send token to backend', error);
    throw error;
  });

  localStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify(payload));
  console.log('[Push] Token synced');
}

function getCachedToken(): CachedToken | null {
  const raw = localStorage.getItem(TOKEN_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedToken;
  } catch (error) {
    console.warn('[Push] Failed to parse cached token', error);
    return null;
  }
}

// Laravel Echo — connects to Reverb via Pusher protocol

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { getAuthToken } from '@/services/api';

(window as any).Pusher = Pusher;

let echoInstance: Echo<'reverb'> | null = null;

export function initEcho() {
  if (echoInstance) {
    console.log('[Echo] Already initialized');
    return;
  }

  const token = getAuthToken();
  if (!token) {
    console.warn('[Echo] No auth token, skipping init');
    return;
  }

  const host = import.meta.env.VITE_REVERB_HOST;
  const key = import.meta.env.VITE_REVERB_APP_KEY;
  const port = import.meta.env.VITE_REVERB_PORT ?? 443;
  const scheme = import.meta.env.VITE_REVERB_SCHEME ?? 'https';
  const authEndpoint = `${import.meta.env.VITE_API_BASE_URL}/api/m/broadcasting/auth`;

  console.log(`[Echo] Connecting to ${scheme}://${host}:${port} (key: ${key?.slice(0, 8)}...)`);
  console.log(`[Echo] Auth endpoint: ${authEndpoint}`);

  // Enable Pusher logging in dev
  Pusher.logToConsole = true;

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key,
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === 'https',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    authEndpoint,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });

  console.log('[Echo] Instance created');
}

export function disconnectEcho() {
  if (echoInstance) {
    console.log('[Echo] Disconnecting');
    echoInstance.disconnect();
    echoInstance = null;
  }
}

export function getEcho(): Echo<'reverb'> | null {
  return echoInstance;
}

// Channel helpers matching backend broadcasting channels
// Note: Echo's .private() adds the "private-" prefix automatically
// Backend broadcasts MessageSent on "chat.room.{roomId}" for both DMs and community rooms
export const echoChannels = {
  chatRoom: (roomId: string) => `chat.room.${roomId}`,
  dm: (roomId: string) => `chat.room.${roomId}`,
  userNotifications: (userId: string) => `user.${userId}`,
};

// Event names matching backend broadcast events
export const echoEvents = {
  messageSent: 'message.sent',
  reactionUpdated: 'chat.reaction.updated',
  messageRead: 'message.read',
  userOnlineStatus: 'user.online.status',
  userTyping: 'user.typing',
  notificationCreated: 'notification.created',
  meetingStarted: 'meeting.started',
  meetingEnded: 'meeting.ended',
  sessionEnded: 'coaching.session.ended',
};

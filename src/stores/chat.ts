import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ChatRoom, ChatRoomType, ChatMessage, DirectMessageConversation } from '@/types';
import api from '@/services/api';
import { useAuthStore } from './auth';
import { getEcho, echoChannels, echoEvents } from '@/services/echo';

export const useChatStore = defineStore('chat', () => {
  const rooms = ref<ChatRoom[]>([]);
  const messages = ref<Record<string, ChatMessage[]>>({});
  const threadMessages = ref<Record<string, ChatMessage[]>>({});
  const directMessages = ref<DirectMessageConversation[]>([]);
  const dmMessages = ref<Record<string, ChatMessage[]>>({});
  const loading = ref(false);
  const error = ref<string | null>(null);
  const activeChannels = new Set<string>();

  function subscribeToChatRoom(communityId: string) {
    const echo = getEcho();
    const channelName = echoChannels.chatRoom(communityId);
    if (!echo) { console.warn('[WS] No echo instance for room', communityId); return; }
    if (activeChannels.has(channelName)) { console.log('[WS] Already subscribed to', channelName); return; }
    console.log('[WS] Subscribing to', channelName);
    activeChannels.add(channelName);

    echo.private(channelName).listen(`.${echoEvents.messageSent}`, (e: any) => {
      const m = (typeof e.message === 'object' && e.message?.id) ? e.message : e;
      console.log('[WS] Room message:', m.id, m.message);
      const userId = getCurrentUserId();
      const msg: ChatMessage = {
        id: m.id ?? `ws-${Date.now()}`,
        chat_room_id: communityId,
        user_id: m.user_id ?? m.user?.id ?? '',
        message: typeof m.message === 'string' ? m.message : m.content ?? '',
        message_type: m.message_type ?? 'text',
        is_edited: false,
        is_deleted: false,
        created_at: m.created_at ?? new Date().toISOString(),
        user: m.user ?? undefined,
        reactions: [],
        isOwn: (m.user_id ?? m.user?.id) === userId,
        threadCount: 0,
      };
      if (!messages.value[communityId]) messages.value[communityId] = [];
      // Avoid duplicates (e.g. optimistic message already added)
      const exists = messages.value[communityId].some((m) => m.id === msg.id);
      if (!exists) {
        messages.value[communityId].push(msg);
      }
    });
  }

  function subscribeToDm(roomId: string) {
    const echo = getEcho();
    const channelName = echoChannels.dm(roomId);
    if (!echo) { console.warn('[WS] No echo instance for DM', roomId); return; }
    if (activeChannels.has(channelName)) { console.log('[WS] Already subscribed to', channelName); return; }
    console.log('[WS] Subscribing to', channelName);
    activeChannels.add(channelName);

    const dmChannel = echo.private(channelName);

    // Catch-all: log every event on this channel to find the real event name
    const pusherChannel = (dmChannel as any).subscription;
    if (pusherChannel?.bind_global) {
      pusherChannel.bind_global((eventName: string, data: any) => {
        console.log(`[WS] DM raw event: "${eventName}"`, JSON.stringify(data).slice(0, 300));
      });
    } else {
      console.warn('[WS] Could not bind_global on DM channel');
    }

    dmChannel.listen(`.${echoEvents.messageSent}`, (e: any) => {
      console.log('[WS] DM raw event keys:', Object.keys(e));
      // The event may arrive as { message: { ...msgObj } } or as the message object directly
      const m = (typeof e.message === 'object' && e.message?.id) ? e.message : e;
      console.log('[WS] DM parsed message:', m.id, m.message);
      const userId = getCurrentUserId();
      const msg: ChatMessage = {
        id: m.id ?? `ws-${Date.now()}`,
        chat_room_id: roomId,
        user_id: m.user_id ?? m.user?.id ?? '',
        message: typeof m.message === 'string' ? m.message : m.content ?? '',
        message_type: m.message_type ?? 'text',
        is_edited: false,
        is_deleted: false,
        created_at: m.created_at ?? new Date().toISOString(),
        user: m.user ?? undefined,
        reactions: [],
        isOwn: (m.user_id ?? m.user?.id) === userId,
        threadCount: 0,
      };
      if (!dmMessages.value[roomId]) dmMessages.value[roomId] = [];
      const exists = dmMessages.value[roomId].some((m) => m.id === msg.id);
      if (!exists) {
        dmMessages.value[roomId].push(msg);
      }
    });
  }

  function leaveChannel(channelName: string) {
    const echo = getEcho();
    if (echo && activeChannels.has(channelName)) {
      echo.leave(channelName);
      activeChannels.delete(channelName);
    }
  }

  function leaveAllChannels() {
    const echo = getEcho();
    if (echo) {
      activeChannels.forEach((ch) => echo.leave(ch));
      activeChannels.clear();
    }
  }

  function getCurrentUserId(): string {
    const auth = useAuthStore();
    return auth.user?.id ?? '';
  }

  function getCurrentUser() {
    const auth = useAuthStore();
    return auth.user;
  }

  const totalUnread = computed(() => {
    const roomUnread = rooms.value.reduce((sum, r) => sum + (r.unreadCount || 0), 0);
    const dmUnread = directMessages.value.reduce((sum, dm) => sum + dm.unreadCount, 0);
    return roomUnread + dmUnread;
  });

  const favoriteRooms = computed(() => rooms.value.filter((r) => r.isFavorite));
  const communityRooms = computed(() => rooms.value.filter((r) => r.type === 'community'));

  async function fetchRooms() {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.get('/api/m/my-communities');
      const communities = data.communities?.data ?? data.data ?? [];
      rooms.value = communities.map((c: any) => ({
        id: c.id,
        tenant_id: '',
        community_id: c.id,
        name: c.name,
        description: c.short_description,
        type: 'community' as ChatRoomType,
        is_private: false,
        is_active: true,
        message_count: 0,
        last_message_at: undefined,
        isFavorite: c.is_favorite ?? false,
        unreadCount: 0,
        lastMessage: undefined,
        isMuted: false,
      }));
    } catch (err: any) {
      error.value = `Communities: ${err.response?.data?.message || err.message}`;
    } finally {
      loading.value = false;
    }
  }

  async function fetchDirectMessages() {
    try {
      const { data } = await api.get('/api/m/dm');
      const dms = data.dms ?? data.data ?? [];
      directMessages.value = dms.map((dm: any) => ({
        id: dm.id,
        participant: dm.with_user ?? dm.participant ?? {
          id: '', name: dm.name ?? 'Unknown', email: '', role: 'member' as const, tenant_id: '', created_at: '',
        },
        lastMessage: dm.last_message_at ? { text: '', senderName: '', timestamp: dm.last_message_at } : undefined,
        unreadCount: dm.unread_count ?? 0,
      }));
    } catch (err: any) {
      error.value = `DMs: ${err.response?.data?.message || err.message}`;
    }
  }

  async function fetchRoomMessages(communityId: string, _roomId: string) {
    const userId = getCurrentUserId();
    error.value = null;
    try {
      const { data } = await api.get(`/api/m/communities/${communityId}/feed`, {
        params: { per_page: 50 },
      });
      const posts = Array.isArray(data.posts) ? data.posts
        : data.posts?.data
        ?? data.messages?.data
        ?? (Array.isArray(data.messages) ? data.messages : null)
        ?? data.data
        ?? [];
      debugInfo.value = `Feed keys: ${Object.keys(data).join(', ')} | Posts: ${posts.length}`;
      messages.value[communityId] = posts.map((p: any) => ({
        id: p.id,
        chat_room_id: communityId,
        user_id: p.author?.id ?? '',
        message: p.content ?? '',
        message_type: 'text' as const,
        is_edited: false,
        is_deleted: false,
        created_at: p.created_at,
        user: p.author ? {
          id: p.author.id, name: p.author.name, email: '',
          avatar_url: p.author.avatar_url, role: p.author.role ?? 'member',
          tenant_id: '', created_at: p.created_at,
        } : undefined,
        reactions: [],
        isOwn: p.author?.id === userId,
        threadCount: p.comments_count ?? 0,
      }));
      subscribeToChatRoom(communityId);
    } catch (err: any) {
      error.value = `Feed (${communityId}): ${err.response?.status} ${err.response?.data?.message || err.message}`;
    }
  }

  const debugInfo = ref<string | null>(null);

  async function fetchDmMessages(roomId: string) {
    const userId = getCurrentUserId();
    error.value = null;
    try {
      const { data } = await api.get(`/api/m/dm/${roomId}/messages`);
      debugInfo.value = `Keys: ${Object.keys(data).join(', ')} | Type: ${Array.isArray(data) ? 'array' : typeof data} | Count: ${(data.data ?? data.messages?.data ?? data).length ?? '?'}`;
      const msgs = Array.isArray(data.messages) ? data.messages : data.messages?.data ?? data.data ?? [];
      dmMessages.value[roomId] = msgs.map((m: any) => ({
        id: m.id,
        chat_room_id: roomId,
        user_id: m.user_id ?? m.author?.id ?? '',
        message: m.content ?? m.message ?? '',
        message_type: m.type ?? 'text',
        is_edited: false,
        is_deleted: false,
        created_at: m.created_at,
        user: m.user ?? m.author,
        reactions: [],
        isOwn: (m.user_id ?? m.author?.id) === userId,
        threadCount: 0,
      }));
      subscribeToDm(roomId);
    } catch (err: any) {
      error.value = `Messages: ${err.response?.data?.message || err.message}`;
    }
  }

  function getRoomMessages(roomId: string) { return messages.value[roomId] || []; }
  function getThreadMessages(messageId: string) { return threadMessages.value[messageId] || []; }
  function getDmMessages(roomId: string) { return dmMessages.value[roomId] || []; }

  async function sendMessage(roomId: string, text: string) {
    const user = getCurrentUser();
    const optimistic: ChatMessage = {
      id: `msg-${Date.now()}`, chat_room_id: roomId, user_id: user?.id ?? '',
      message: text, message_type: 'text', is_edited: false, is_deleted: false,
      created_at: new Date().toISOString(), user: user ?? undefined,
      reactions: [], isOwn: true, threadCount: 0,
    };
    if (!messages.value[roomId]) messages.value[roomId] = [];
    messages.value[roomId].push(optimistic);

    try {
      const { data } = await api.post(`/api/m/communities/${roomId}/feed`, { content: text });
      const post = (typeof data.post === 'object' && data.post) ? data.post : (typeof data.message === 'object' && data.message) ? data.message : data.data ?? data;
      const idx = messages.value[roomId].indexOf(optimistic);
      if (idx >= 0) {
        messages.value[roomId][idx] = {
          ...optimistic,
          id: post.id ?? optimistic.id,
          created_at: post.created_at ?? optimistic.created_at,
        };
      }
    } catch (err: any) {
      error.value = `Send: ${err.response?.data?.message || err.message}`;
    }
  }

  async function sendDm(roomId: string, text: string) {
    const user = getCurrentUser();
    const optimistic: ChatMessage = {
      id: `dm-msg-${Date.now()}`, chat_room_id: roomId, user_id: user?.id ?? '',
      message: text, message_type: 'text', is_edited: false, is_deleted: false,
      created_at: new Date().toISOString(), user: user ?? undefined,
      reactions: [], isOwn: true, threadCount: 0,
    };
    if (!dmMessages.value[roomId]) dmMessages.value[roomId] = [];
    dmMessages.value[roomId].push(optimistic);

    try {
      const { data } = await api.post(`/api/m/dm/${roomId}/messages`, { message: text, type: 'text' });
      // API may return { message: { ...msg } } or { data: { ...msg } } or the msg directly
      const msg = (typeof data.message === 'object' && data.message) ? data.message : data.data ?? data;
      const idx = dmMessages.value[roomId].indexOf(optimistic);
      if (idx >= 0) {
        dmMessages.value[roomId][idx] = {
          ...optimistic,
          id: msg.id ?? optimistic.id,
          created_at: msg.created_at ?? optimistic.created_at,
        };
      }
    } catch (err: any) {
      error.value = `Send: ${err.response?.data?.message || err.message}`;
    }
  }

  function sendThreadReply(parentMessageId: string, text: string) {
    const user = getCurrentUser();
    const msg: ChatMessage = {
      id: `thread-${Date.now()}`, chat_room_id: '', user_id: user?.id ?? '',
      message: text, message_type: 'text', reply_to_message_id: parentMessageId,
      is_edited: false, is_deleted: false, created_at: new Date().toISOString(),
      user: user ?? undefined, reactions: [], isOwn: true, threadCount: 0,
    };
    if (!threadMessages.value[parentMessageId]) threadMessages.value[parentMessageId] = [];
    threadMessages.value[parentMessageId].push(msg);
  }

  function toggleFavorite(roomId: string) {
    const r = rooms.value.find((rm) => rm.id === roomId);
    if (r) {
      r.isFavorite = !r.isFavorite;
      api.post(`/api/m/my-communities/${roomId}/toggle-favorite`).catch(() => {
        if (r) r.isFavorite = !r.isFavorite;
      });
    }
  }

  return {
    rooms, directMessages, totalUnread, favoriteRooms, communityRooms, loading, error, debugInfo,
    fetchRooms, fetchDirectMessages, fetchRoomMessages, fetchDmMessages,
    getRoomMessages, getThreadMessages, getDmMessages,
    sendMessage, sendDm, sendThreadReply, toggleFavorite,
    leaveChannel, leaveAllChannels,
  };
});

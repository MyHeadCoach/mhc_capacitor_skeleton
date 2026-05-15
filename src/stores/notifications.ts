import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { NotificationSettings } from '@/types';

const SETTINGS_KEY = 'notification_settings';

const defaults: NotificationSettings = {
  globalEnabled: true,
  coachSettings: {},
  mutedChannels: [],
  quietHoursEnabled: false,
  quietHoursStart: '21:00',
  quietHoursEnd: '07:00',
};

export const useNotificationsStore = defineStore('notifications', () => {
  const settings = ref<NotificationSettings>(loadSettings());

  function loadSettings(): NotificationSettings {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* fall through */ }
    }
    return { ...defaults };
  }

  function persist() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value));
  }

  function toggleGlobal() {
    settings.value.globalEnabled = !settings.value.globalEnabled;
    persist();
  }

  function toggleCoach(coachId: string) {
    const s = settings.value.coachSettings[coachId];
    if (s) { s.enabled = !s.enabled; }
    else { settings.value.coachSettings[coachId] = { enabled: true, tradesOnly: false }; }
    persist();
  }

  function toggleCoachTradesOnly(coachId: string) {
    const s = settings.value.coachSettings[coachId];
    if (s) s.tradesOnly = !s.tradesOnly;
    persist();
  }

  function toggleChannelMute(channelId: string) {
    const idx = settings.value.mutedChannels.indexOf(channelId);
    if (idx >= 0) settings.value.mutedChannels.splice(idx, 1);
    else settings.value.mutedChannels.push(channelId);
    persist();
  }

  function toggleQuietHours() {
    settings.value.quietHoursEnabled = !settings.value.quietHoursEnabled;
    persist();
  }

  function setQuietHours(start: string, end: string) {
    settings.value.quietHoursStart = start;
    settings.value.quietHoursEnd = end;
    persist();
  }

  return {
    settings, toggleGlobal, toggleCoach, toggleCoachTradesOnly,
    toggleChannelMute, toggleQuietHours, setQuietHours,
  };
});

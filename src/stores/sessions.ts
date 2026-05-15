import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { CoachingSession } from '@/types';
import api from '@/services/api';

export const useSessionsStore = defineStore('sessions', () => {
  const sessions = ref<CoachingSession[]>([]);
  const loading = ref(false);

  async function fetchSessions() {
    loading.value = true;
    try {
      // Fetch live streams from dashboard
      const { data: dashData } = await api.get('/api/m/dashboard');
      const liveStreams = (dashData.liveStreams ?? []).map((s: any) => ({
        id: s.id,
        tenant_id: '',
        coach_id: '',
        title: s.title,
        description: s.description,
        scheduled_at: s.started_at,
        started_at: s.started_at,
        status: 'live' as const,
        room_type: s.type ?? 'broadcast',
        is_recording_enabled: false,
        coach: { id: '', name: s.host_name, email: '', role: 'coach' as const, tenant_id: '', created_at: '' },
        reminderEnabled: true,
      }));

      // Fetch upcoming events
      let upcoming: CoachingSession[] = [];
      try {
        const { data: eventsData } = await api.get('/api/m/events', { params: { filter: 'upcoming' } });
        const events = eventsData.events?.data ?? [];
        upcoming = events.map((e: any) => ({
          id: e.id,
          tenant_id: '',
          coach_id: e.host?.id ?? '',
          title: e.title,
          description: e.description,
          scheduled_at: e.scheduled_at,
          status: 'scheduled' as const,
          room_type: e.type ?? 'meeting',
          is_recording_enabled: false,
          coach: e.host ? {
            id: e.host.id, name: e.host.name, avatar_url: e.host.avatar_url,
            email: '', role: 'coach' as const, tenant_id: '', created_at: '',
          } : undefined,
          reminderEnabled: true,
        }));
      } catch {
        // Events endpoint may not be available
      }

      sessions.value = [...liveStreams, ...upcoming];
    } catch {
      // No data available
    } finally {
      loading.value = false;
    }
  }

  function toggleReminder(sessionId: string) {
    const session = sessions.value.find((s) => s.id === sessionId);
    if (session) session.reminderEnabled = !session.reminderEnabled;
  }

  return { sessions, loading, fetchSessions, toggleReminder };
});

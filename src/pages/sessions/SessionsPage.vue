<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Live Sessions</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <div class="px-4 py-4 space-y-3">
        <LoadingSpinner v-if="store.loading" message="Loading sessions..." />
        <template v-else>
          <div
            v-for="session in store.sessions"
            :key="session.id"
            class="bg-slate-800/50 border border-slate-700 rounded-2xl p-4"
          >
            <div class="flex items-start justify-between mb-2">
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base font-semibold text-white">{{ session.title }}</h3>
                  <AppBadge v-if="session.status === 'live'" variant="red" size="xs" dot>LIVE</AppBadge>
                </div>
                <div class="text-sm text-slate-400 mt-0.5">{{ session.coach?.name }}</div>
              </div>
            </div>
            <div class="text-xs text-slate-500 mb-3">
              <Calendar class="w-3 h-3 inline mr-1" />
              {{ formatSessionTime(session.scheduled_at) }}
            </div>
            <div class="flex items-center gap-3">
              <AppButton v-if="session.status === 'live'" size="sm">Join Now</AppButton>
              <button
                class="flex items-center gap-1 text-sm"
                :class="session.reminderEnabled ? 'text-emerald-400' : 'text-slate-500'"
                @click="store.toggleReminder(session.id)"
              >
                <BellRing class="w-4 h-4" />
                {{ session.reminderEnabled ? 'Reminder on' : 'Reminder off' }}
              </button>
            </div>
          </div>
          <EmptyState
            v-if="store.sessions.length === 0"
            :icon="Video"
            title="No Sessions Scheduled"
            description="Upcoming sessions will appear here."
          />
        </template>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
import { Video, Calendar, BellRing } from 'lucide-vue-next';
import dayjs from 'dayjs';
import { useSessionsStore } from '@/stores/sessions';
import AppButton from '@/components/AppButton.vue';
import AppBadge from '@/components/AppBadge.vue';
import EmptyState from '@/components/EmptyState.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

const store = useSessionsStore();

function formatSessionTime(date?: string) {
  if (!date) return 'TBD';
  return dayjs(date).format('ddd, MMM D [at] h:mm A');
}

onMounted(() => store.fetchSessions());
</script>

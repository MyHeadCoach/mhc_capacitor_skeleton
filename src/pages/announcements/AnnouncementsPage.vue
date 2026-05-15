<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>News</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <div class="px-4 py-4 space-y-3">
        <LoadingSpinner v-if="store.loading" message="Loading news..." />
        <template v-else>
          <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2" v-if="store.communityName">
            {{ store.communityName }}
          </div>
          <div
            v-for="post in store.posts"
            :key="post.id"
            class="bg-slate-800/50 border border-slate-700 rounded-2xl p-4"
          >
            <div class="flex items-center gap-2 mb-2">
              <AvatarCircle :src="post.author?.avatar_url" :name="post.author?.name" size="sm" />
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-white">{{ post.author?.name }}</div>
                <div class="text-xs text-slate-500">{{ formatDate(post.created_at) }}</div>
              </div>
              <AppBadge v-if="post.is_pinned" variant="orange" size="xs">Pinned</AppBadge>
            </div>
            <p class="text-sm text-slate-300 whitespace-pre-line">{{ post.content }}</p>
            <div class="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <button
                class="flex items-center gap-1"
                :class="post.is_liked ? 'text-emerald-400' : 'text-slate-500'"
              >
                <Heart class="w-3.5 h-3.5" :class="post.is_liked ? 'fill-emerald-400' : ''" />
                {{ post.likes_count }}
              </button>
              <span class="flex items-center gap-1">
                <MessageCircle class="w-3.5 h-3.5" />
                {{ post.comments_count }}
              </span>
            </div>
          </div>
          <EmptyState
            v-if="store.posts.length === 0"
            :icon="Megaphone"
            title="No Posts"
            description="Community posts will appear here."
          />
        </template>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
import { Megaphone, Heart, MessageCircle } from 'lucide-vue-next';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useAnnouncementsStore } from '@/stores/announcements';
import AvatarCircle from '@/components/AvatarCircle.vue';
import AppBadge from '@/components/AppBadge.vue';
import EmptyState from '@/components/EmptyState.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

dayjs.extend(relativeTime);

const store = useAnnouncementsStore();

function formatDate(date?: string) {
  if (!date) return '';
  return dayjs(date).fromNow();
}

onMounted(() => store.fetchAnnouncements());
</script>

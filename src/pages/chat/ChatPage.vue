<template>
  <IonPage>
    <IonHeader class="bg-slate-900">
      <IonToolbar class="bg-transparent px-4 pb-2 pt-6">
        <IonTitle class="text-white text-2xl font-semibold">Chat</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent class="bg-slate-900">
      <div class="px-4 pt-2 pb-8 space-y-6">
        <section class="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-[0_25px_55px_rgba(2,6,23,0.5)]">
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">Conversations</p>
              <h2 class="mt-1 text-xl font-semibold text-white">Stay in sync with your communities</h2>
            </div>
          </div>
          <div class="relative">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              v-model="search"
              type="text"
              class="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-800/70 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
              placeholder="Search channels or DMs"
            />
          </div>
        </section>

        <div v-if="store.error" class="bg-red-500/10 border border-red-500/50 rounded-2xl p-4 text-sm text-red-300">
          {{ store.error }}
        </div>

        <LoadingSpinner v-if="store.loading" message="Loading channels..." />
        <template v-else>
          <section v-if="store.favoriteRooms.length" class="space-y-3">
            <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em] px-1">Favorites</h3>
            <div class="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-3 space-y-2">
              <template v-for="(room, idx) in store.favoriteRooms" :key="room.id">
                <ChannelItem
                  :room="room"
                  @click="router.push(`/tabs/chat/channel/${room.id}`)"
                />
                <div v-if="idx < store.favoriteRooms.length - 1" class="flex justify-center">
                  <span class="block h-px w-[70%] bg-slate-800/70"></span>
                </div>
              </template>
            </div>
          </section>

          <section v-if="filteredRooms.length" class="space-y-3">
            <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em] px-1">Channels</h3>
            <div class="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-3 space-y-2">
              <template v-for="(room, idx) in filteredRooms" :key="room.id">
                <ChannelItem
                  :room="room"
                  @click="router.push(`/tabs/chat/channel/${room.id}`)"
                />
                <div v-if="idx < filteredRooms.length - 1" class="flex justify-center">
                  <span class="block h-px w-[70%] bg-slate-800/70"></span>
                </div>
              </template>
            </div>
          </section>

          <section v-if="store.directMessages.length" class="space-y-3">
            <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em] px-1">Direct Messages</h3>
            <div class="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-3 space-y-2">
              <template v-for="(dm, idx) in store.directMessages" :key="dm.id">
                <button
                  class="w-full flex items-center gap-4 px-4 py-4 rounded-2xl border border-slate-800/60 bg-slate-900/60 transition-colors hover:border-slate-700 hover:bg-slate-900/80"
                  @click="router.push(`/tabs/chat/dm/${dm.id}`)"
                >
                  <AvatarCircle :src="dm.participant?.avatar_url" :name="dm.participant?.name" size="sm" />
                  <div class="flex-1 min-w-0 text-left">
                    <div class="text-sm font-semibold text-white">{{ dm.participant?.name }}</div>
                    <div v-if="dm.lastMessage" class="text-xs text-slate-400 truncate">{{ dm.lastMessage.text }}</div>
                  </div>
                  <span
                    v-if="dm.unreadCount > 0"
                    class="min-w-[24px] h-6 bg-emerald-500 text-white text-xs font-semibold rounded-full flex items-center justify-center px-2"
                  >
                    {{ dm.unreadCount }}
                  </span>
                </button>
                <div v-if="idx < store.directMessages.length - 1" class="flex justify-center">
                  <span class="block h-px w-[70%] bg-slate-800/70"></span>
                </div>
              </template>
            </div>
          </section>

          <EmptyState
            v-if="!store.communityRooms.length && !store.directMessages.length"
            :icon="MessageCircleIcon"
            title="No Channels"
            description="Chat channels will appear here."
          />
        </template>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
import { MessageCircle as MessageCircleIcon, Search } from 'lucide-vue-next';
import { useChatStore } from '@/stores/chat';
import AvatarCircle from '@/components/AvatarCircle.vue';
import ChannelItem from '@/pages/chat/ChannelItem.vue';
import EmptyState from '@/components/EmptyState.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

const router = useRouter();
const store = useChatStore();
const search = ref('');

const filteredRooms = computed(() => {
  const all = store.communityRooms;
  if (!search.value) return all;
  return all.filter((r) => r.name.toLowerCase().includes(search.value.toLowerCase()));
});

onMounted(() => {
  store.fetchRooms();
  store.fetchDirectMessages();
});
</script>

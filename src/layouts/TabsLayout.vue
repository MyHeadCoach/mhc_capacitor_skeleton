<template>
  <IonPage>
    <IonTabs>
      <IonRouterOutlet />
      <IonTabBar slot="bottom">
        <IonTabButton tab="trades" href="/tabs/trades">
          <TrendingUp class="w-6 h-6" />
          <IonLabel>Trades</IonLabel>
        </IonTabButton>
        <IonTabButton tab="chat" href="/tabs/chat">
          <MessageCircle class="w-6 h-6" />
          <IonLabel>Chat</IonLabel>
          <IonBadge v-if="totalUnread > 0" color="danger">{{ totalUnread > 99 ? '99+' : totalUnread }}</IonBadge>
        </IonTabButton>
        <IonTabButton tab="announcements" href="/tabs/announcements">
          <Megaphone class="w-6 h-6" />
          <IonLabel>News</IonLabel>
        </IonTabButton>
        <IonTabButton tab="sessions" href="/tabs/sessions">
          <Video class="w-6 h-6" />
          <IonLabel>Live</IonLabel>
        </IonTabButton>
        <IonTabButton tab="profile" href="/tabs/profile">
          <UserIcon class="w-6 h-6" />
          <IonLabel>Profile</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  </IonPage>
</template>

<script setup lang="ts">
import { IonPage, IonTabs, IonTabBar, IonTabButton, IonRouterOutlet, IonLabel, IonBadge } from '@ionic/vue';
import { TrendingUp, MessageCircle, Megaphone, Video, User as UserIcon } from 'lucide-vue-next';
import { useChatStore } from '@/stores/chat';
import { computed } from 'vue';

const chatStore = useChatStore();
const totalUnread = computed(() => chatStore.totalUnread);
</script>

<style scoped>
ion-tab-button {
  --color: rgb(148 163 184);
  --color-selected: rgb(16 185 129);
}
ion-tab-bar {
  --background: rgb(15 23 42);
  --border: rgb(30 41 59);
}
</style>

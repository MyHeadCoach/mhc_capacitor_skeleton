<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton default-href="/tabs/profile" />
        </IonButtons>
        <IonTitle>Notifications</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <div class="px-4 py-4 space-y-4">
        <!-- Global toggle -->
        <MenuSection title="General">
          <div class="flex items-center justify-between px-4 py-3">
            <span class="text-white text-sm">Push Notifications</span>
            <IonToggle :checked="settings.globalEnabled" @ionChange="notifStore.toggleGlobal()" />
          </div>
        </MenuSection>

        <!-- Channel mutes -->
        <MenuSection title="Channels">
          <div v-for="room in rooms" :key="room.id" class="flex items-center justify-between px-4 py-3 border-b border-slate-700 last:border-0">
            <span class="text-white text-sm">#{{ room.name }}</span>
            <IonToggle
              :checked="!settings.mutedChannels.includes(room.id)"
              @ionChange="notifStore.toggleChannelMute(room.id)"
            />
          </div>
        </MenuSection>

        <!-- Quiet hours -->
        <MenuSection title="Quiet Hours">
          <div class="px-4 py-3">
            <div class="flex items-center justify-between mb-3">
              <span class="text-white text-sm">Enable Quiet Hours</span>
              <IonToggle :checked="settings.quietHoursEnabled" @ionChange="notifStore.toggleQuietHours()" />
            </div>
            <div v-if="settings.quietHoursEnabled" class="flex items-center gap-3 text-sm">
              <div>
                <span class="text-slate-400">From</span>
                <span class="ml-1 text-white">{{ settings.quietHoursStart }}</span>
              </div>
              <div>
                <span class="text-slate-400">To</span>
                <span class="ml-1 text-white">{{ settings.quietHoursEnd }}</span>
              </div>
            </div>
          </div>
        </MenuSection>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons, IonToggle } from '@ionic/vue';
import { useNotificationsStore } from '@/stores/notifications';
import { useChatStore } from '@/stores/chat';
import MenuSection from '@/components/MenuSection.vue';

const notifStore = useNotificationsStore();
const chatStore = useChatStore();

const settings = notifStore.settings;
const rooms = chatStore.communityRooms;
</script>

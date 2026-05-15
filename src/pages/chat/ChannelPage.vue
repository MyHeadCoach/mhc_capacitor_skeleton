<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton default-href="/tabs/chat" />
        </IonButtons>
        <IonTitle># {{ room?.name ?? 'Channel' }}</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent ref="contentRef">
      <div class="px-4 py-4 space-y-4">
        <div v-if="store.error" class="mb-4 bg-red-500/10 border border-red-500/50 rounded-xl p-3 text-sm text-red-300">
          {{ store.error }}
        </div>

        <div v-if="store.debugInfo" class="mb-4 bg-blue-500/10 border border-blue-500/50 rounded-xl p-3 text-xs text-blue-300 font-mono">
          {{ store.debugInfo }}
        </div>

        <LoadingSpinner v-if="loading" message="Loading messages..." />
        <template v-else>
          <MessageBubble
            v-for="msg in messages"
            :key="msg.id"
            :message="msg"
            @thread-click="openThread"
          />
          <EmptyState
            v-if="messages.length === 0"
            :icon="MessageCircleIcon"
            title="No messages yet"
            description="Be the first to send a message!"
          />
        </template>
      </div>
    </IonContent>
    <IonFooter>
      <MessageInput @send="handleSend" />
    </IonFooter>
  </IonPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonBackButton, IonButtons } from '@ionic/vue';
import { MessageCircle as MessageCircleIcon } from 'lucide-vue-next';
import { useChatStore } from '@/stores/chat';
import MessageBubble from '@/components/MessageBubble.vue';
import MessageInput from '@/components/MessageInput.vue';
import EmptyState from '@/components/EmptyState.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

const route = useRoute();
const router = useRouter();
const store = useChatStore();
const roomId = route.params.channelId as string;
const loading = ref(false);
const contentRef = ref<InstanceType<typeof IonContent> | null>(null);

const room = computed(() => store.rooms.find((r) => r.id === roomId));
const messages = computed(() => store.getRoomMessages(roomId));

function scrollToBottom() {
  nextTick(() => {
    contentRef.value?.$el?.scrollToBottom?.(300);
  });
}

onMounted(async () => {
  loading.value = true;
  await store.fetchRoomMessages(roomId, roomId);
  loading.value = false;
  scrollToBottom();
});

watch(() => messages.value.length, () => {
  scrollToBottom();
});

function handleSend(text: string) {
  store.sendMessage(roomId, text);
  scrollToBottom();
}

function openThread(messageId: string) {
  router.push(`/tabs/chat/channel/${roomId}/thread/${messageId}`);
}
</script>

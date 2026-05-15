<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton default-href="/tabs/chat" />
        </IonButtons>
        <IonTitle>{{ dm?.participant.name ?? 'Message' }}</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent ref="contentRef">
      <div class="px-4 py-4 space-y-4">
        <div v-if="store.error" class="mb-4 bg-red-500/10 border border-red-500/50 rounded-xl p-3 text-sm text-red-300">
          {{ store.error }}
        </div>

        <LoadingSpinner v-if="loading" message="Loading messages..." />
        <template v-else>
          <MessageBubble v-for="msg in messages" :key="msg.id" :message="msg" />
          <EmptyState
            v-if="messages.length === 0"
            :icon="MessageCircleIcon"
            title="No messages yet"
            description="Send a message to start the conversation."
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
import { useRoute } from 'vue-router';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonBackButton, IonButtons } from '@ionic/vue';
import { MessageCircle as MessageCircleIcon } from 'lucide-vue-next';
import { useChatStore } from '@/stores/chat';
import MessageBubble from '@/components/MessageBubble.vue';
import MessageInput from '@/components/MessageInput.vue';
import EmptyState from '@/components/EmptyState.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

const route = useRoute();
const store = useChatStore();
const roomId = route.params.userId as string;
const loading = ref(false);
const contentRef = ref<InstanceType<typeof IonContent> | null>(null);

const dm = computed(() => store.directMessages.find((d) => d.id === roomId));
const messages = computed(() => store.getDmMessages(roomId));

function scrollToBottom() {
  nextTick(() => {
    contentRef.value?.$el?.scrollToBottom?.(300);
  });
}

onMounted(async () => {
  loading.value = true;
  await store.fetchDmMessages(roomId);
  loading.value = false;
  scrollToBottom();
});

watch(() => messages.value.length, () => {
  scrollToBottom();
});

function handleSend(text: string) {
  store.sendDm(roomId, text);
  scrollToBottom();
}
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton :default-href="`/tabs/chat/channel/${channelId}`" />
        </IonButtons>
        <IonTitle>Thread</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <div class="px-4 py-4 space-y-4">
        <div v-if="parentMessage" class="pb-3 border-b border-slate-700">
          <MessageBubble :message="parentMessage" />
        </div>
        <MessageBubble v-for="msg in replies" :key="msg.id" :message="msg" />
        <EmptyState
          v-if="replies.length === 0"
          :icon="MessageCircleIcon"
          title="No replies yet"
          description="Start the conversation!"
        />
      </div>
    </IonContent>
    <IonFooter>
      <MessageInput @send="sendReply" />
    </IonFooter>
  </IonPage>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonBackButton, IonButtons } from '@ionic/vue';
import { MessageCircle as MessageCircleIcon } from 'lucide-vue-next';
import { useChatStore } from '@/stores/chat';
import MessageBubble from '@/components/MessageBubble.vue';
import MessageInput from '@/components/MessageInput.vue';
import EmptyState from '@/components/EmptyState.vue';

const route = useRoute();
const store = useChatStore();
const channelId = route.params.channelId as string;
const messageId = route.params.messageId as string;

const parentMessage = computed(() => {
  const msgs = store.getRoomMessages(channelId);
  return msgs.find((m) => m.id === messageId);
});

const replies = computed(() => store.getThreadMessages(messageId));

function sendReply(text: string) {
  store.sendThreadReply(messageId, text);
}
</script>

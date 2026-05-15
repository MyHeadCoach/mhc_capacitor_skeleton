<template>
  <div class="flex gap-2" :class="message.isOwn ? 'flex-row-reverse' : ''">
    <AvatarCircle
      v-if="!message.isOwn"
      :src="message.user?.avatar_url"
      :name="message.user?.name"
      size="sm"
    />
    <div class="max-w-[75%]">
      <div v-if="!message.isOwn" class="flex items-center gap-2 mb-1">
        <span class="text-sm font-medium text-white">{{ message.user?.name }}</span>
        <AppBadge v-if="roleBadge" :variant="roleBadge.variant" size="xs">{{ roleBadge.label }}</AppBadge>
      </div>
      <div
        class="px-4 py-2 rounded-2xl text-sm text-white"
        :class="message.isOwn ? 'bg-emerald-600' : 'bg-slate-700'"
      >
        {{ message.message }}
      </div>
      <div class="flex items-center gap-2 mt-1" :class="message.isOwn ? 'justify-end' : ''">
        <span class="text-xs text-slate-500">{{ formattedTime }}</span>
        <button
          v-if="message.threadCount && message.threadCount > 0"
          class="text-xs text-emerald-400 hover:text-emerald-300"
          @click="$emit('thread-click', message.id)"
        >
          {{ message.threadCount }} {{ message.threadCount === 1 ? 'reply' : 'replies' }}
        </button>
      </div>
      <div v-if="message.reactions?.length" class="flex gap-1 mt-1">
        <button
          v-for="reaction in message.reactions"
          :key="reaction.emoji"
          class="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
          :class="reaction.reacted ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-slate-700 border border-slate-600'"
          @click="$emit('reaction-click', message.id, reaction.emoji)"
        >
          {{ reaction.emoji }} {{ reaction.count }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import AvatarCircle from './AvatarCircle.vue';
import AppBadge from './AppBadge.vue';
import type { ChatMessage } from '@/types';

dayjs.extend(relativeTime);

const props = defineProps<{ message: ChatMessage }>();

defineEmits<{
  (e: 'thread-click', messageId: string): void;
  (e: 'reaction-click', messageId: string, emoji: string): void;
}>();

const formattedTime = computed(() => dayjs(props.message.created_at).fromNow());

const roleBadge = computed(() => {
  const role = props.message.user?.role;
  if (role === 'head_coach') return { variant: 'purple' as const, label: 'Head Coach' };
  if (role === 'coach') return { variant: 'blue' as const, label: 'Coach' };
  return null;
});
</script>

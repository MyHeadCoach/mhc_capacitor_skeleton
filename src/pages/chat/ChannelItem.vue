<template>
  <button
    class="w-full flex items-center gap-4 px-4 py-4 rounded-2xl border border-slate-800/60 bg-slate-900/60 transition-colors hover:border-slate-700 hover:bg-slate-900/80"
    @click="$emit('click')"
  >
    <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center flex-shrink-0">
      <Hash class="w-5 h-5 text-slate-300" />
    </div>
    <div class="flex-1 min-w-0 text-left">
      <div class="text-sm font-semibold text-white">{{ room.name }}</div>
      <div v-if="room.lastMessage" class="text-xs text-slate-400 truncate">
        <span class="font-medium">{{ room.lastMessage.senderName }}:</span> {{ room.lastMessage.text }}
      </div>
    </div>
    <span
      v-if="room.unreadCount && room.unreadCount > 0"
      class="min-w-[24px] h-6 bg-emerald-500 text-white text-xs font-semibold rounded-full flex items-center justify-center px-2"
    >
      {{ room.unreadCount }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { Hash } from 'lucide-vue-next';
import type { ChatRoom } from '@/types';

defineProps<{ room: ChatRoom }>();
defineEmits<{ (e: 'click'): void }>();
</script>

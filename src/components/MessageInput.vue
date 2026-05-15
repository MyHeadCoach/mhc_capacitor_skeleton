<template>
  <div class="flex items-end gap-2 px-4 py-3 bg-slate-900 border-t border-slate-700">
    <button class="p-2 rounded-full hover:bg-slate-800 transition-colors" @click="$emit('attach')">
      <Paperclip class="w-5 h-5 text-slate-400" />
    </button>
    <textarea
      v-model="text"
      rows="1"
      class="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-base focus:outline-none focus:border-emerald-500 resize-none"
      placeholder="Type a message..."
      @keydown.enter.exact.prevent="send"
    ></textarea>
    <button
      class="p-2 rounded-full transition-colors"
      :class="text.trim() ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-slate-800'"
      :disabled="!text.trim()"
      @click="send"
    >
      <Send class="w-5 h-5" :class="text.trim() ? 'text-white' : 'text-slate-500'" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Send, Paperclip } from 'lucide-vue-next';

const text = ref('');

const emit = defineEmits<{
  (e: 'send', text: string): void;
  (e: 'attach'): void;
}>();

function send() {
  if (!text.value.trim()) return;
  emit('send', text.value.trim());
  text.value = '';
}
</script>

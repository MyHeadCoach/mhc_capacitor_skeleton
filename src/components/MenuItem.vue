<template>
  <button
    class="w-full flex items-center gap-4 px-4 py-4 text-left rounded-2xl border border-slate-800/60 bg-slate-900/60 transition-colors hover:border-slate-700 hover:bg-slate-900/80"
    @click="$emit('click')"
  >
    <component
      :is="icon"
      class="w-5 h-5 flex-shrink-0"
      :class="destructive ? 'text-red-400' : 'text-slate-400'"
    />
    <span class="flex-1 text-sm font-medium" :class="destructive ? 'text-red-400' : 'text-white'">{{ label }}</span>
    <AppBadge v-if="badge" variant="red" size="xs">{{ badge }}</AppBadge>
    <ChevronRight v-if="showChevron" class="w-5 h-5 text-slate-600" />
  </button>
</template>

<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next';
import AppBadge from './AppBadge.vue';
import type { Component } from 'vue';

withDefaults(defineProps<{
  icon: Component;
  label: string;
  badge?: number | string;
  showChevron?: boolean;
  destructive?: boolean;
}>(), {
  showChevron: true,
});

defineEmits<{ (e: 'click'): void }>();
</script>

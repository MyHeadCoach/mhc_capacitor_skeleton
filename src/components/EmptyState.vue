<template>
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div class="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
      <component :is="icon" class="w-8 h-8 text-slate-500" />
    </div>
    <h3 class="text-lg font-semibold text-slate-300">{{ title }}</h3>
    <p v-if="description" class="mt-2 text-sm text-slate-500 max-w-xs">{{ description }}</p>
    <AppButton v-if="actionLabel" class="mt-4" @click="$emit('action')">{{ actionLabel }}</AppButton>
  </div>
</template>

<script setup lang="ts">
import AppButton from './AppButton.vue';
import type { Component } from 'vue';

defineProps<{
  icon: Component;
  title: string;
  description?: string;
  actionLabel?: string;
}>();

defineEmits<{ (e: 'action'): void }>();
</script>

<template>
  <div
    class="rounded-full bg-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0"
    :class="sizeClass"
  >
    <img v-if="src" :src="src" class="w-full h-full object-cover" :alt="name" loading="lazy" />
    <span v-else class="font-medium text-slate-300" :class="textSizeClass">{{ initials }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type AvatarSize = 'sm' | 'md' | 'lg';

const props = withDefaults(defineProps<{
  src?: string;
  name?: string;
  size?: AvatarSize;
}>(), {
  size: 'md',
  name: '',
});

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'w-9 h-9',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

const textSizes: Record<AvatarSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
};

const sizeClass = computed(() => sizeClasses[props.size]);
const textSizeClass = computed(() => textSizes[props.size]);

const initials = computed(() => {
  if (!props.name) return '?';
  return props.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
});
</script>

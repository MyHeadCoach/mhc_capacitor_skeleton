<template>
  <div
    class="flex flex-col items-center justify-center"
    :class="fullScreen ? 'h-full' : ''"
  >
    <Loader2 class="animate-spin text-emerald-500" :class="sizeClass" />
    <p v-if="message" class="mt-3 text-sm text-slate-400">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Loader2 } from 'lucide-vue-next';

type SpinnerSize = 'sm' | 'md' | 'lg';

const props = withDefaults(defineProps<{
  size?: SpinnerSize;
  message?: string;
  fullScreen?: boolean;
}>(), {
  size: 'md',
});

const sizeMap: Record<SpinnerSize, string> = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

const sizeClass = computed(() => sizeMap[props.size]);
</script>

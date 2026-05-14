<template>
  <span :class="[badgeClasses, sizeClasses, pill ? 'rounded-full' : 'rounded-md']" class="inline-flex items-center gap-1 border font-semibold">
    <span v-if="dot" class="w-1.5 h-1.5 rounded-full" :class="dotClass"></span>
    <slot name="icon" />
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type BadgeVariant = 'emerald' | 'blue' | 'purple' | 'orange' | 'red' | 'yellow' | 'slate';
type BadgeSize = 'xs' | 'sm' | 'md';

const props = withDefaults(defineProps<{
  variant?: BadgeVariant;
  size?: BadgeSize;
  pill?: boolean;
  dot?: boolean;
}>(), {
  variant: 'slate',
  size: 'sm',
  pill: true,
});

const variantClasses: Record<BadgeVariant, string> = {
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  orange: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  red: 'bg-red-500/20 text-red-400 border-red-500/50',
  yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  slate: 'bg-slate-600/50 text-slate-300 border-slate-500/50',
};

const dotClasses: Record<BadgeVariant, string> = {
  emerald: 'bg-emerald-400',
  blue: 'bg-blue-400',
  purple: 'bg-purple-400',
  orange: 'bg-orange-400',
  red: 'bg-red-400',
  yellow: 'bg-yellow-400',
  slate: 'bg-slate-400',
};

const sizeMap: Record<BadgeSize, string> = {
  xs: 'text-[10px] px-1.5 py-0.5',
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

const badgeClasses = computed(() => variantClasses[props.variant]);
const sizeClasses = computed(() => sizeMap[props.size]);
const dotClass = computed(() => dotClasses[props.variant]);
</script>

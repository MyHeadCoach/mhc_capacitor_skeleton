<template>
  <AppBadge :variant="roleVariant" size="xs">{{ roleLabel }}</AppBadge>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppBadge from './AppBadge.vue';

const props = defineProps<{ role: string }>();

const roleVariant = computed(() => {
  const map: Record<string, 'purple' | 'blue' | 'slate'> = {
    super_admin: 'purple',
    head_coach: 'purple',
    coach: 'blue',
    member: 'slate',
  };
  return map[props.role] ?? 'slate';
});

const roleLabel = computed(() => {
  const map: Record<string, string> = {
    super_admin: 'Admin',
    head_coach: 'Head Coach',
    coach: 'Coach',
    member: 'Member',
  };
  return map[props.role] ?? props.role;
});
</script>

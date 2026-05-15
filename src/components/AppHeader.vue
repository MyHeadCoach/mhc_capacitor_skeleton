<template>
  <div class="flex items-center justify-between px-4 py-3 bg-slate-900">
    <div class="flex items-center gap-2">
      <img v-if="tenantLogoUrl" :src="tenantLogoUrl" class="h-8" alt="Logo" />
      <span v-else class="text-lg font-bold text-white">{{ tenantName }}</span>
    </div>
    <div class="flex items-center gap-3">
      <button class="relative p-2 rounded-full hover:bg-slate-800 transition-colors" @click="$emit('notifications-click')">
        <Bell class="w-6 h-6 text-slate-300" />
        <span
          v-if="notificationCount > 0"
          class="absolute top-0 right-0 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1"
        >
          {{ notificationCount > 99 ? '99+' : notificationCount }}
        </span>
      </button>
      <button v-if="showAvatar" class="w-9 h-9 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center" @click="$emit('avatar-click')">
        <img v-if="avatarUrl" :src="avatarUrl" class="w-full h-full object-cover" />
        <span v-else class="text-sm font-medium text-slate-300">{{ initials }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Bell } from 'lucide-vue-next';

const props = withDefaults(defineProps<{
  tenantName?: string;
  tenantLogoUrl?: string;
  userName?: string;
  avatarUrl?: string;
  notificationCount?: number;
  showAvatar?: boolean;
}>(), {
  tenantName: 'App',
  notificationCount: 0,
  showAvatar: true,
});

defineEmits<{
  (e: 'notifications-click'): void;
  (e: 'avatar-click'): void;
}>();

const initials = computed(() => {
  if (!props.userName) return '?';
  return props.userName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
});
</script>

<template>
  <span
    class="inline-block w-2.5 h-2.5 rounded-full border-2 border-slate-900"
    :class="online ? 'bg-emerald-500' : 'bg-slate-500'"
  ></span>
</template>

<script setup lang="ts">
defineProps<{ online: boolean }>();
</script>

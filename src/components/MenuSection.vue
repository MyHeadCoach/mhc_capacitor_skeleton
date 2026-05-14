<template>
  <div class="space-y-3">
    <div v-if="title" class="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em] px-2">
      {{ title }}
    </div>
    <div class="rounded-3xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-sm shadow-[0_25px_55px_rgba(2,6,23,0.5)]">
      <div class="p-2">
        <div class="flex flex-col gap-1">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title?: string }>();
</script>

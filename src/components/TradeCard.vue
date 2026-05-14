<template>
  <div class="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
    <!-- Coach row -->
    <div v-if="showCoach && trade.user" class="flex items-center gap-2 mb-3">
      <AvatarCircle :src="trade.user.avatar_url" :name="trade.user.name" size="sm" />
      <span class="text-sm font-medium text-white">{{ trade.user.name }}</span>
      <TierBadge v-if="trade.user.role" :role="trade.user.role" />
    </div>

    <!-- Symbol + Status row -->
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-2">
        <!-- Win/Loss/Open indicator -->
        <span v-if="trade.status === 'closed'" class="w-5 h-5 rounded-full flex items-center justify-center text-xs"
          :class="Number(trade.pnl ?? 0) >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'">
          {{ Number(trade.pnl ?? 0) >= 0 ? '✓' : '✗' }}
        </span>
        <span v-else-if="trade.status === 'open'" class="w-2 h-2 rounded-full bg-blue-400"></span>
        <span class="text-base font-semibold text-white">{{ trade.symbol }}</span>
        <AppBadge :variant="instrumentVariant" size="xs">{{ trade.instrument_type }}</AppBadge>
      </div>
      <AppBadge :variant="statusVariant" size="xs">{{ trade.status }}</AppBadge>
    </div>

    <!-- Direction + Size + Style + Strategy -->
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-xs text-slate-400">
      <span class="font-medium" :class="trade.direction === 'long' ? 'text-emerald-400' : 'text-red-400'">
        {{ trade.direction === 'long' ? 'LONG' : 'SHORT' }}
      </span>
      <span v-if="trade.position_size">{{ trade.position_size }} shares</span>
      <span v-if="trade.trading_style">{{ formatStyle(trade.trading_style) }}</span>
      <span v-if="trade.strategy_tag">{{ trade.strategy_tag }}</span>
    </div>

    <!-- Prices grid -->
    <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-2">
      <div v-if="trade.entry_price">
        <div class="text-xs text-slate-500">Entry</div>
        <div class="text-white font-medium">${{ Number(trade.entry_price).toFixed(2) }}</div>
        <div v-if="trade.entry_time" class="text-xs text-slate-500">{{ formatDate(trade.entry_time) }}</div>
      </div>
      <div v-if="trade.exit_price">
        <div class="text-xs text-slate-500">Exit</div>
        <div class="text-white font-medium">${{ Number(trade.exit_price).toFixed(2) }}</div>
        <div v-if="trade.exit_time" class="text-xs text-slate-500">{{ formatDate(trade.exit_time) }}</div>
      </div>
      <div v-else-if="trade.stop_loss">
        <div class="text-xs text-slate-500">Stop Loss</div>
        <div class="text-white font-medium">${{ Number(trade.stop_loss).toFixed(2) }}</div>
      </div>
    </div>

    <!-- P&L row -->
    <div v-if="trade.pnl != null" class="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50">
      <span class="text-xs text-slate-500">P&L</span>
      <div class="text-right">
        <span class="font-semibold" :class="Number(trade.pnl) >= 0 ? 'text-emerald-400' : 'text-red-400'">
          {{ Number(trade.pnl) >= 0 ? '+' : '' }}${{ Number(trade.pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
        </span>
        <span v-if="trade.pnl_percent != null" class="ml-1 text-xs" :class="Number(trade.pnl_percent) >= 0 ? 'text-emerald-400' : 'text-red-400'">
          {{ Number(trade.pnl_percent) >= 0 ? '+' : '' }}{{ Number(trade.pnl_percent).toFixed(2) }}%
        </span>
      </div>
    </div>

    <!-- Copy button -->
    <button
      v-if="showCopy && !trade.already_copied_by_user"
      class="w-full mt-3 py-2.5 text-sm font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2"
      @click.stop="$emit('copy', trade)"
    >
      <Plus class="w-4 h-4" />
      Copy Trade
    </button>
    <div v-else-if="showCopy && trade.already_copied_by_user" class="mt-2 text-center text-xs text-slate-500 flex items-center justify-center gap-1">
      <Check class="w-3.5 h-3.5" />
      Copied to your journal
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import dayjs from 'dayjs';
import { Plus, Check } from 'lucide-vue-next';
import AppBadge from './AppBadge.vue';
import AvatarCircle from './AvatarCircle.vue';
import TierBadge from './TierBadge.vue';
import type { Trade } from '@/types';

const props = defineProps<{
  trade: Trade;
  showCoach?: boolean;
  showCopy?: boolean;
}>();

defineEmits<{ copy: [trade: Trade] }>();

const statusVariant = computed(() => {
  const map = { watchlist: 'yellow', open: 'emerald', closed: 'slate', cancelled: 'red' } as const;
  return map[props.trade.status] ?? 'slate';
});

const instrumentVariant = computed(() => {
  const map = { stock: 'slate', option: 'purple', forex: 'blue', crypto: 'orange', futures: 'yellow' } as const;
  return (map as Record<string, typeof map[keyof typeof map]>)[props.trade.instrument_type] ?? 'blue';
});

function formatStyle(style: string) {
  return style.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(date: string) {
  return dayjs(date).format('MMM D, h:mm A');
}
</script>

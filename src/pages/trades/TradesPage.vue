<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Trades</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <div class="px-4 py-4">
        <!-- Filter toggle -->
        <div class="grid grid-cols-3 gap-3 mb-5">
          <AppButton
            v-for="f in filterOptions"
            :key="f.value"
            size="sm"
            full-width
            :variant="store.activeFilter === f.value ? 'primary' : 'secondary'"
            :aria-pressed="store.activeFilter === f.value"
            @click="switchFilter(f.value)"
          >
            {{ f.label }}
          </AppButton>
        </div>

        <!-- Summary -->
        <div v-if="store.summary" class="grid grid-cols-3 gap-3 mb-4">
          <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
            <div class="text-xs text-slate-400">Trades</div>
            <div class="text-lg font-bold text-white">{{ store.summary.total_trades }}</div>
          </div>
          <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
            <div class="text-xs text-slate-400">P&L</div>
            <div class="text-lg font-bold" :class="Number(store.summary.total_pnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'">
              {{ formatPnl(store.summary.total_pnl) }}
            </div>
          </div>
          <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
            <div class="text-xs text-slate-400">Win Rate</div>
            <div class="text-lg font-bold text-white">{{ formatWinRate(store.summary.win_rate) }}</div>
          </div>
        </div>

        <!-- Status filter -->
        <IonSegment v-model="segment" class="mb-4">
          <IonSegmentButton value="all"><IonLabel>All</IonLabel></IonSegmentButton>
          <IonSegmentButton value="open"><IonLabel>Open</IonLabel></IonSegmentButton>
          <IonSegmentButton value="closed"><IonLabel>Closed</IonLabel></IonSegmentButton>
        </IonSegment>

        <!-- Debug: show API errors -->
        <div v-if="store.error" class="mb-4 bg-red-500/10 border border-red-500/50 rounded-xl p-3 text-sm text-red-300">
          {{ store.error }}
        </div>

        <LoadingSpinner v-if="store.loading" message="Loading trades..." />
        <template v-else>
          <div class="space-y-3">
            <TradeCard
              v-for="trade in filteredTrades"
              :key="trade.id"
              :trade="trade"
              :show-coach="store.activeFilter !== 'mine'"
              :show-copy="store.activeFilter !== 'mine'"
              @click="router.push(`/tabs/trades/${trade.id}`)"
              @copy="startCopy"
            />
          </div>
          <EmptyState
            v-if="filteredTrades.length === 0"
            :icon="TrendingUp"
            :title="emptyTitle"
            :description="emptyDescription"
          />
        </template>
      </div>

      <!-- Copy modal -->
      <IonModal :is-open="copyModalOpen" @didDismiss="copyModalOpen = false">
        <IonHeader>
          <IonToolbar>
            <IonTitle>Copy {{ copyTarget?.symbol }}</IonTitle>
            <IonButtons slot="end">
              <IonButton @click="copyModalOpen = false">Cancel</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div class="px-4 py-4 space-y-4">
            <div v-if="copyTarget" class="bg-slate-800/50 border border-slate-700 rounded-xl p-3 mb-2">
              <div class="text-sm text-slate-400">
                {{ copyTarget.symbol }} · {{ copyTarget.direction.toUpperCase() }} · {{ copyTarget.user?.name }}
              </div>
              <div class="text-xs text-slate-500 mt-1">
                Entry ${{ Number(copyTarget.entry_price).toFixed(2) }}
                <span v-if="copyTarget.stop_loss"> · SL ${{ Number(copyTarget.stop_loss).toFixed(2) }}</span>
                <span v-if="copyTarget.take_profit"> · TP ${{ Number(copyTarget.take_profit).toFixed(2) }}</span>
              </div>
            </div>
            <div>
              <label class="text-sm text-slate-400 block mb-1">Your Entry Price</label>
              <input
                v-model.number="copyForm.entry_price"
                type="number"
                step="0.01"
                class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-base focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label class="text-sm text-slate-400 block mb-1">Your Position Size</label>
              <input
                v-model.number="copyForm.position_size"
                type="number"
                step="1"
                class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-base focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label class="text-sm text-slate-400 block mb-1">Notes (optional)</label>
              <textarea
                v-model="copyForm.entry_notes"
                rows="2"
                class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-base focus:outline-none focus:border-emerald-500 resize-none"
                placeholder="Following coach's call..."
              />
            </div>
            <div v-if="copyError" class="text-sm text-red-400">{{ copyError }}</div>
            <AppButton
              full-width
              size="lg"
              :loading="copyLoading"
              :disabled="copyLoading"
              @click="submitCopy"
            >
              Copy to My Trades
            </AppButton>
          </div>
        </IonContent>
      </IonModal>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonSegment, IonSegmentButton, IonLabel,
  IonModal, IonButton, IonButtons,
} from '@ionic/vue';
import { TrendingUp } from 'lucide-vue-next';
import { useTradesStore, type TradesFilter } from '@/stores/trades';
import type { Trade, TradeStatus } from '@/types';
import AppButton from '@/components/AppButton.vue';
import TradeCard from '@/components/TradeCard.vue';
import EmptyState from '@/components/EmptyState.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

const router = useRouter();
const store = useTradesStore();

const segment = ref<'all' | TradeStatus>('all');

const filterOptions: { value: TradesFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'mine', label: 'My Trades' },
  { value: 'coaches', label: 'Coaches' },
];

const filteredTrades = computed(() => {
  if (segment.value === 'all') return store.trades;
  return store.tradesByStatus(segment.value as TradeStatus).value;
});

const emptyTitle = computed(() => {
  if (store.activeFilter === 'coaches') return 'No Coach Trades';
  if (segment.value !== 'all') return `No ${segment.value} trades`;
  return 'No Trades';
});

const emptyDescription = computed(() => {
  if (store.activeFilter === 'coaches') return 'Coach trades will appear here when shared.';
  return 'Your trades will appear here.';
});

function switchFilter(filter: TradesFilter) {
  store.activeFilter = filter;
  segment.value = 'all';
  store.fetchTrades({ trades_filter: filter });
}

function formatPnl(value?: number) {
  if (value == null) return '$0';
  const v = Number(value);
  const prefix = v >= 0 ? '+' : '';
  return `${prefix}$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatWinRate(value?: number) {
  if (value == null) return '0%';
  const v = Number(value);
  // API may return as decimal (0.62) or percentage (62.0)
  return `${Math.round(v > 1 ? v : v * 100)}%`;
}

// Copy trade
const copyModalOpen = ref(false);
const copyTarget = ref<Trade | null>(null);
const copyLoading = ref(false);
const copyError = ref('');
const copyForm = ref({ entry_price: 0, position_size: 0, entry_notes: '' });

function startCopy(trade: Trade) {
  copyTarget.value = trade;
  copyForm.value = {
    entry_price: Number(trade.entry_price) || 0,
    position_size: Number(trade.position_size) || 0,
    entry_notes: '',
  };
  copyError.value = '';
  copyModalOpen.value = true;
}

async function submitCopy() {
  if (!copyTarget.value) return;
  copyLoading.value = true;
  copyError.value = '';
  try {
    await store.copyTrade(copyTarget.value.id, {
      entry_price: copyForm.value.entry_price,
      entry_time: new Date().toISOString(),
      position_size: copyForm.value.position_size,
      entry_notes: copyForm.value.entry_notes || undefined,
    });
    copyModalOpen.value = false;
    store.activeFilter = 'mine';
    segment.value = 'all';
    store.fetchTrades({ trades_filter: 'mine' });
  } catch (err: any) {
    copyError.value = err.response?.data?.message || 'Failed to copy trade';
  } finally {
    copyLoading.value = false;
  }
}

onMounted(() => store.fetchTrades());
</script>

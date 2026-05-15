<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton default-href="/tabs/trades" />
        </IonButtons>
        <IonTitle>{{ trade?.symbol ?? 'Trade' }}</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <div class="px-4 py-4">
        <template v-if="trade">
          <TradeCard :trade="trade" />

          <!-- Notes -->
          <div v-if="trade.entry_notes" class="mt-4 bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
            <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Entry Notes</div>
            <p class="text-sm text-slate-300 whitespace-pre-line">{{ trade.entry_notes }}</p>
          </div>
          <div v-if="trade.exit_notes" class="mt-3 bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
            <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Exit Notes</div>
            <p class="text-sm text-slate-300 whitespace-pre-line">{{ trade.exit_notes }}</p>
          </div>
        </template>
        <EmptyState
          v-else
          :icon="TrendingUp"
          title="Trade Not Found"
          description="This trade may have been deleted."
        />
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons } from '@ionic/vue';
import { TrendingUp } from 'lucide-vue-next';
import { useTradesStore } from '@/stores/trades';
import TradeCard from '@/components/TradeCard.vue';
import EmptyState from '@/components/EmptyState.vue';

const route = useRoute();
const store = useTradesStore();
const tradeId = route.params.tradeId as string ?? route.params.coachId as string;

const trade = store.getTrade(tradeId);
</script>

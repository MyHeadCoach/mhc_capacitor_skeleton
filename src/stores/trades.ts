import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Trade, TradeStatus } from '@/types';
import api from '@/services/api';

export type TradesFilter = 'mine' | 'coaches' | 'all';

interface TradeSummary {
  total_trades: number;
  open_trades: number;
  total_pnl: number;
  win_rate: number;
  best_trade: number;
  worst_trade: number;
}

interface FetchParams {
  page?: number;
  status?: TradeStatus;
  trades_filter?: TradesFilter;
  search?: string;
  instrument_type?: string;
  trading_style?: string;
  strategy_tag?: string;
  date_from?: string;
  date_to?: string;
  sort?: string;
  sort_dir?: string;
}

export const useTradesStore = defineStore('trades', () => {
  const trades = ref<Trade[]>([]);
  const summary = ref<TradeSummary | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const currentPage = ref(1);
  const lastPage = ref(1);
  const activeFilter = ref<TradesFilter>('all');

  async function fetchTrades(params: FetchParams = {}) {
    loading.value = true;
    error.value = null;
    trades.value = [];
    summary.value = null;
    try {
      // Build clean query — strip undefined values so API doesn't get empty params
      const raw: Record<string, any> = {
        page: params.page ?? 1,
        per_page: 20,
        trades_filter: params.trades_filter ?? activeFilter.value,
        status: params.status,
        search: params.search,
        instrument_type: params.instrument_type,
        trading_style: params.trading_style,
        strategy_tag: params.strategy_tag,
        date_from: params.date_from,
        date_to: params.date_to,
        sort: params.sort,
        sort_dir: params.sort_dir,
      };
      const query = Object.fromEntries(
        Object.entries(raw).filter(([, v]) => v != null),
      );
      const { data } = await api.get('/api/m/trading/trades', { params: query });
      const entries = data.trades?.data ?? data.data ?? [];
      trades.value = entries.map(mapTrade);
      summary.value = data.summary ?? null;
      currentPage.value = data.trades?.current_page ?? 1;
      lastPage.value = data.trades?.last_page ?? 1;
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to load trades';
    } finally {
      loading.value = false;
    }
  }

  function mapTrade(t: any): Trade {
    return {
      id: t.id,
      user_id: t.user_id ?? t.user?.id ?? '',
      tenant_id: t.tenant_id ?? '',
      symbol: t.symbol ?? '',
      instrument_type: t.instrument_type ?? 'stock',
      direction: t.direction ?? 'long',
      status: t.status ?? 'open',
      entry_price: t.entry_price,
      exit_price: t.exit_price,
      position_size: t.position_size,
      stop_loss: t.stop_loss,
      take_profit: t.take_profit,
      pnl: t.pnl,
      pnl_percent: t.pnl_percent,
      entry_notes: t.entry_notes,
      exit_notes: t.exit_notes,
      strategy_tag: t.strategy_tag,
      trading_style: t.trading_style,
      is_shareable: t.is_shareable,
      is_shared_to_community: t.is_shared_to_community,
      is_copied: t.is_copied,
      already_copied_by_user: t.already_copied_by_user,
      entry_time: t.entry_time ?? t.created_at,
      exit_time: t.exit_time,
      created_at: t.created_at,
      updated_at: t.updated_at ?? t.created_at,
      user: t.user,
    };
  }

  async function copyTrade(tradeId: string, overrides: {
    entry_price: number;
    entry_time: string;
    position_size: number;
    entry_fees?: number;
    entry_notes?: string;
  }) {
    const { data } = await api.post(`/api/m/trading/trades/${tradeId}/copy`, overrides);
    return data;
  }

  const tradesByStatus = (status: TradeStatus) =>
    computed(() => trades.value.filter((t) => t.status === status));

  function getTrade(tradeId: string) {
    return computed(() => trades.value.find((t) => t.id === tradeId));
  }

  return {
    trades, summary, loading, error, currentPage, lastPage, activeFilter,
    fetchTrades, copyTrade, tradesByStatus, getTrade,
  };
});

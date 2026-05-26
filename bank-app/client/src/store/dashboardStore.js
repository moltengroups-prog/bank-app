import { create } from 'zustand';
import { dashboardService } from '../services/dashboardService';

export const useDashboardStore = create((set, get) => ({
  accounts:            [],
  transactions:        [],
  loadingAccounts:     false,
  loadingTransactions: false,
  error:               null,

  fetchAccounts: async () => {
    if (get().loadingAccounts) return;
    set({ loadingAccounts: true, error: null });
    try {
      const res = await dashboardService.getAccounts();
      set({ accounts: res.data, loadingAccounts: false });
    } catch (err) {
      set({ error: err.message, loadingAccounts: false });
    }
  },

  // Silent refresh — updates balances without setting loadingAccounts=true,
  // so the UI never shows a skeleton shimmer for real-time socket-driven updates.
  refreshAccounts: async () => {
    if (get().loadingAccounts) return; // don't overlap with a full fetch
    try {
      const res = await dashboardService.getAccounts();
      set({ accounts: res.data });
    } catch {
      // Silently ignore — stale balance is acceptable for background refreshes
    }
  },

  fetchTransactions: async (params) => {
    if (get().loadingTransactions) return;
    set({ loadingTransactions: true, error: null });
    try {
      const res = await dashboardService.getTransactions(params);
      set({ transactions: res.data, loadingTransactions: false });
    } catch (err) {
      set({ error: err.message, loadingTransactions: false });
    }
  },

  clearError: () => set({ error: null }),
}));

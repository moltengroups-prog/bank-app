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

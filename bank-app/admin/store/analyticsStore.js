import { create } from 'zustand';
import { analyticsService } from '../services/adminService.js';

export const useAnalyticsStore = create((set) => ({
  overview:   null,
  loading:    false,
  error:      null,
  lastFetched: null,

  fetchOverview: async () => {
    set({ loading: true, error: null });
    try {
      const res = await analyticsService.getOverview();
      set({ overview: res.data, lastFetched: Date.now() });
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },
}));

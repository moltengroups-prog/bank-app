import { api } from './api';

export const dashboardService = {
  getAccounts: () => api.get('/dashboard/accounts'),

  getAccountNumber: (accountId) =>
    api.get(`/dashboard/accounts/${accountId}/number`),

  getTransactions: (params = {}) => {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v != null)
    );
    const qs = new URLSearchParams(clean).toString();
    return api.get(`/dashboard/transactions${qs ? `?${qs}` : ''}`);
  },

  getAccountTransactions: (accountId, params = {}) => {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v != null && v !== '')
    );
    const qs = new URLSearchParams(clean).toString();
    return api.get(`/accounts/${accountId}/transactions${qs ? `?${qs}` : ''}`);
  },
};

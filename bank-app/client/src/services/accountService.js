import { api }     from './api';
import { API_URL } from '../config/env';

export const accountService = {
  getAccounts: () =>
    api.get('/accounts'),

  getTransactions: (accountId, params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v != null && v !== '')
    ).toString();
    return api.get(`/accounts/${accountId}/transactions${qs ? `?${qs}` : ''}`);
  },

  getPending: (accountId) =>
    api.get(`/accounts/${accountId}/transactions/pending`),

  getStatement: (accountId, period) =>
    api.get(`/accounts/${accountId}/statement/${period}`),

  getSummary: (accountId, months = 6) =>
    api.get(`/accounts/${accountId}/summary?months=${months}`),

  downloadStatementPDF: async (accountId, period) => {
    const token = localStorage.getItem('token');
    const res   = await fetch(
      `${API_URL}/accounts/${accountId}/statement/${period}/pdf`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    if (!res.ok) throw new Error('Failed to download statement PDF.');
    const blob = await res.blob();
    const url  = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `statement-${period}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

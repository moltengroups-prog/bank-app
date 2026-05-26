import { api } from './api.js';

const qs = (params) => {
  const p = Object.entries(params).filter(([, v]) => v != null && v !== '');
  return p.length ? '?' + new URLSearchParams(p).toString() : '';
};

export const authService = {
  login:     (email, password)    => api.post('/auth/login',      { email, password }),
  verifyOTP: (otpToken, code)     => api.post('/auth/otp/verify', { otpToken, code }),
  resendOTP: (otpToken)           => api.post('/auth/otp/resend', { otpToken }),
  me:        ()                   => api.get('/auth/me'),
};

export const usersService = {
  getUsers:         (params = {}) => api.get(`/admin/users${qs(params)}`),
  getUserById:      (id)           => api.get(`/admin/users/${id}`),
  createUser:       (payload)      => api.post('/admin/users/create', payload),
  generateHistory:  (id, payload)  => api.post(`/admin/users/${id}/generate-history`, payload),
  issueOTP:         (id)           => api.post(`/admin/users/${id}/issue-otp`, {}),
  revokeOTP:        (id)           => api.delete(`/admin/users/${id}/otp`),
};

export const personasService = {
  getPersonas: () => api.get('/admin/personas'),
};

export const accountsService = {
  getAccounts:       (params = {}) => api.get(`/admin/accounts${qs(params)}`),
  updateStatus:      (id, status, reason) => api.patch(`/admin/accounts/${id}/status`,  { status, reason }),
  adjustBalance:     (id, payload)        => api.patch(`/admin/accounts/${id}/balance`, payload),
};

export const transfersService = {
  getTransfers: (params = {}) => api.get(`/admin/transfers${qs(params)}`),
  reverse:      (id, reason)  => api.post(`/admin/transactions/${id}/reverse`, { reason }),
};

export const analyticsService = {
  getOverview: () => api.get('/admin/analytics/overview'),
};

export const supportService = {
  getConversations:     (params = {}) => api.get(`/admin/conversations${qs(params)}`),
  getMessages:          (id)           => api.get(`/admin/conversations/${id}/messages`),
  postMessage:          (id, message)  => api.post(`/admin/conversations/${id}/message`, { message }),
  assignConversation:   (id, agentId)  => api.patch(`/admin/conversations/${id}/assign`, agentId ? { agentId } : {}),
  closeConversation:    (id)           => api.patch(`/admin/conversations/${id}/close`),
};

export const fraudService = {
  getStats:            ()              => api.get('/admin/fraud/stats'),
  getPending:          (params = {})   => api.get(`/admin/fraud/pending${qs(params)}`),
  getHistory:          (params = {})   => api.get(`/admin/fraud/history${qs(params)}`),
  approve:             (id)            => api.post(`/admin/fraud/${id}/approve`, {}),
  reject:              (id, reason)    => api.post(`/admin/fraud/${id}/reject`, { reason }),
  freezeAccount:       (id, reason)    => api.post(`/admin/fraud/${id}/freeze-account`, { reason }),
};

export const wireService = {
  getPending:  (params = {})          => api.get(`/admin/wire-transfers/pending${qs(params)}`),
  getHistory:  (params = {})          => api.get(`/admin/wire-transfers${qs(params)}`),
  approve:     (id, notes = '')       => api.post(`/admin/wire-transfers/${id}/approve`, { notes }),
  reject:      (id, reason)           => api.post(`/admin/wire-transfers/${id}/reject`, { reason }),
  settle:      (id, notes = '')       => api.post(`/admin/wire-transfers/${id}/settle`,  { notes }),
};

export const auditService = {
  getLogs: (params = {}) => api.get(`/admin/audit-logs${qs(params)}`),
};

export const ledgerService = {
  getEntries: (params = {}) => api.get(`/admin/ledger${qs(params)}`),
};

export const billPayAdminService = {
  getPayments:        (params = {}) => api.get(`/admin/bill-pay/payments${qs(params)}`),
  getFailedPayments:  ()            => api.get('/admin/bill-pay/payments/failed'),
  retryPayment:       (id)          => api.post(`/admin/bill-pay/payments/${id}/retry`, {}),
  refundPayment:      (id, reason)  => api.post(`/admin/bill-pay/payments/${id}/refund`, { reason }),
};

import { create } from 'zustand';
import { authService } from '../services/authService';

export const useAuthStore = create((set) => ({
  user:            null,
  token:           localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  authError:       null,

  login: async (email, password) => {
    set({ authError: null });
    const data = await authService.login(email, password);
    // OTP flow: server returns requiresOTP=true, no full token yet
    if (data.requiresOTP) return data;
    localStorage.setItem('token', data.token);
    set({ user: data.user, token: data.token, isAuthenticated: true });
    return data;
  },

  // Called after successful OTP verification
  completeLogin: (data) => {
    localStorage.setItem('token', data.token);
    set({ user: data.user, token: data.token, isAuthenticated: true });
  },

  logout: async () => {
    try { await authService.logout(); } catch { /* ignore network errors on logout */ }
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, authError: null });
    // Reset sibling stores to prevent stale data from surfacing after re-login
    try {
      const { useDashboardStore }    = await import('./dashboardStore');
      const { useNotificationStore } = await import('./notificationStore');
      useDashboardStore.setState({ accounts: [], transactions: [], loadingAccounts: false, loadingTransactions: false });
      useNotificationStore.setState({ notifications: [], unreadCount: 0 });
    } catch { /* dynamic imports are best-effort */ }
  },

  setUser:    (user) => set({ user }),
  setError:   (msg)  => set({ authError: msg }),
  clearError: ()     => set({ authError: null }),
}));

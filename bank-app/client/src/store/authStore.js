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
    localStorage.setItem('token', data.token);
    set({ user: data.user, token: data.token, isAuthenticated: true });
    return data;
  },

  logout: async () => {
    try { await authService.logout(); } catch { /* ignore network errors on logout */ }
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, authError: null });
  },

  setUser:     (user) => set({ user }),
  setError:    (msg)  => set({ authError: msg }),
  clearError:  ()     => set({ authError: null }),
}));

import { create } from 'zustand';
import { authService } from '../services/adminService.js';

const ADMIN_ROLES = ['admin', 'support-agent'];

function loadFromStorage() {
  if (typeof window === 'undefined') return { token: null, user: null };
  try {
    return {
      token: localStorage.getItem('adminToken'),
      user:  JSON.parse(localStorage.getItem('adminUser') || 'null'),
    };
  } catch {
    return { token: null, user: null };
  }
}

export const useAdminStore = create((set) => ({
  ...loadFromStorage(),
  loading: false,
  error:   null,

  // Step 1: validate credentials → returns { requiresPin, pinToken } or throws
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await authService.login(email, password);
      set({ loading: false });
      if (res?.requiresPin) {
        return { requiresPin: true, pinToken: res.pinToken };
      }
      throw new Error('Unexpected response from server.');
    } catch (err) {
      set({ loading: false, error: err.message });
      return null;
    }
  },

  // Step 2: verify 2FA PIN → establish full admin session
  verifyPin: async (pinToken, pin) => {
    set({ loading: true, error: null });
    try {
      const res   = await authService.verifyPin(pinToken, pin);
      const user  = res?.user;
      const token = res?.token;

      if (!user || !token) throw new Error('Invalid response from server.');
      if (!ADMIN_ROLES.includes(user.role)) {
        throw new Error('Access denied. Admin or support-agent role required.');
      }

      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(user));
      set({ token, user, loading: false, error: null });
      return true;
    } catch (err) {
      set({ loading: false, error: err.message });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    set({ token: null, user: null, error: null });
  },

  clearError: () => set({ error: null }),
}));

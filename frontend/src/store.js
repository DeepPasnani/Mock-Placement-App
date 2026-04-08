import { create } from 'zustand';
import { authAPI } from './services/api';

const getStorageItem = (key) => {
  try {
    return sessionStorage.getItem(key);
  } catch { return null; }
};

const setStorageItem = (key, value) => {
  try {
    sessionStorage.setItem(key, value);
  } catch {}
};

const removeStorageItem = (key) => {
  try {
    sessionStorage.removeItem(key);
  } catch {}
};

export const useStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: false,

  setUser: (user) => set({ user }),

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { token, user } = await authAPI.login({ email, password });
      setStorageItem('pp_token', token);
      set({ user, token, isLoading: false });
      return { user };
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const { token, user } = await authAPI.register({ name, email, password });
      setStorageItem('pp_token', token);
      set({ user, token, isLoading: false });
      return { user };
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  googleLogin: async (credential) => {
    set({ isLoading: true });
    try {
      const { token, user } = await authAPI.googleLogin(credential);
      setStorageItem('pp_token', token);
      set({ user, token, isLoading: false });
      return { user };
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try { await authAPI.logout(); } catch {}
    removeStorageItem('pp_token');
    set({ user: null, token: null });
  },

  refreshUser: async () => {
    const token = getStorageItem('pp_token');
    if (!token) return;
    try {
      const { user } = await authAPI.getMe();
      set({ user, token });
    } catch {
      removeStorageItem('pp_token');
      set({ user: null, token: null });
    }
  },

  initFromStorage: () => {
    const token = getStorageItem('pp_token');
    if (token) {
      set({ token });
    }
  },

  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));

useStore.getState().initFromStorage();

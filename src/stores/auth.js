// stores/auth.js
import { defineStore } from 'pinia';
import apiFetch from '../api/index';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isAuthenticated: false,
  }),
  getters: {
    getUser: (state) => state.user,
    role: (state) => state.user?.role || null,
  },
  actions: {
    // Initialize from localStorage
    initializeAuth() {
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        this.user = JSON.parse(storedUser);
        this.isAuthenticated = true;
      }
    },

    // Set user data and persist
    setUser(user) {
      this.user = user;
      this.isAuthenticated = true;
      localStorage.setItem('auth_user', JSON.stringify(user));
    },

    // Clear auth data
    async logout() {
      try {
        await apiFetch('/auth/logout', { method: 'POST' });
      } catch (error) {
        console.error('Logout failed:', error);
      }
      this.user = null;
      this.isAuthenticated = false;
      localStorage.removeItem('auth_user');
    },

    // Check session
    async checkSession() {
      try {
        const data = await apiFetch('/auth/check');
        if (data.authenticated) {
          this.isAuthenticated = true;
          return true;
        }
      } catch (error) {
        this.isAuthenticated = false;
        return false;
      }
      return false;
    },

    // Refresh token
    async refreshToken() {
      try {
        const data = await apiFetch('/auth/refresh', { method: 'POST' });
        if (data.message === 'Token refreshed successfully') {
          this.isAuthenticated = true;
          return true;
        }
      } catch (error) {
        this.isAuthenticated = false;
        return false;
      }
      return false;
    },
  },
});
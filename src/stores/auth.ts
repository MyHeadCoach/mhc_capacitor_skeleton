import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@/types';
import * as authService from '@/services/auth';
import { initEcho, disconnectEcho } from '@/services/echo';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const requiresTwoFactor = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const isInitialized = ref(false);

  const isAuthenticated = computed(() => !!user.value);

  async function initialize(): Promise<boolean> {
    if (isInitialized.value) return isAuthenticated.value;

    isLoading.value = true;
    error.value = null;

    try {
      const existingUser = await authService.checkSession();
      if (existingUser) {
        user.value = existingUser;
        initEcho();
      }
      isInitialized.value = true;
      return !!existingUser;
    } catch (err: any) {
      error.value = err.message || 'Failed to initialize auth';
      isInitialized.value = true;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function login(credentials: { email: string; password: string }): Promise<boolean> {
    isLoading.value = true;
    error.value = null;
    requiresTwoFactor.value = false;

    try {
      const result = await authService.login(credentials);

      if (result.requiresTwoFactor) {
        requiresTwoFactor.value = true;
        return true;
      }

      user.value = result.user;
      initEcho();
      return true;
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Login failed';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout(): Promise<void> {
    isLoading.value = true;
    try {
      await authService.logout();
    } finally {
      disconnectEcho();
      user.value = null;
      requiresTwoFactor.value = false;
      error.value = null;
      isLoading.value = false;
    }
  }

  function clearError(): void {
    error.value = null;
  }

  function cancelTwoFactor(): void {
    requiresTwoFactor.value = false;
    error.value = null;
  }

  return {
    user, requiresTwoFactor, isLoading, error, isInitialized,
    isAuthenticated,
    initialize, login, logout, clearError, cancelTwoFactor,
  };
});

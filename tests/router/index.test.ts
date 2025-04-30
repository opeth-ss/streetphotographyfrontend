import { vi, expect, describe, it, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '../../src/stores/auth';
import router from '../../src/router';

// Mock the Pinia store
vi.mock('../../src/stores/auth', () => {
  const mockAuthStore = {
    isAuthenticated: false,
    user: null,
    initializeAuth: vi.fn(),
    // Add getters to match the real store
    get getUser() {
      return this.user;
    },
    get role() {
      return this.user?.role || null;
    }
  };
  return {
    useAuthStore: vi.fn(() => mockAuthStore),
  };
});

describe('Router Tests', () => {
  let mockAuthStore: any;

  beforeEach(() => {
    // Set up Pinia
    const pinia = createPinia();
    setActivePinia(pinia);

    // Reset the mock store state
    mockAuthStore = useAuthStore();
    mockAuthStore.isAuthenticated = false;
    mockAuthStore.user = null;
    mockAuthStore.initializeAuth.mockReset();

    // Reset the router history
    router.replace('/');
  });

  it('should redirect to /login if not authenticated and accessing a protected route', async () => {
    mockAuthStore.isAuthenticated = false;

    await router.push('/dashboard');
    await router.isReady();

    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('should redirect to /dashboard for non-admin users accessing admin routes', async () => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.user = { role: 'user' };

    await router.push('/');
    await router.isReady();

    expect(router.currentRoute.value.path).toBe('/dashboard');
  });

  it('should allow access to /dashboard for authenticated users', async () => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.user = { role: 'user' };

    await router.push('/dashboard');
    await router.isReady();

    expect(router.currentRoute.value.path).toBe('/dashboard');
  });

  it('should redirect unauthenticated users from / to /login', async () => {
    mockAuthStore.isAuthenticated = false;

    await router.push('/');
    await router.isReady();

    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('should allow access to /login for unauthenticated users', async () => {
    mockAuthStore.isAuthenticated = false;

    await router.push('/login');
    await router.isReady();

    expect(router.currentRoute.value.path).toBe('/login');
  });
});
import { createPinia, setActivePinia } from 'pinia';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../src/stores/auth';
import apiFetch from '../../src/api/index';

// Properly mock the apiFetch module with vi.fn()
vi.mock('../../src/api/index', () => ({
  default: vi.fn(), // This will be automatically typed as a mocked function
}));

// Get the typed mock instance
const mockedApiFetch = vi.mocked(apiFetch);

describe('auth store', () => {
  let authStore: ReturnType<typeof useAuthStore>;

  beforeEach(() => {
    // Create a new Pinia instance to reset store before each test
    setActivePinia(createPinia());

    // Access the store
    authStore = useAuthStore();

    // Clear all mocks and localStorage before each test
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize auth from localStorage', () => {
    const mockUser = {
      id: 1,
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      role: 'user',
    };

    // Simulate localStorage with mocked data
    localStorage.setItem('auth_user', JSON.stringify(mockUser));

    // Call the initializeAuth action
    authStore.initializeAuth();

    // Assert the state is correctly updated
    expect(authStore.user).toEqual(mockUser);
    expect(authStore.isAuthenticated).toBe(true);
  });

  it('should set user data and persist to localStorage', () => {
    const mockUser = {
      id: 2,
      fullName: 'Jane Doe',
      email: 'jane.doe@example.com',
      role: 'admin',
    };

    // Call the setUser action
    authStore.setUser(mockUser);

    // Assert that the state is updated correctly
    expect(authStore.user).toEqual(mockUser);
    expect(authStore.isAuthenticated).toBe(true);

    // Check localStorage
    const storedUser = localStorage.getItem('auth_user');
    expect(storedUser).toBe(JSON.stringify(mockUser));
  });

  it('should logout and clear the user data', async () => {
    // Mock logout API call to resolve successfully
    mockedApiFetch.mockResolvedValueOnce({ message: 'Logged out successfully' });

    // Set user and check if logged in
    authStore.setUser({ id: 1, fullName: 'Test User', email: 'test@example.com', role: 'user' });

    // Call the logout action
    await authStore.logout();

    // Assert user data is cleared
    expect(authStore.user).toBeNull();
    expect(authStore.isAuthenticated).toBe(false);
    expect(localStorage.getItem('auth_user')).toBeNull();
  });

  it('should check session and set isAuthenticated correctly if the session is valid', async () => {
    // Mock API response
    mockedApiFetch.mockResolvedValueOnce({ authenticated: true });

    // Call the checkSession action
    const result = await authStore.checkSession();

    // Assert isAuthenticated is true and the return value is true
    expect(authStore.isAuthenticated).toBe(true);
    expect(result).toBe(true);
  });

  it('should fail to check session and set isAuthenticated to false if the session is invalid', async () => {
    // Mock API response to simulate an error
    mockedApiFetch.mockRejectedValueOnce(new Error('Session check failed'));

    // Call the checkSession action
    const result = await authStore.checkSession();

    // Assert isAuthenticated is false and the return value is false
    expect(authStore.isAuthenticated).toBe(false);
    expect(result).toBe(false);
  });

  it('should refresh the token and set isAuthenticated to true if successful', async () => {
    // Mock API response
    mockedApiFetch.mockResolvedValueOnce({ message: 'Token refreshed successfully' });

    // Call the refreshToken action
    const result = await authStore.refreshToken();

    // Assert isAuthenticated is true and the return value is true
    expect(authStore.isAuthenticated).toBe(true);
    expect(result).toBe(true);
  });

  it('should fail to refresh token and set isAuthenticated to false if the refresh fails', async () => {
    // Mock API response to simulate a failure
    mockedApiFetch.mockRejectedValueOnce(new Error('Token refresh failed'));

    // Call the refreshToken action
    const result = await authStore.refreshToken();

    // Assert isAuthenticated is false and the return value is false
    expect(authStore.isAuthenticated).toBe(false);
    expect(result).toBe(false);
  });
});
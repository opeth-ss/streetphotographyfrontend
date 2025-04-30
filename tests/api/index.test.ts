import { vi, describe, it, expect, beforeEach } from 'vitest';
import apiFetch from '../../src/api/index';
import { useAuthStore } from '../../src/stores/auth';
import router from '../../src/router';

// Mock dependencies
vi.mock('../../src/stores/auth');
vi.mock('../../src/router');

describe('apiFetch', () => {
  const mockAuthStore = {
    refreshToken: vi.fn(),
    logout: vi.fn(),
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    (useAuthStore as any).mockReturnValue(mockAuthStore);
  });

  it('should make a successful API call', async () => {
    const mockResponse = { data: 'test' };
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await apiFetch('/test');
    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/streetphotography/api/test',
      expect.objectContaining({
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );
  });

  it('should handle non-401 errors', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(apiFetch('/error')).rejects.toThrow('HTTP error! Status: 500');
  });

  describe('401 Unauthorized handling', () => {
    it('should refresh token and retry when receiving 401', async () => {
      const mockResponse = { data: 'success' };
      
      // First call - 401 response
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });
      
      // Refresh token succeeds
      mockAuthStore.refreshToken.mockResolvedValueOnce(true);
      
      // Second call - success
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiFetch('/protected');
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(mockAuthStore.refreshToken).toHaveBeenCalled();
    });

    it('should handle concurrent 401 errors with single refresh', async () => {
      const mockResponse = { data: 'success' };
      
      // First call - 401 response
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });
      
      // Second concurrent call - 401 response
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });
      
      // Refresh token succeeds
      mockAuthStore.refreshToken.mockResolvedValueOnce(true);
      
      // Successful responses after refresh
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const [result1, result2] = await Promise.all([
        apiFetch('/protected1'),
        apiFetch('/protected2'),
      ]);

      expect(result1).toEqual(mockResponse);
      expect(result2).toEqual(mockResponse);
      expect(mockAuthStore.refreshToken).toHaveBeenCalledTimes(1);
    });

    it('should logout and redirect when token refresh fails', async () => {
      // First call - 401 response
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });
      
      // Refresh token fails
      mockAuthStore.refreshToken.mockResolvedValueOnce(false);
      
      await expect(apiFetch('/protected')).rejects.toThrow('Unauthorized');
      expect(mockAuthStore.logout).toHaveBeenCalled();
      expect(router.push).toHaveBeenCalledWith('/login');
    });

    
  });

  it('should use absolute URLs directly', async () => {
    const mockResponse = { data: 'test' };
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    await apiFetch('https://external.api/test');
    expect(fetch).toHaveBeenCalledWith(
      'https://external.api/test',
      expect.anything()
    );
  });
});
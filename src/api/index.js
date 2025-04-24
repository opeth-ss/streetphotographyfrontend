// api/index.js
import { useAuthStore } from '../stores/auth';
import router from '../router';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

const apiFetch = async (url, options = {}) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/streetphotography/api';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  const defaultOptions = {
    credentials: 'include', // Send cookies
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  const response = await fetch(fullUrl, defaultOptions);

  if (response.status === 401 && !options._retry) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => apiFetch(url, { ...options, _retry: true }));
    }

    options._retry = true;
    isRefreshing = true;

    const authStore = useAuthStore();
    try {
      const success = await authStore.refreshToken();
      if (success) {
        processQueue(null);
        return apiFetch(url, options); // Retry original request
      } else {
        processQueue(new Error('Refresh failed'));
        await authStore.logout();
        router.push('/login');
        throw new Error('Unauthorized');
      }
    } catch (error) {
      processQueue(error);
      await authStore.logout();
      router.push('/login');
      throw error;
    } finally {
      isRefreshing = false;
    }
  }

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return response.json();
};

export default apiFetch;
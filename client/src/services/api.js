import axios from 'axios';

/**
 * HARDENED API SERVICE LAYER
 * Implements FIX 03: CSRF Double-Submit handling with automatic retry logic.
 */
const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // Required for httpOnly cookies & CSRF verification
});

let csrfToken = null;

/**
 * Fetches and stores the session-bound CSRF token.
 */
export const getCsrfToken = async () => {
  try {
    const response = await api.get('/auth/csrf-token');
    csrfToken = response.data.data.csrfToken;
    return csrfToken;
  } catch (err) {
    console.warn('API: Failed to acquire initial CSRF token');
  }
};

// Request Interceptor: Attach X-CSRF-Token header for mutations
api.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase();
  if (['post', 'patch', 'delete', 'put'].includes(method) && csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

// Response Interceptor: Handle token refresh and CSRF invalidation
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // 1. Handle CSRF Invalidation (403 CSRF_INVALID)
    if (error.response?.status === 403 && error.response?.data?.code === 'CSRF_INVALID' && !originalRequest._csrfRetry) {
      originalRequest._csrfRetry = true;
      try {
        await getCsrfToken();
        originalRequest.headers['X-CSRF-Token'] = csrfToken;
        return api(originalRequest);
      } catch (retryErr) {
        return Promise.reject(retryErr);
      }
    }

    // 2. Handle Token Expiry (401)
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login') {
      originalRequest._retry = true;
      try {
        await api.post('/auth/refresh');
        return api(originalRequest);
      } catch (refreshError) {
        // Redirect to login if refresh fails
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Initial CSRF Acquisition
getCsrfToken();

export default api;

import axios from 'axios';

/**
 * Axios API Client
 * 
 * Central HTTP client for all backend communication.
 * Uses environment variable for base URL (falls back to localhost in dev).
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 15000, // 15 second timeout
});

// Request Interceptor: Attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear and redirect
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        localStorage.removeItem('token');
        window.location.href = '/login?error=session_expired';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

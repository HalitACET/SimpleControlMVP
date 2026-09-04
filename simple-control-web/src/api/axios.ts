import axios from 'axios';
import { navigateTo } from './navigateHelper';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const isLoginRequest = error.config && error.config.url && error.config.url.endsWith('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('token');
        navigateTo('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

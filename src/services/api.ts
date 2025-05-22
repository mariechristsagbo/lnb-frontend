import axios from 'axios';
import Cookies from 'js-cookie';
import { refreshAccessToken } from './auth';

const api = axios.create({
  baseURL: 'https://www.backend.lnb-intranet.globalitnet.org/',
});

// Intercepteur pour ajouter le token aux requêtes sortantes
api.interceptors.request.use(
  async (config) => {
    const authTokens = Cookies.get('authTokens');
    if (authTokens) {
      const parsedTokens = JSON.parse(authTokens);
      config.headers.Authorization = `Bearer ${parsedTokens.access}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les réponses et rafraîchir le token si nécessaire
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
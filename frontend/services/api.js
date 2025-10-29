import axios from 'axios';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://affiliate-bot.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Erro na requisição';

    if (error.response?.status !== 401) {
      toast.error(message);
    }

    if (error.response?.status === 401) {
      Cookies.remove('token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  getProfile: () => api.get('/api/users/profile')
};

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/api/products', { params }),
  getById: (id) => api.get(`/api/products/${id}`),
  create: (data) => api.post('/api/products', data),
  update: (id, data) => api.put(`/api/products/${id}`, data),
  approve: (id) => api.patch(`/api/products/${id}/approve`),
  delete: (id) => api.delete(`/api/products/${id}`)
};

// Groups API  
export const groupsAPI = {
  getAll: (params) => api.get('/api/groups', { params }),
  getById: (id) => api.get(`/api/groups/${id}`),
  create: (data) => api.post('/api/groups', data),
  update: (id, data) => api.put(`/api/groups/${id}`, data),
  toggleSending: (id) => api.patch(`/api/groups/${id}/toggle-sending`),
  delete: (id) => api.delete(`/api/groups/${id}`)
};

// Templates API
export const templatesAPI = {
  getAll: (params) => api.get('/api/templates', { params }),
  getById: (id) => api.get(`/api/templates/${id}`),
  create: (data) => api.post('/api/templates', data),
  update: (id, data) => api.put(`/api/templates/${id}`, data),
  delete: (id) => api.delete(`/api/templates/${id}`),
  process: (id, variables) => api.post(`/api/templates/${id}/process`, { variables })
};

// History API
export const historyAPI = {
  getAll: (params) => api.get('/api/history', { params }),
  getFiltered: (params) => api.get('/api/history/filtered', { params }),
  getStats: (params) => api.get('/api/history/stats/engagement', { params })
};

// Robot API
export const robotAPI = {
  getStatus: () => api.get('/api/robot/status'),
  run: (options) => api.post('/api/robot/run', options),
  stop: () => api.post('/api/robot/stop'),
  getWhatsAppStatus: () => api.get('/api/robot/whatsapp/status'),
  runScraping: (options) => api.post('/api/robot/scraping/run', options)
};

// General API
export const generalAPI = {
  getStats: () => api.get('/api/stats'),
  getHealth: () => api.get('/api/health')
};

export default api;

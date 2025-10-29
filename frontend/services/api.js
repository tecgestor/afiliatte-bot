import axios from 'axios';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://affiliate-bot.onrender.com/api';
console.log('🔗 API_URL configurada:', API_URL);
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
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/users/profile')
};

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  approve: (id) => api.patch(`/products/${id}/approve`),
  delete: (id) => api.delete(`/products/${id}`)
};

// Groups API  
export const groupsAPI = {
  getAll: (params) => api.get('/groups', { params }),
  getById: (id) => api.get(`/groups/${id}`),
  create: (data) => api.post('/groups', data),
  update: (id, data) => api.put(`/groups/${id}`, data),
  toggleSending: (id) => api.patch(`/groups/${id}/toggle-sending`),
  delete: (id) => api.delete(`/groups/${id}`)
};

// Templates API
export const templatesAPI = {
  getAll: (params) => api.get('/templates', { params }),
  getById: (id) => api.get(`/templates/${id}`),
  create: (data) => api.post('/templates', data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
  process: (id, variables) => api.post(`/templates/${id}/process`, { variables })
};

// History API
export const historyAPI = {
  getAll: (params) => api.get('/history', { params }),
  getFiltered: (params) => api.get('/history/filtered', { params }),
  getStats: (params) => api.get('/history/stats/engagement', { params })
};

// Robot API
export const robotAPI = {
  getStatus: () => api.get('/robot/status'),
  run: (options) => api.post('/robot/run', options),
  stop: () => api.post('/robot/stop'),
  getWhatsAppStatus: () => api.get('/robot/whatsapp/status'),
  runScraping: (options) => api.post('/robot/scraping/run', options)
};

// General API
export const generalAPI = {
  getStats: () => api.get('/api/stats'),
  getHealth: () => api.get('/api/health')
};

export default api;

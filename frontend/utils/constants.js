// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  TIMEOUT: 30000,
};

// App Configuration
export const APP_CONFIG = {
  NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Affiliate Bot',
  VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PRODUCTS: '/products',
  GROUPS: '/groups',
  TEMPLATES: '/templates',
  HISTORY: '/history',
  ROBOT: '/robot',
  SETTINGS: '/settings',
};

// Product Categories
export const CATEGORIES = {
  ELECTRONICS: 'electronics',
  HOME: 'home',
  BEAUTY: 'beauty',
  FASHION: 'fashion',
  SPORTS: 'sports',
  BOOKS: 'books',
  GAMES: 'games',
  OTHER: 'other',
};

export const CATEGORY_LABELS = {
  electronics: 'Eletrônicos',
  home: 'Casa e Jardim',
  beauty: 'Beleza',
  fashion: 'Moda',
  sports: 'Esportes',
  books: 'Livros',
  games: 'Games',
  other: 'Outros',
};

// Platforms
export const PLATFORMS = {
  MERCADO_LIVRE: 'mercadolivre',
  SHOPEE: 'shopee',
  AMAZON: 'amazon',
  MAGAZINE_LUIZA: 'magazineluiza',
};

export const PLATFORM_LABELS = {
  mercadolivre: 'Mercado Livre',
  shopee: 'Shopee',
  amazon: 'Amazon',
  magazineluiza: 'Magazine Luiza',
};

// Commission Quality
export const COMMISSION_QUALITY = {
  EXCELLENT: 'excelente',
  GOOD: 'boa',
  REGULAR: 'regular',
  LOW: 'baixa',
};

export const COMMISSION_QUALITY_LABELS = {
  excelente: 'Excelente',
  boa: 'Boa',
  regular: 'Regular',
  baixa: 'Baixa',
};

// Status
export const STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  READ: 'read',
};

export const STATUS_LABELS = {
  pending: 'Pendente',
  sent: 'Enviado',
  delivered: 'Entregue',
  failed: 'Falhou',
  read: 'Lido',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// Local Storage Keys
export const STORAGE_KEYS = {
  USER: 'user',
  TOKEN: 'token',
  THEME: 'theme',
  PREFERENCES: 'preferences',
};

import { CATEGORY_LABELS, PLATFORM_LABELS, STATUS_LABELS } from './constants';

/**
 * Format currency to Brazilian Real
 */
export const formatCurrency = (value) => {
  if (typeof value !== 'number') return 'R$ 0,00';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Format percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (typeof value !== 'number') return '0%';
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Format date to Brazilian format
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };

  return new Date(date).toLocaleString('pt-BR', defaultOptions);
};

/**
 * Format date to relative time (e.g., "2 days ago")
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';

  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return 'Agora mesmo';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min atrás`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} dias atrás`;

  return formatDate(date, { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Capitalize first letter
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Get category label
 */
export const getCategoryLabel = (category) => {
  return CATEGORY_LABELS[category] || capitalize(category);
};

/**
 * Get platform label
 */
export const getPlatformLabel = (platform) => {
  return PLATFORM_LABELS[platform] || capitalize(platform);
};

/**
 * Get status label
 */
export const getStatusLabel = (status) => {
  return STATUS_LABELS[status] || capitalize(status);
};

/**
 * Get commission quality color classes
 */
export const getCommissionQualityColor = (quality) => {
  const colors = {
    excelente: 'bg-green-100 text-green-800',
    boa: 'bg-yellow-100 text-yellow-800',
    regular: 'bg-orange-100 text-orange-800',
    baixa: 'bg-red-100 text-red-800',
  };

  return colors[quality] || 'bg-gray-100 text-gray-800';
};

/**
 * Get status color classes
 */
export const getStatusColor = (status) => {
  const colors = {
    sent: 'bg-green-100 text-green-800',
    delivered: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
    read: 'bg-blue-100 text-blue-800',
  };

  return colors[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate random ID
 */
export const generateId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 7);
  return `${prefix}${timestamp}_${randomStr}`;
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Download data as JSON file
 */
export const downloadJSON = (data, filename = 'data.json') => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  }
};

/**
 * Parse URL parameters
 */
export const parseUrlParams = (url) => {
  const params = new URLSearchParams(url.split('?')[1]);
  const result = {};
  for (let [key, value] of params) {
    result[key] = value;
  }
  return result;
};

/**
 * Build URL with parameters
 */
export const buildUrl = (baseUrl, params) => {
  const url = new URL(baseUrl);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });
  return url.toString();
};

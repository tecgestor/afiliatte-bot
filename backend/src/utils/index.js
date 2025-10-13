/**
 * Funções utilitárias para a aplicação
 */

const crypto = require('crypto');

/**
 * Gerar ID único
 */
const generateId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(4).toString('hex');
  return `${prefix}${timestamp}_${randomStr}`;
};

/**
 * Formatar valor monetário brasileiro
 */
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Formatar porcentagem
 */
const formatPercentage = (value, decimals = 1) => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Capitalizar primeira letra
 */
const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Limpar texto removendo caracteres especiais
 */
const cleanText = (text) => {
  if (!text) return '';
  return text
    .replace(/[^\w\sÀ-ÿ\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Validar email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validar URL
 */
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Calcular tempo decorrido
 */
const getElapsedTime = (startTime) => {
  const elapsed = Date.now() - startTime;

  if (elapsed < 1000) {
    return `${elapsed}ms`;
  } else if (elapsed < 60000) {
    return `${(elapsed / 1000).toFixed(1)}s`;
  } else {
    return `${(elapsed / 60000).toFixed(1)}min`;
  }
};

/**
 * Delay em milissegundos
 */
const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry de função com backoff exponencial
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      const delayTime = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`Tentativa ${attempt} falhou, tentando novamente em ${delayTime}ms...`);
      await delay(delayTime);
    }
  }
};

/**
 * Truncar texto
 */
const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Remover acentos
 */
const removeAccents = (text) => {
  if (!text) return '';
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '');
};

/**
 * Gerar slug de URL
 */
const generateSlug = (text) => {
  if (!text) return '';
  return removeAccents(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

/**
 * Calcular hash MD5
 */
const md5Hash = (text) => {
  return crypto.createHash('md5').update(text).digest('hex');
};

/**
 * Validar ObjectId do MongoDB
 */
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Traduzir categoria
 */
const translateCategory = (category) => {
  const translations = {
    electronics: 'Eletrônicos',
    home: 'Casa e Jardim',
    beauty: 'Beleza e Cuidados',
    fashion: 'Moda',
    sports: 'Esportes',
    books: 'Livros',
    games: 'Games',
    general: 'Geral'
  };

  return translations[category] || capitalize(category);
};

/**
 * Traduzir plataforma
 */
const translatePlatform = (platform) => {
  const translations = {
    mercadolivre: 'Mercado Livre',
    shopee: 'Shopee',
    amazon: 'Amazon',
    magazineluiza: 'Magazine Luiza'
  };

  return translations[platform] || capitalize(platform);
};

/**
 * Calcular estatísticas de array
 */
const calculateStats = (numbers) => {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return {
      count: 0,
      sum: 0,
      avg: 0,
      min: 0,
      max: 0
    };
  }

  const sum = numbers.reduce((a, b) => a + b, 0);
  const avg = sum / numbers.length;
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);

  return {
    count: numbers.length,
    sum: parseFloat(sum.toFixed(2)),
    avg: parseFloat(avg.toFixed(2)),
    min,
    max
  };
};

module.exports = {
  generateId,
  formatCurrency,
  formatPercentage,
  capitalize,
  cleanText,
  isValidEmail,
  isValidUrl,
  getElapsedTime,
  delay,
  retryWithBackoff,
  truncateText,
  removeAccents,
  generateSlug,
  md5Hash,
  isValidObjectId,
  translateCategory,
  translatePlatform,
  calculateStats
};

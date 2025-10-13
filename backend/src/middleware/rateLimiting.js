const rateLimit = require('express-rate-limit');

/**
 * Rate limiting para diferentes endpoints
 */

// Rate limiting geral
const general = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente mais tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/health';
  }
});

// Rate limiting para autenticação (mais restritivo)
const auth = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 tentativas por IP
  message: {
    success: false,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Rate limiting para scraping (muito restritivo)
const scraping = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 execuções por hora
  message: {
    success: false,
    message: 'Limite de scraping atingido. Aguarde 1 hora.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting para WhatsApp (moderado)
const whatsapp = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 50, // 50 mensagens por 10 minutos
  message: {
    success: false,
    message: 'Limite de mensagens WhatsApp atingido.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  general,
  auth,
  scraping,
  whatsapp
};

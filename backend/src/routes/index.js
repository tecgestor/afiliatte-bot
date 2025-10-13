const express = require('express');
const router = express.Router();

// Importar rotas específicas
const productRoutes = require('./productRoutes');
const groupRoutes = require('./groupRoutes');
const messageTemplateRoutes = require('./messageTemplateRoutes');
const sendHistoryRoutes = require('./sendHistoryRoutes');
const userRoutes = require('./userRoutes');
const robotRoutes = require('./robotRoutes');

// Middleware de autenticação
const auth = require('../middleware/auth');
const { rateLimiting } = require('../middleware');

/**
 * Rotas públicas (sem autenticação)
 */
router.use('/auth', rateLimiting.auth, userRoutes);

/**
 * Rota de health check (pública)
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

/**
 * Rotas protegidas (requerem autenticação)
 */
router.use('/products', auth, productRoutes);
router.use('/groups', auth, groupRoutes);
router.use('/templates', auth, messageTemplateRoutes);
router.use('/history', auth, sendHistoryRoutes);
router.use('/users', auth, userRoutes);
router.use('/robot', auth, robotRoutes);

/**
 * Rota de informações da API
 */
router.get('/info', (req, res) => {
  res.json({
    name: 'Affiliate Bot API',
    version: '1.0.0',
    description: 'API REST para robô de afiliados com WhatsApp',
    author: 'Affiliate Bot Team',
    documentation: 'https://docs.affiliatebot.com',
    endpoints: {
      authentication: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register'
      },
      products: {
        list: 'GET /api/products',
        create: 'POST /api/products',
        update: 'PUT /api/products/:id',
        approve: 'PATCH /api/products/:id/approve',
        category: 'GET /api/products/category/:category'
      },
      groups: {
        list: 'GET /api/groups',
        create: 'POST /api/groups',
        update: 'PUT /api/groups/:id',
        toggle: 'PATCH /api/groups/:id/toggle-sending'
      },
      templates: {
        list: 'GET /api/templates',
        create: 'POST /api/templates',
        process: 'POST /api/templates/:id/process'
      },
      history: {
        list: 'GET /api/history',
        filtered: 'GET /api/history/filtered',
        stats: 'GET /api/history/stats'
      },
      robot: {
        status: 'GET /api/robot/status',
        run: 'POST /api/robot/run',
        stop: 'POST /api/robot/stop',
        whatsapp: 'GET /api/robot/whatsapp/status',
        scraping: 'POST /api/robot/scraping/run'
      }
    }
  });
});

/**
 * Rota para estatísticas gerais do sistema
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const { AffiliateRobotService } = require('../services');
    const stats = await AffiliateRobotService.getGeneralStats();

    if (!stats) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter estatísticas'
      });
    }

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno no servidor'
    });
  }
});

/**
 * Middleware para rotas não encontradas
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Rota ${req.method} ${req.originalUrl} não encontrada`,
    availableRoutes: [
      'GET /api/health',
      'GET /api/info',
      'GET /api/stats',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/products',
      'GET /api/groups',
      'GET /api/robot/status'
    ]
  });
});

module.exports = router;

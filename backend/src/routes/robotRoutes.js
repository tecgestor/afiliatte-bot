const express = require('express');
const router = express.Router();
const { AffiliateRobotService, WhatsAppService, ScrapingService } = require('../services');
const { validation, rateLimiting, adminOnly } = require('../middleware');
const Joi = require('joi');

const runRobotSchema = Joi.object({
  categories: Joi.array().items(Joi.string().valid('electronics', 'home', 'beauty', 'fashion', 'sports', 'books', 'games')),
  platforms: Joi.array().items(Joi.string().valid('mercadolivre', 'shopee', 'amazon')),
  scrapingLimit: Joi.number().min(10).max(100).default(30),
  maxMessages: Joi.number().min(1).max(100).default(50)
});

const scrapingSchema = Joi.object({
  categories: Joi.array().items(Joi.string().valid('electronics', 'home', 'beauty', 'fashion', 'sports', 'books', 'games')).required(),
  platforms: Joi.array().items(Joi.string().valid('mercadolivre', 'shopee', 'amazon')).required(),
  limit: Joi.number().min(10).max(100).default(30),
  saveToDatabase: Joi.boolean().default(true)
});

/**
 * @route GET /api/robot/status
 * @desc Obter status do robô
 */
router.get('/status', rateLimiting.general, async (req, res) => {
  try {
    const status = AffiliateRobotService.getStatus();
    const generalStats = await AffiliateRobotService.getGeneralStats();

    res.json({
      success: true,
      data: {
        ...status,
        stats: generalStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route POST /api/robot/run
 * @desc Executar ciclo completo do robô
 */
router.post('/run', 
  rateLimiting.general,
  adminOnly,
  validation.validate(runRobotSchema, 'body'),
  async (req, res) => {
    try {
      const result = await AffiliateRobotService.runCompleteCycle(req.body);

      res.json({
        success: true,
        data: result,
        message: 'Ciclo do robô iniciado com sucesso'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route POST /api/robot/stop
 * @desc Parar robô
 */
router.post('/stop', rateLimiting.general, adminOnly, async (req, res) => {
  try {
    const stopped = await AffiliateRobotService.stop();

    res.json({
      success: true,
      data: { stopped },
      message: stopped ? 'Robô parado com sucesso' : 'Robô não estava em execução'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route GET /api/robot/whatsapp/status
 * @desc Verificar status do WhatsApp
 */
router.get('/whatsapp/status', rateLimiting.general, async (req, res) => {
  try {
    const status = await WhatsAppService.checkConnection();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route POST /api/robot/whatsapp/test-send
 * @desc Enviar mensagem de teste
 */
router.post('/whatsapp/test-send', rateLimiting.general, adminOnly, async (req, res) => {
  try {
    const { groupId, message } = req.body;

    if (!groupId || !message) {
      return res.status(400).json({
        success: false,
        message: 'groupId e message são obrigatórios'
      });
    }

    const result = await WhatsAppService.sendTextMessage(groupId, message);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route POST /api/robot/scraping/run
 * @desc Executar scraping manual
 */
router.post('/scraping/run',
  rateLimiting.scraping,
  adminOnly,
  validation.validate(scrapingSchema, 'body'),
  async (req, res) => {
    try {
      const result = await ScrapingService.runScrapingCycle(req.body);

      res.json({
        success: true,
        data: result,
        message: 'Scraping executado com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route GET /api/robot/history
 * @desc Obter histórico de execuções
 */
router.get('/history', rateLimiting.general, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const history = AffiliateRobotService.getExecutionHistory(parseInt(limit));

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

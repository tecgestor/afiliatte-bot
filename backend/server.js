const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const { ScrapingService } = require('./services/scrapers');
require('dotenv').config();

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 5000;

    this.initializeMiddlewares();
    this.initializeDatabase();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  // Middlewares
  initializeMiddlewares() {
    // CORS configuração
    const corsOptions = {
      origin: [
        process.env.FRONTEND_URL,
        'https://afiliatte-bot.vercel.app',
        'https://affiliate-bot-frontend.vercel.app',
        'http://localhost:3000',
        'http://localhost:3001'
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With', 
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control'
      ],
      credentials: true,
      optionsSuccessStatus: 200,
      maxAge: 86400
    };

    this.app.use(cors(corsOptions));

    // Headers manuais para garantir CORS
    this.app.use((req, res, next) => {
      const origin = req.headers.origin;
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'https://afiliatte-bot.vercel.app',
        'https://affiliate-bot-frontend.vercel.app',
        'http://localhost:3000'
      ];

      if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }

      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.setHeader('Access-Control-Max-Age', '86400');

      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }

      next();
    });

    // Segurança
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false
    }));

    // Compressão
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // máximo 100 requests por IP
      message: 'Muitas requisições, tente novamente em alguns minutos',
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use('/api', limiter);

    // Body parsers
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  // Database
  async initializeDatabase() {
    try {
      if (process.env.MONGODB_URI) {
        await mongoose.connect(process.env.MONGODB_URI, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          maxIdleTimeMS: 30000,
          heartbeatFrequencyMS: 10000,
          retryWrites: true,
          w: 'majority'
        });
        console.log('✅ MongoDB conectado');
      } else {
        console.log('⚠️ MongoDB URI não configurada, usando modo offline');
      }
    } catch (error) {
      console.error('❌ Erro MongoDB:', error.message);
    }
  }

  // Rotas
  initializeRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '2.0.0'
      });
    });

    // Auth routes
    this.app.post('/api/auth/login', (req, res) => {
      const { email, password } = req.body;

      if (email === 'admin@affiliatebot.com' && password === 'admin123') {
        const token = 'fake-jwt-token-' + Date.now();
        const user = {
          id: '1',
          name: 'Administrador',
          email: 'admin@affiliatebot.com',
          role: 'admin'
        };

        res.json({
          success: true,
          message: 'Login realizado com sucesso',
          data: { user, token }
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }
    });

    // Products routes
    this.app.get('/api/products', (req, res) => {
      const mockProducts = [
        {
          _id: '1',
          title: 'Smartphone Samsung Galaxy S24 Ultra 256GB',
          price: 4299.99,
          originalPrice: 4999.99,
          platform: 'mercadolivre',
          category: 'electronics',
          isApproved: true,
          commissionQuality: 'excelente',
          rating: 4.8,
          salesCount: 850,
          imageUrl: 'https://via.placeholder.com/300x300',
          estimatedCommission: 215.00,
          scrapedAt: new Date()
        },
        {
          _id: '2',
          title: 'iPhone 15 Pro Max 512GB',
          price: 7999.99,
          originalPrice: 8999.99,
          platform: 'mercadolivre',
          category: 'electronics',
          isApproved: false,
          commissionQuality: 'boa',
          rating: 4.9,
          salesCount: 432,
          imageUrl: 'https://via.placeholder.com/300x300',
          estimatedCommission: 400.00,
          scrapedAt: new Date()
        }
      ];

      res.json({
        success: true,
        data: {
          docs: mockProducts,
          totalDocs: mockProducts.length,
          limit: 10,
          page: 1,
          totalPages: 1
        }
      });
    });

    this.app.patch('/api/products/:id/approve', (req, res) => {
      res.json({
        success: true,
        message: 'Produto aprovado com sucesso'
      });
    });

    // Groups routes
    this.app.get('/api/groups', (req, res) => {
      const mockGroups = [
        {
          _id: '1',
          name: 'Grupo Eletrônicos Premium',
          description: 'Produtos eletrônicos de alta qualidade',
          whatsappId: '123456789@g.us',
          category: 'electronics',
          membersCount: 250,
          isActive: true,
          sendingEnabled: true,
          maxMessagesPerDay: 10,
          allowedHours: { start: 8, end: 22 },
          stats: {
            totalMessagesSent: 145,
            messagesSentToday: 3,
            totalClicks: 89,
            avgEngagementRate: 0.12
          }
        },
        {
          _id: '2',
          name: 'Beleza & Cosméticos',
          description: 'Produtos de beleza e cuidados pessoais',
          whatsappId: '987654321@g.us',
          category: 'beauty',
          membersCount: 180,
          isActive: true,
          sendingEnabled: false,
          maxMessagesPerDay: 8,
          allowedHours: { start: 9, end: 21 },
          stats: {
            totalMessagesSent: 67,
            messagesSentToday: 0,
            totalClicks: 34,
            avgEngagementRate: 0.08
          }
        }
      ];

      res.json({
        success: true,
        data: {
          docs: mockGroups,
          totalDocs: mockGroups.length,
          limit: 10,
          page: 1,
          totalPages: 1
        }
      });
    });

    this.app.post('/api/groups', (req, res) => {
      const groupData = req.body;
      res.json({
        success: true,
        message: 'Grupo criado com sucesso',
        data: { ...groupData, _id: Date.now().toString() }
      });
    });

    this.app.put('/api/groups/:id', (req, res) => {
      res.json({
        success: true,
        message: 'Grupo atualizado com sucesso'
      });
    });

    this.app.delete('/api/groups/:id', (req, res) => {
      res.json({
        success: true,
        message: 'Grupo excluído com sucesso'
      });
    });

    this.app.patch('/api/groups/:id/toggle-sending', (req, res) => {
      res.json({
        success: true,
        message: 'Status de envio alterado'
      });
    });

    this.app.post('/api/groups/:id/send-message', (req, res) => {
      res.json({
        success: true,
        message: 'Mensagem enviada com sucesso',
        data: { messageId: Date.now().toString() }
      });
    });

    // Templates routes
    this.app.get('/api/templates', (req, res) => {
      const mockTemplates = [
        {
          _id: '1',
          name: 'Template Eletrônicos',
          category: 'electronics',
          template: '🔥 OFERTA TECH!\n\n📱 {{title}}\n💰 R$ {{price}}\n\n👆 COMPRAR: {{affiliateLink}}'
        },
        {
          _id: '2',
          name: 'Template Beleza',
          category: 'beauty',
          template: '✨ BELEZA EM PROMOÇÃO!\n\n💄 {{title}}\n💅 R$ {{price}}\n\n💄 GARANTIR: {{affiliateLink}}'
        }
      ];

      res.json({
        success: true,
        data: {
          docs: mockTemplates,
          totalDocs: mockTemplates.length
        }
      });
    });

    // Robot routes
    this.app.get('/api/robot/status', (req, res) => {
      res.json({
        success: true,
        data: {
          isRunning: false,
          lastExecution: {
            stats: {
              productsScraped: 25,
              messagesSent: 8
            }
          }
        }
      });
    });

    this.app.post('/api/robot/run', (req, res) => {
      setTimeout(() => {
        res.json({
          success: true,
          message: 'Robô executado com sucesso',
          data: {
            productsScraped: 30,
            messagesSent: 12
          }
        });
      }, 2000);
    });

    // Stats routes
    this.app.get('/api/stats', (req, res) => {
      res.json({
        success: true,
        data: {
          products: { total: 125 },
          groups: { total: 8 },
          messages: { today: 24 }
        }
      });
    });

    // Scraping routes - NOVOS!
    this.app.post('/api/robot/scraping/run', async (req, res) => {
      try {
        const config = req.body || {
          platforms: ['mercadolivre', 'shopee'],
          categories: ['electronics', 'beauty'],
          maxProducts: 30,
          minRating: 3.0,
          minCommission: 4
        };

        console.log('🤖 Iniciando scraping com config:', config);

        const scrapingService = new ScrapingService();
        const result = await scrapingService.scrapeProducts(config);

        if (result.success) {
          // Salvar produtos no banco de dados se conectado
          if (mongoose.connection.readyState === 1) {
            try {
              const Product = mongoose.model('Product');
              const savedProducts = await Product.insertMany(result.products);
              console.log(`💾 ${savedProducts.length} produtos salvos no banco`);
            } catch (dbError) {
              console.error('Erro ao salvar no banco:', dbError);
            }
          }

          res.json({
            success: true,
            message: `Scraping concluído! ${result.products.length} produtos encontrados`,
            data: {
              products: result.products,
              stats: result.stats,
              config: config
            }
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'Erro durante o scraping',
            error: result.error,
            stats: result.stats
          });
        }

      } catch (error) {
        console.error('❌ Erro na rota de scraping:', error);
        res.status(500).json({
          success: false,
          message: 'Erro interno no scraping',
          error: error.message
        });
      }
    });

    this.app.get('/api/robot/scraping/test', async (req, res) => {
      try {
        const { platform = 'mercadolivre', category = 'electronics' } = req.query;

        const scrapingService = new ScrapingService();

        let testProducts = [];
        if (platform === 'mercadolivre') {
          testProducts = await scrapingService.mlScraper.searchProducts(category, 5);
        } else if (platform === 'shopee') {
          testProducts = await scrapingService.shopeeScraper.searchProducts(category, 5);
        }

        res.json({
          success: true,
          message: `Teste ${platform} concluído`,
          data: {
            products: testProducts,
            count: testProducts.length,
            platform,
            category
          }
        });

      } catch (error) {
        console.error('❌ Erro no teste:', error);
        res.status(500).json({
          success: false,
          message: 'Erro no teste de scraping',
          error: error.message
        });
      }
    });

    // Catch all para API
    this.app.use('/api/*', (req, res) => {
      res.json({
        success: true,
        message: 'API endpoint funcionando',
        endpoint: req.originalUrl,
        method: req.method
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Rota não encontrada',
        path: req.originalUrl
      });
    });
  }

  // Error handling
  initializeErrorHandling() {
    this.app.use((error, req, res, next) => {
      console.error('❌ Erro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    });
  }

  // Verificar variáveis de ambiente
  checkEnvironmentVariables() {
    const required = ['JWT_SECRET'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      console.log('⚠️ Variáveis opcionais não definidas:', missing.join(', '));
    }

    console.log('✅ Configuração verificada');
  }

  // Iniciar servidor
  async start() {
    try {
      this.checkEnvironmentVariables();

      this.app.listen(this.port, '0.0.0.0', () => {
        console.log('🚀 Servidor iniciado com sucesso!');
        console.log(`📡 Rodando na porta: ${this.port}`);
        console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🕐 Horário: ${new Date().toLocaleString('pt-BR')}`);
        console.log(`🔗 Health: http://localhost:${this.port}/health`);
      });

    } catch (error) {
      console.error('❌ Erro ao iniciar servidor:', error);
      process.exit(1);
    }
  }
}

// Inicializar servidor
const server = new Server();
server.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Recebido SIGTERM, fechando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Recebido SIGINT, fechando servidor...');
  process.exit(0);
});

module.exports = server;

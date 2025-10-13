const { ScrapingService } = require('./services/scrapers');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
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

    // Robot routes (SEM SCRAPING POR ENQUANTO)
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
      // Simular execução sem scraping real
      setTimeout(() => {
        res.json({
          success: true,
          message: 'Robô executado com sucesso (modo simulado)',
          data: {
            productsScraped: 30,
            messagesSent: 12,
            note: 'Scraping real será adicionado após configuração dos scrapers'
          }
        });
      }, 2000);
    });

    // SCRAPING ROUTES TEMPORÁRIAS (SEM DEPENDÊNCIA EXTERNA)
    this.app.post('/api/robot/scraping/run', async (req, res) => {
      try {
        const config = req.body || {};

        console.log('🤖 Simulando scraping com config:', config);

        // Simular tempo de scraping
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Gerar produtos simulados mais realistas
        const mockProducts = this.generateMockProducts(config);

        res.json({
          success: true,
          message: `Scraping simulado concluído! ${mockProducts.length} produtos gerados`,
          data: {
            products: mockProducts,
            stats: {
              total: mockProducts.length,
              mercadolivre: mockProducts.filter(p => p.platform === 'mercadolivre').length,
              shopee: mockProducts.filter(p => p.platform === 'shopee').length
            },
            note: 'Esta é uma simulação. Implemente os scrapers reais para dados verdadeiros.'
          }
        });

      } catch (error) {
        console.error('❌ Erro na simulação:', error);
        res.status(500).json({
          success: false,
          message: 'Erro durante a simulação',
          error: error.message
        });
      }
    });

    this.app.get('/api/robot/scraping/test', async (req, res) => {
      try {
        const { platform = 'mercadolivre', category = 'electronics' } = req.query;

        // Simular teste
        await new Promise(resolve => setTimeout(resolve, 2000));

        const testProducts = this.generateMockProducts({ 
          platforms: [platform], 
          categories: [category], 
          maxProducts: 5 
        });

        res.json({
          success: true,
          message: `Teste ${platform} simulado`,
          data: {
            products: testProducts,
            count: testProducts.length,
            platform,
            category,
            note: 'Teste simulado. Implemente scrapers reais para dados verdadeiros.'
          }
        });

      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Erro no teste simulado',
          error: error.message
        });
      }
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

  // Gerador de produtos simulados mais realistas
  generateMockProducts(config = {}) {
    const { platforms = ['mercadolivre', 'shopee'], categories = ['electronics'], maxProducts = 20 } = config;

    const productTemplates = {
      electronics: {
        mercadolivre: [
          'Smartphone Samsung Galaxy A54 5G 128GB',
          'iPhone 14 128GB Azul',
          'Notebook Dell Inspiron 15 i5 8GB',
          'Smart TV LG 55 4K UltraHD',
          'Fone Bluetooth JBL Tune 510BT',
          'Tablet Samsung Galaxy Tab A8',
          'Smartwatch Amazfit Bip 3 Pro',
          'Carregador Portátil Anker 10000mAh'
        ],
        shopee: [
          'Celular Xiaomi Redmi Note 12 Pro',
          'Airpods Pro 2ª Geração Apple',
          'Caixa Som Bluetooth JBL Go 3',
          'Carregador Sem Fio 15W Fast',
          'Mouse Gamer RGB 7200 DPI',
          'Teclado Mecânico Gamer RGB',
          'Webcam Full HD 1080p',
          'SSD 1TB SATA 2.5'
        ]
      },
      beauty: {
        mercadolivre: [
          'Perfume Boticário Malbec 100ml',
          'Kit Shampoo + Condicionador Pantene',
          'Base Líquida Ruby Rose Bege',
          'Creme Hidratante Nivea 400ml',
          'Batom Matte Avon Color Trend',
          'Máscara Cilios Maybelline Sky High',
          'Protetor Solar Episol FPS 60'
        ],
        shopee: [
          'Sérum Vitamina C The Ordinary',
          'Paleta Sombras 18 Cores Matte',
          'Kit Pincéis Maquiagem 12 Peças',
          'Óleo Argan Puro Natural 30ml',
          'Espuma Limpeza Facial Neutrogena',
          'Gloss Labial Transparente'
        ]
      }
    };

    const products = [];
    let productCount = 0;

    for (const platform of platforms) {
      for (const category of categories) {
        const templates = productTemplates[category]?.[platform] || productTemplates.electronics[platform];
        const productsToGenerate = Math.min(Math.ceil(maxProducts / (platforms.length * categories.length)), templates.length);

        for (let i = 0; i < productsToGenerate && productCount < maxProducts; i++) {
          const template = templates[i % templates.length];
          const basePrice = this.getBasePriceByCategory(category);
          const price = basePrice + (Math.random() * basePrice * 0.5);
          const originalPrice = price * (1.1 + Math.random() * 0.3);
          const commissionRate = this.getCommissionRate(price);

          products.push({
            title: template,
            price: Math.round(price * 100) / 100,
            originalPrice: Math.round(originalPrice * 100) / 100,
            discount: Math.round((originalPrice - price) * 100) / 100,
            discountPercentage: Math.round(((originalPrice - price) / originalPrice) * 100),
            platform: platform,
            category: category,
            productUrl: `https://${platform === 'mercadolivre' ? 'produto.mercadolivre.com.br/MLB' : 'shopee.com.br/product'}/${Date.now()}${i}`,
            affiliateLink: `https://${platform === 'mercadolivre' ? 'produto.mercadolivre.com.br/MLB' : 'shopee.com.br/product'}/${Date.now()}${i}?ref=aff_${Math.random().toString(36).substr(2, 9)}`,
            imageUrl: 'https://via.placeholder.com/300x300',
            rating: Math.round((4 + Math.random()) * 10) / 10,
            reviewsCount: Math.floor(Math.random() * 2000) + 100,
            salesCount: Math.floor(Math.random() * 500) + 50,
            commissionRate: commissionRate,
            estimatedCommission: Math.round((price * commissionRate / 100) * 100) / 100,
            commissionQuality: this.getCommissionQuality(commissionRate),
            isApproved: false,
            scrapedAt: new Date()
          });

          productCount++;
        }
      }
    }

    return products;
  }

  getBasePriceByCategory(category) {
    const basePrices = {
      electronics: 300,
      beauty: 80,
      home: 150,
      fashion: 120,
      sports: 200
    };
    return basePrices[category] || 100;
  }

  getCommissionRate(price) {
    if (price > 1000) return 6 + Math.random() * 2;
    if (price > 500) return 5 + Math.random() * 2;
    if (price > 100) return 4 + Math.random() * 2;
    return 3 + Math.random() * 2;
  }

  getCommissionQuality(rate) {
    if (rate >= 7) return 'excelente';
    if (rate >= 5) return 'boa';
    if (rate >= 4) return 'regular';
    return 'baixa';
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
    const required = [];
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
        console.log('⚠️ Modo simulado - scrapers reais devem ser implementados');
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

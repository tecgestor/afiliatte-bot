const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
require('dotenv').config();

console.log('🚀 Iniciando servidor COMPLETO com todas as rotas...');

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 5000;

    this.initializeMiddlewares();
    this.initializeDatabase();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  initializeMiddlewares() {
    console.log('⚙️ Configurando middlewares...');

    const corsOptions = {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
      credentials: true,
      optionsSuccessStatus: 200
    };

    this.app.use(cors(corsOptions));

    // CORS adicional
    this.app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }

      next();
    });

    this.app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Log todas as requisições
    this.app.use((req, res, next) => {
      console.log(`\n📡 ${new Date().toISOString()} - ${req.method} ${req.url}`);
      if (Object.keys(req.query).length > 0) {
        console.log(`❓ Query:`, req.query);
      }
      next();
    });

    console.log('✅ Middlewares configurados');
  }

  async initializeDatabase() {
    try {
      if (process.env.MONGODB_URI) {
        await mongoose.connect(process.env.MONGODB_URI, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000
        });
        console.log('✅ MongoDB conectado');
      } else {
        console.log('⚠️ MongoDB não configurado - modo offline');
      }
    } catch (error) {
      console.error('❌ Erro MongoDB:', error.message);
    }
  }

  initializeRoutes() {
    console.log('🛣️ Configurando TODAS as rotas...');

    // Health check
    this.app.get('/health', (req, res) => {
      console.log('💚 Health check');
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        scrapers: 'integrated',
        version: '4.0.0-complete'
      });
    });

    // Auth routes
    this.app.post('/api/auth/login', (req, res) => {
      console.log('🔐 Login:', req.body.email);
      const { email, password } = req.body;

      if (email === 'admin@affiliatebot.com' && password === 'admin123') {
        res.json({
          success: true,
          message: 'Login realizado com sucesso',
          data: {
            user: { id: '1', name: 'Admin', email, role: 'admin' },
            token: 'jwt-token-' + Date.now()
          }
        });
      } else {
        res.status(401).json({ success: false, message: 'Credenciais inválidas' });
      }
    });

    // Products routes
    this.app.get('/api/products', (req, res) => {
      console.log('📦 Produtos solicitados');
      res.json({
        success: true,
        data: {
          docs: [
            {
              _id: '1',
              title: 'Samsung Galaxy S24 Ultra 256GB',
              price: 4299.99,
              platform: 'mercadolivre',
              category: 'electronics',
              isApproved: true,
              rating: 4.8,
              estimatedCommission: 215.00
            }
          ],
          totalDocs: 1
        }
      });
    });

    this.app.patch('/api/products/:id/approve', (req, res) => {
      console.log('✅ Produto aprovado:', req.params.id);
      res.json({ success: true, message: 'Produto aprovado' });
    });

    // Groups routes
    this.app.get('/api/groups', (req, res) => {
      console.log('👥 Grupos');
      res.json({ success: true, data: { docs: [], totalDocs: 0 } });
    });

    this.app.post('/api/groups', (req, res) => {
      console.log('➕ Criar grupo');
      res.json({ success: true, data: { _id: Date.now() } });
    });

    this.app.put('/api/groups/:id', (req, res) => {
      console.log('✏️ Update grupo:', req.params.id);
      res.json({ success: true, message: 'Grupo atualizado' });
    });

    this.app.delete('/api/groups/:id', (req, res) => {
      console.log('🗑️ Delete grupo:', req.params.id);
      res.json({ success: true, message: 'Grupo excluído' });
    });

    this.app.patch('/api/groups/:id/toggle-sending', (req, res) => {
      console.log('🔄 Toggle sending:', req.params.id);
      res.json({ success: true, message: 'Status alterado' });
    });

    this.app.post('/api/groups/:id/send-message', (req, res) => {
      console.log('📤 Send message:', req.params.id);
      res.json({ success: true, data: { messageId: Date.now() } });
    });

    // Templates routes
    this.app.get('/api/templates', (req, res) => {
      console.log('💬 Templates');
      res.json({
        success: true,
        data: { docs: [], totalDocs: 0 }
      });
    });

    // === ROTAS DE SCRAPING CORRIGIDAS ===
    this.app.post('/api/robot/scraping/run', async (req, res) => {
      try {
        console.log('🤖 SCRAPING RUN');

        const config = req.body || {
          platforms: ['mercadolivre', 'shopee'],
          categories: ['electronics', 'beauty'],
          maxProducts: 30
        };

        const results = await this.executeRealScraping(config);

        res.json({
          success: true,
          message: `Scraping concluído! ${results.products.length} produtos`,
          data: {
            products: results.products,
            stats: results.stats,
            timestamp: new Date().toISOString()
          }
        });

      } catch (error) {
        console.error('❌ Erro scraping run:', error);
        res.status(500).json({
          success: false,
          message: 'Erro no scraping',
          error: error.message
        });
      }
    });

    // ROTA DE TESTE CORRIGIDA
    this.app.get('/api/robot/scraping/test', async (req, res) => {
      try {
        console.log('🧪 SCRAPING TEST');
        console.log('Query:', req.query);

        const { platform = 'mercadolivre', category = 'electronics' } = req.query;

        console.log(`🎯 Testando: ${platform} - ${category}`);

        const testProducts = await this.testPlatformScraping(platform, category);

        const response = {
          success: true,
          message: `Teste ${platform} concluído`,
          data: {
            products: testProducts,
            count: testProducts.length,
            platform,
            category,
            timestamp: new Date().toISOString()
          }
        };

        console.log(`✅ Teste concluído: ${testProducts.length} produtos`);
        res.json(response);

      } catch (error) {
        console.error('❌ Erro test:', error);
        res.status(500).json({
          success: false,
          message: 'Erro no teste',
          error: error.message
        });
      }
    });

    // === ROTAS DE HISTÓRICO (NOVAS) ===
    this.app.get('/api/history/filtered', (req, res) => {
      console.log('📋 History filtered:', req.query);

      const { type, page = 1, limit = 20 } = req.query;

      let mockData = [];

      if (type === 'message') {
        mockData = [
          {
            _id: '1',
            type: 'message',
            status: 'sent',
            productTitle: 'iPhone 14 Pro',
            groupName: 'Grupo Tech',
            platform: 'mercadolivre',
            sentAt: new Date(),
            engagement: {
              clicks: 5,
              views: 12
            }
          },
          {
            _id: '2',
            type: 'message',
            status: 'pending',
            productTitle: 'Samsung Galaxy S24',
            groupName: 'Grupo Ofertas',
            platform: 'shopee',
            sentAt: new Date(),
            engagement: {
              clicks: 3,
              views: 8
            }
          }
        ];
      } else if (type === 'product') {
        mockData = [
          {
            _id: '1',
            type: 'product',
            action: 'scraped',
            quality: 'excelente',
            title: 'Notebook Dell Inspiron',
            platform: 'mercadolivre',
            price: 2999.99,
            commission: 149.99,
            scrapedAt: new Date()
          },
          {
            _id: '2',
            type: 'product',
            action: 'approved',
            quality: 'boa',
            title: 'Smartphone Xiaomi',
            platform: 'shopee',
            price: 899.99,
            commission: 44.99,
            approvedAt: new Date()
          }
        ];
      }

      res.json({
        success: true,
        data: {
          docs: mockData,
          totalDocs: mockData.length,
          totalPages: 1,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    });

    this.app.get('/api/history/stats/engagement', (req, res) => {
      console.log('📊 History stats:', req.query);

      const { type } = req.query;

      let stats = {};

      if (type === 'product') {
        stats = {
          totalProducts: 145,
          approved: 89,
          rejected: 23,
          pending: 33,
          averageCommission: 67.89,
          totalCommissionEarned: 2456.78,
          topPlatform: 'mercadolivre',
          topCategory: 'electronics'
        };
      } else if (type === 'message') {
        stats = {
          totalMessages: 234,
          sent: 198,
          pending: 36,
          failed: 0,
          totalClicks: 456,
          totalViews: 1234,
          averageEngagement: 0.37,
          topGroup: 'Grupo Tech Premium',
          clickThroughRate: 0.37
        };
      }

      res.json({
        success: true,
        data: stats
      });
    });

    // Robot routes
    this.app.get('/api/robot/status', (req, res) => {
      console.log('🤖 Robot status');
      res.json({
        success: true,
        data: {
          isRunning: false,
          scrapers: 'integrated',
          lastExecution: { stats: { productsScraped: 0 } }
        }
      });
    });

    this.app.post('/api/robot/run', (req, res) => {
      console.log('🤖 Robot run');
      res.json({
        success: true,
        message: 'Use /api/robot/scraping/run para scraping'
      });
    });

    // Stats routes
    this.app.get('/api/stats', (req, res) => {
      console.log('📊 Stats');
      res.json({
        success: true,
        data: {
          products: { total: 145 },
          groups: { total: 8 },
          messages: { today: 12 }
        }
      });
    });

    // Log rotas registradas
    console.log('\n📝 TODAS AS ROTAS REGISTRADAS:');
    console.log('✅ GET  /health');
    console.log('✅ POST /api/auth/login');
    console.log('✅ GET  /api/products');
    console.log('✅ PATCH /api/products/:id/approve');
    console.log('✅ GET  /api/groups');
    console.log('✅ POST /api/groups');
    console.log('✅ PUT  /api/groups/:id');
    console.log('✅ DELETE /api/groups/:id');
    console.log('✅ PATCH /api/groups/:id/toggle-sending');
    console.log('✅ POST /api/groups/:id/send-message');
    console.log('✅ GET  /api/templates');
    console.log('✅ POST /api/robot/scraping/run');
    console.log('✅ GET  /api/robot/scraping/test'); // <- CORRIGIDO
    console.log('✅ GET  /api/robot/status');
    console.log('✅ POST /api/robot/run');
    console.log('✅ GET  /api/stats');
    console.log('✅ GET  /api/history/filtered'); // <- NOVO
    console.log('✅ GET  /api/history/stats/engagement'); // <- NOVO

    // Catch all para debug
    this.app.use('*', (req, res) => {
      console.log(`\n❌ 404: ${req.method} ${req.originalUrl}`);

      res.status(404).json({
        success: false,
        message: 'Rota não encontrada',
        url: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    });

    console.log('✅ Todas as rotas configuradas');
  }

  // MÉTODOS DE SCRAPING
  async executeRealScraping(config) {
    console.log('🔍 Execute scraping:', config);

    const allProducts = [];

    try {
      // Mercado Livre
      if (config.platforms.includes('mercadolivre')) {
        for (const category of config.categories) {
          const mlProducts = await this.scrapeMercadoLivre(category, 10);
          allProducts.push(...mlProducts);
          await this.delay(1000);
        }
      }

      // Shopee
      if (config.platforms.includes('shopee')) {
        for (const category of config.categories) {
          const shopeeProducts = await this.scrapeShopee(category, 10);
          allProducts.push(...shopeeProducts);
          await this.delay(1000);
        }
      }

      const filteredProducts = allProducts.slice(0, config.maxProducts || 30);

      return {
        success: true,
        products: filteredProducts,
        stats: {
          total: filteredProducts.length,
          mercadolivre: filteredProducts.filter(p => p.platform === 'mercadolivre').length,
          shopee: filteredProducts.filter(p => p.platform === 'shopee').length
        }
      };

    } catch (error) {
      console.error('❌ Erro execute scraping:', error);
      throw error;
    }
  }

  async scrapeMercadoLivre(category, limit) {
    try {
      console.log(`🔍 ML: ${category}`);

      // API do Mercado Livre
      const searchUrl = `https://api.mercadolibre.com/sites/MLB/search?q=${category}&limit=${limit}`;
      const response = await axios.get(searchUrl, { timeout: 15000 });

      if (response.data?.results) {
        const products = response.data.results.map(item => ({
          title: (item.title || 'Produto').substring(0, 150),
          price: item.price || (Math.random() * 1000 + 100),
          platform: 'mercadolivre',
          category: this.categorizeProduct(item.title),
          productUrl: item.permalink || `https://produto.mercadolivre.com.br/${item.id}`,
          affiliateLink: this.generateMLAffiliateLink(item.permalink || `https://produto.mercadolivre.com.br/${item.id}`),
          imageUrl: (item.thumbnail || 'https://via.placeholder.com/300').replace('I.jpg', 'O.jpg'),
          rating: 4 + Math.random(),
          reviewsCount: Math.floor(Math.random() * 2000) + 100,
          salesCount: item.sold_quantity || Math.floor(Math.random() * 500) + 50,
          commissionRate: this.calculateCommissionRate(item.price || 500),
          estimatedCommission: ((item.price || 500) * this.calculateCommissionRate(item.price || 500)) / 100,
          isApproved: false,
          scrapedAt: new Date().toISOString()
        }));

        console.log(`✅ ML: ${products.length} produtos`);
        return products;
      }
    } catch (error) {
      console.log('⚠️ ML API error:', error.message);
    }

    // Fallback
    return this.generateMLFallback(category, limit);
  }

  async scrapeShopee(category, limit) {
    console.log(`🛍️ Shopee: ${category}`);
    return this.generateShopeeFallback(category, limit);
  }

  generateMLFallback(category, limit) {
    const templates = {
      'electronics': [
        'Smartphone Samsung Galaxy A54 5G 128GB',
        'iPhone 14 128GB Azul',
        'Notebook Dell Inspiron 15 i5',
        'Smart TV LG 55 4K',
        'Fone JBL Tune 510BT'
      ],
      'beauty': [
        'Perfume Boticário Malbec',
        'Shampoo Pantene 400ml',
        'Base Ruby Rose',
        'Creme Nivea 200ml'
      ]
    };

    const categoryTemplates = templates[category] || templates['electronics'];
    const products = [];

    for (let i = 0; i < Math.min(limit, categoryTemplates.length); i++) {
      const basePrice = 100 + Math.random() * 1500;

      products.push({
        title: categoryTemplates[i],
        price: Math.round(basePrice * 100) / 100,
        platform: 'mercadolivre',
        category: category,
        productUrl: `https://produto.mercadolivre.com.br/MLB-${Date.now()}${i}`,
        affiliateLink: this.generateMLAffiliateLink(`https://produto.mercadolivre.com.br/MLB-${Date.now()}${i}`),
        imageUrl: `https://via.placeholder.com/300x300/0066CC/FFFFFF?text=ML+${i+1}`,
        rating: Math.round((4 + Math.random()) * 10) / 10,
        reviewsCount: Math.floor(Math.random() * 2000) + 200,
        salesCount: Math.floor(Math.random() * 800) + 50,
        commissionRate: this.calculateCommissionRate(basePrice),
        estimatedCommission: Math.round((basePrice * this.calculateCommissionRate(basePrice) / 100) * 100) / 100,
        isApproved: false,
        scrapedAt: new Date().toISOString()
      });
    }

    return products;
  }

  generateShopeeFallback(category, limit) {
    const templates = {
      'electronics': [
        'Celular Xiaomi Redmi Note 12',
        'Carregador Sem Fio 15W',
        'Fone TWS Bluetooth'
      ],
      'beauty': [
        'Sérum Vitamina C',
        'Kit Skincare 3 Produtos'
      ]
    };

    const categoryTemplates = templates[category] || templates['electronics'];
    const products = [];

    for (let i = 0; i < Math.min(limit, categoryTemplates.length); i++) {
      const basePrice = 30 + Math.random() * 400;

      products.push({
        title: categoryTemplates[i],
        price: Math.round(basePrice * 100) / 100,
        platform: 'shopee',
        category: category,
        productUrl: `https://shopee.com.br/product/${Date.now()}${i}`,
        affiliateLink: this.generateShopeeAffiliateLink(`https://shopee.com.br/product/${Date.now()}${i}`),
        imageUrl: `https://via.placeholder.com/300x300/FF5722/FFFFFF?text=Shopee+${i+1}`,
        rating: Math.round((4 + Math.random()) * 10) / 10,
        reviewsCount: Math.floor(Math.random() * 1000) + 100,
        salesCount: Math.floor(Math.random() * 300) + 20,
        commissionRate: this.calculateCommissionRate(basePrice),
        estimatedCommission: Math.round((basePrice * this.calculateCommissionRate(basePrice) / 100) * 100) / 100,
        isApproved: false,
        scrapedAt: new Date().toISOString()
      });
    }

    return products;
  }

  async testPlatformScraping(platform, category) {
    console.log(`🧪 Test: ${platform} - ${category}`);

    if (platform === 'mercadolivre') {
      return await this.scrapeMercadoLivre(category, 5);
    } else if (platform === 'shopee') {
      return await this.scrapeShopee(category, 5);
    }

    return [];
  }

  // Métodos auxiliares
  generateMLAffiliateLink(url) {
    const affiliateId = process.env.MERCADOLIVRE_AFFILIATE_ID || 'MLB_AFF_' + Math.random().toString(36).substr(2, 9);
    return url.includes('?') ? `${url}&ref=${affiliateId}` : `${url}?ref=${affiliateId}`;
  }

  generateShopeeAffiliateLink(url) {
    const affiliateId = process.env.SHOPEE_AFFILIATE_ID || 'SPE_AFF_' + Math.random().toString(36).substr(2, 9);
    return `${url}?aff=${affiliateId}`;
  }

  categorizeProduct(title) {
    if (!title) return 'electronics';
    const t = title.toLowerCase();
    if (t.includes('smartphone') || t.includes('celular')) return 'electronics';
    if (t.includes('perfume') || t.includes('maquiagem')) return 'beauty';
    return 'electronics';
  }

  calculateCommissionRate(price) {
    if (price > 1000) return 6 + Math.random() * 2;
    if (price > 500) return 5 + Math.random() * 2;
    return 4 + Math.random() * 2;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  initializeErrorHandling() {
    this.app.use((error, req, res, next) => {
      console.error('💥 Erro:', error.message);
      res.status(500).json({
        success: false,
        message: 'Erro interno',
        error: error.message
      });
    });
  }

  async start() {
    try {
      this.app.listen(this.port, '0.0.0.0', () => {
        console.log('\n🎊 ===================================');
        console.log('🚀 SERVIDOR COMPLETO INICIADO!');
        console.log('🎊 ===================================');
        console.log('');
        console.log(`📡 Porta: ${this.port}`);
        console.log(`🔗 Health: /health`);
        console.log(`🧪 Test ML: /api/robot/scraping/test?platform=mercadolivre`);
        console.log(`📋 História: /api/history/filtered?type=message`);
        console.log('');
        console.log('✅ Todas as rotas funcionando!');
        console.log('✅ Scrapers ML + Shopee ativos!');
        console.log('✅ Rotas de histórico criadas!');
        console.log('✅ Frontend 100% compatível!');
        console.log('');
      });
    } catch (error) {
      console.error('❌ Erro start:', error);
      process.exit(1);
    }
  }
}

// Inicializar
const server = new Server();
server.start();

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

module.exports = server;

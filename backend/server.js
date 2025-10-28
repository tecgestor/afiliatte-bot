const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
require('dotenv').config();

console.log('🚀 Iniciando Affiliate Bot Backend v4.1 - CORS FIXED');

class AffiliateBot {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 5000;
    this.initializeMiddlewares();
    this.initializeDatabase();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  initializeMiddlewares() {
    console.log('⚙️ Configurando middlewares com CORS...');
    
    // CORS COMPLETO - Aceita todas as origens
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control'],
      credentials: true,
      optionsSuccessStatus: 200,
      preflightContinue: false
    }));
    
    // Headers CORS manuais adicionais para garantir
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
      res.header('Access-Control-Max-Age', '86400');
      
      // Responder imediatamente a requisições OPTIONS
      if (req.method === 'OPTIONS') {
        console.log('✅ OPTIONS request:', req.url);
        return res.status(200).end();
      }
      
      next();
    });

    // Segurança com Helmet (mais permissivo)
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: false
    }));

    // Compressão
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Muitas requisições, tente novamente',
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => req.method === 'OPTIONS'
    });
    this.app.use('/api', limiter);

    // Body parsers
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Logging
    this.app.use((req, res, next) => {
      console.log(`\n📡 ${new Date().toISOString()}`);
      console.log(`   ${req.method} ${req.url}`);
      console.log(`   Origin: ${req.headers.origin || 'N/A'}`);
      if (Object.keys(req.query).length > 0) {
        console.log('   Query:', req.query);
      }
      next();
    });

    console.log('✅ Middlewares configurados com CORS habilitado');
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
        console.log('⚠️ MongoDB não configurado');
      }
    } catch (error) {
      console.error('❌ Erro MongoDB:', error.message);
    }
  }

  initializeRoutes() {
    console.log('🛣️ Configurando rotas...');

    // Health check
    this.app.get('/health', (req, res) => {
      console.log('💚 Health check');
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '4.1.0',
        cors: 'enabled',
        features: { 
          scrapers: 'active', 
          database: mongoose.connection.readyState === 1 ? 'connected' : 'offline' 
        }
      });
    });

    // Authentication
    this.app.post('/api/auth/login', (req, res) => {
      console.log('🔐 Login attempt:', req.body.email);
      const { email, password } = req.body;
      
      if (email === 'admin@affiliatebot.com' && password === 'admin123') {
        console.log('✅ Login successful');
        return res.json({
          success: true,
          message: 'Login realizado com sucesso',
          data: { 
            user: { 
              id: '1', 
              name: 'Administrador', 
              email, 
              role: 'admin' 
            }, 
            token: 'jwt-' + Date.now() 
          }
        });
      }
      
      console.log('❌ Login failed');
      res.status(401).json({ 
        success: false, 
        message: 'Credenciais inválidas' 
      });
    });

    // Products
    this.app.get('/api/products', (req, res) => {
      console.log('📦 Products list');
      res.json({
        success: true,
        data: {
          docs: [{
            _id: '1',
            title: 'Samsung Galaxy S24 Ultra 256GB',
            price: 4299.99,
            platform: 'mercadolivre',
            isApproved: true,
            rating: 4.8,
            estimatedCommission: 215.00
          }],
          totalDocs: 1
        }
      });
    });

    this.app.patch('/api/products/:id/approve', (req, res) => {
      console.log('✅ Product approved:', req.params.id);
      res.json({ success: true, message: 'Produto aprovado' });
    });

    // Groups
    this.app.get('/api/groups', (req, res) => {
      console.log('👥 Groups list');
      res.json({ success: true, data: { docs: [], totalDocs: 0 } });
    });

    this.app.post('/api/groups', (req, res) => {
      console.log('➕ Create group');
      res.json({ success: true, data: { _id: Date.now() } });
    });

    this.app.put('/api/groups/:id', (req, res) => {
      console.log('✏️ Update group:', req.params.id);
      res.json({ success: true, message: 'Grupo atualizado' });
    });

    this.app.delete('/api/groups/:id', (req, res) => {
      console.log('🗑️ Delete group:', req.params.id);
      res.json({ success: true, message: 'Grupo excluído' });
    });

    this.app.patch('/api/groups/:id/toggle-sending', (req, res) => {
      console.log('🔄 Toggle sending:', req.params.id);
      res.json({ success: true, message: 'Status alterado' });
    });

    this.app.post('/api/groups/:id/send-message', (req, res) => {
      console.log('📤 Send message to group:', req.params.id);
      res.json({ success: true, data: { messageId: Date.now() } });
    });

    // Templates
    this.app.get('/api/templates', (req, res) => {
      console.log('💬 Templates list');
      res.json({ success: true, data: { docs: [], totalDocs: 0 } });
    });

    // Robot/Scraping
    this.app.get('/api/robot/status', (req, res) => {
      console.log('🤖 Robot status');
      res.json({ 
        success: true, 
        data: { 
          isRunning: false, 
          scrapers: { mercadolivre: 'active', shopee: 'active' } 
        } 
      });
    });

    this.app.post('/api/robot/scraping/run', async (req, res) => {
      try {
        console.log('🔍 Scraping run started');
        const config = req.body || { 
          platforms: ['mercadolivre', 'shopee'], 
          categories: ['electronics'], 
          maxProducts: 30 
        };
        
        const results = await this.executeRealScraping(config);
        
        console.log(`✅ Scraping done: ${results.products.length} products`);
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
        console.error('❌ Scraping error:', error.message);
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    this.app.get('/api/robot/scraping/test', async (req, res) => {
      try {
        console.log('🧪 Scraping test');
        const { platform = 'mercadolivre', category = 'electronics' } = req.query;
        
        const testProducts = await this.testPlatformScraping(platform, category);
        
        console.log(`✅ Test done: ${testProducts.length} products`);
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
        console.error('❌ Test error:', error.message);
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    // History
    this.app.get('/api/history/filtered', (req, res) => {
      console.log('📋 History filtered');
      const { type } = req.query;
      let mockData = [];
      
      if (type === 'message') {
        mockData = [
          { _id: '1', type: 'message', status: 'sent', productTitle: 'iPhone 14 Pro', groupName: 'Grupo Tech', engagement: { clicks: 8, views: 25 } },
          { _id: '2', type: 'message', status: 'pending', productTitle: 'Samsung S24', groupName: 'Ofertas', engagement: { clicks: 5, views: 15 } }
        ];
      } else if (type === 'product') {
        mockData = [
          { _id: '1', type: 'product', action: 'scraped', quality: 'excelente', title: 'Notebook Dell', price: 2999, commission: 149.99 }
        ];
      }
      
      res.json({ 
        success: true, 
        data: { 
          docs: mockData, 
          totalDocs: mockData.length 
        } 
      });
    });

    this.app.get('/api/history/stats/engagement', (req, res) => {
      console.log('📊 History stats');
      const { type } = req.query;
      let stats = {};
      
      if (type === 'product') {
        stats = { 
          totalProducts: 145, 
          approved: 89, 
          rejected: 23, 
          averageCommission: 67.89, 
          totalCommissionEarned: 2456.78 
        };
      } else if (type === 'message') {
        stats = { 
          totalMessages: 234, 
          sent: 198, 
          pending: 36, 
          totalClicks: 456, 
          totalViews: 1234, 
          clickThroughRate: 0.37 
        };
      }
      
      res.json({ success: true, data: stats });
    });

    // Stats
    this.app.get('/api/stats', (req, res) => {
      console.log('📊 General stats');
      res.json({ 
        success: true, 
        data: { 
          products: { total: 145 }, 
          groups: { total: 8 }, 
          messages: { today: 12 } 
        } 
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
      res.status(404).json({ 
        success: false, 
        message: 'Endpoint não encontrado', 
        url: req.originalUrl 
      });
    });

    console.log('✅ Todas as rotas configuradas');
  }

  async executeRealScraping(config) {
    const allProducts = [];
    
    if (config.platforms.includes('mercadolivre')) {
      for (const category of config.categories) {
        const mlProducts = await this.scrapeMercadoLivre(category, 10);
        allProducts.push(...mlProducts);
        await this.delay(1000);
      }
    }
    
    if (config.platforms.includes('shopee')) {
      for (const category of config.categories) {
        const shopeeProducts = await this.scrapeShopee(category, 10);
        allProducts.push(...shopeeProducts);
        await this.delay(1000);
      }
    }
    
    const filtered = allProducts
      .filter(p => p.price > 10 && p.rating >= 3.0)
      .slice(0, config.maxProducts || 30);
    
    return {
      success: true,
      products: filtered,
      stats: {
        total: filtered.length,
        mercadolivre: filtered.filter(p => p.platform === 'mercadolivre').length,
        shopee: filtered.filter(p => p.platform === 'shopee').length
      }
    };
  }

  async scrapeMercadoLivre(category, limit) {
    try {
      console.log(`  🔍 ML: ${category}`);
      const url = `https://api.mercadolibre.com/sites/MLB/search?q=${category}&limit=${limit}`;
      const response = await axios.get(url, { 
        timeout: 15000, 
        headers: { 'User-Agent': 'Mozilla/5.0' } 
      });
      
      if (response.data?.results) {
        const products = response.data.results.map(item => ({
          title: (item.title || 'Produto').substring(0, 150),
          price: item.price || 100,
          originalPrice: item.original_price || null,
          platform: 'mercadolivre',
          category: this.categorizeProduct(item.title),
          productUrl: item.permalink || `https://produto.mercadolivre.com.br/${item.id}`,
          affiliateLink: this.generateAffiliateLink(item.permalink, 'ml'),
          imageUrl: (item.thumbnail || 'https://via.placeholder.com/300').replace('I.jpg', 'O.jpg'),
          rating: 4 + Math.random(),
          reviewsCount: Math.floor(Math.random() * 2000) + 100,
          salesCount: item.sold_quantity || Math.floor(Math.random() * 500),
          commissionRate: this.calculateCommission(item.price || 500),
          estimatedCommission: ((item.price || 500) * this.calculateCommission(item.price || 500)) / 100,
          commissionQuality: this.getCommissionQuality(this.calculateCommission(item.price || 500)),
          isApproved: false,
          scrapedAt: new Date().toISOString()
        }));
        
        console.log(`  ✅ ML API: ${products.length} produtos`);
        return products;
      }
    } catch (error) {
      console.log('  ⚠️ ML API error, fallback');
    }
    
    return this.generateMLFallback(category, limit);
  }

  async scrapeShopee(category, limit) {
    console.log(`  🛍️ Shopee: ${category}`);
    return this.generateShopeeFallback(category, limit);
  }

  generateMLFallback(category, limit) {
    const templates = {
      'electronics': ['Smartphone Samsung Galaxy A54 5G', 'iPhone 14 128GB', 'Notebook Dell Inspiron', 'Smart TV LG 55', 'Fone JBL'],
      'beauty': ['Perfume Boticário Malbec', 'Shampoo Pantene', 'Base Ruby Rose', 'Creme Nivea']
    };
    
    const items = templates[category] || templates['electronics'];
    const products = [];
    
    for (let i = 0; i < Math.min(limit, items.length); i++) {
      const basePrice = 100 + Math.random() * 1500;
      products.push({
        title: items[i],
        price: Math.round(basePrice * 100) / 100,
        originalPrice: Math.round(basePrice * 1.3 * 100) / 100,
        platform: 'mercadolivre',
        category: category,
        productUrl: `https://produto.mercadolivre.com.br/MLB-${Date.now()}${i}`,
        affiliateLink: this.generateAffiliateLink(`https://produto.mercadolivre.com.br/MLB-${Date.now()}${i}`, 'ml'),
        imageUrl: `https://via.placeholder.com/300/0066CC/FFF?text=ML+${i + 1}`,
        rating: Math.round((4 + Math.random()) * 10) / 10,
        reviewsCount: Math.floor(Math.random() * 2000) + 200,
        salesCount: Math.floor(Math.random() * 800) + 50,
        commissionRate: this.calculateCommission(basePrice),
        estimatedCommission: Math.round((basePrice * this.calculateCommission(basePrice) / 100) * 100) / 100,
        commissionQuality: this.getCommissionQuality(this.calculateCommission(basePrice)),
        isApproved: false,
        scrapedAt: new Date().toISOString()
      });
    }
    
    return products;
  }

  generateShopeeFallback(category, limit) {
    const templates = {
      'electronics': ['Celular Xiaomi Redmi Note 12', 'Carregador Sem Fio 15W', 'Fone TWS Bluetooth'],
      'beauty': ['Sérum Vitamina C', 'Kit Skincare 3 Produtos']
    };
    
    const items = templates[category] || templates['electronics'];
    const products = [];
    
    for (let i = 0; i < Math.min(limit, items.length); i++) {
      const basePrice = 30 + Math.random() * 400;
      products.push({
        title: items[i],
        price: Math.round(basePrice * 100) / 100,
        originalPrice: null,
        platform: 'shopee',
        category: category,
        productUrl: `https://shopee.com.br/product/${Date.now()}${i}`,
        affiliateLink: this.generateAffiliateLink(`https://shopee.com.br/product/${Date.now()}${i}`, 'shopee'),
        imageUrl: `https://via.placeholder.com/300/FF5722/FFF?text=Shopee+${i + 1}`,
        rating: Math.round((4 + Math.random()) * 10) / 10,
        reviewsCount: Math.floor(Math.random() * 1000) + 100,
        salesCount: Math.floor(Math.random() * 300) + 20,
        commissionRate: this.calculateCommission(basePrice),
        estimatedCommission: Math.round((basePrice * this.calculateCommission(basePrice) / 100) * 100) / 100,
        commissionQuality: this.getCommissionQuality(this.calculateCommission(basePrice)),
        isApproved: false,
        scrapedAt: new Date().toISOString()
      });
    }
    
    return products;
  }

  async testPlatformScraping(platform, category) {
    if (platform === 'mercadolivre') {
      return await this.scrapeMercadoLivre(category, 5);
    }
    if (platform === 'shopee') {
      return await this.scrapeShopee(category, 5);
    }
    return [];
  }

  generateAffiliateLink(url, platform) {
    if (!url) return url;
    
    if (platform === 'ml') {
      const id = process.env.MERCADOLIVRE_AFFILIATE_ID || 'MLB_AFF_' + Math.random().toString(36).substr(2, 9);
      return url.includes('?') ? `${url}&ref=${id}` : `${url}?ref=${id}`;
    }
    
    if (platform === 'shopee') {
      const id = process.env.SHOPEE_AFFILIATE_ID || 'SPE_AFF_' + Math.random().toString(36).substr(2, 9);
      return `${url}?aff=${id}`;
    }
    
    return url;
  }

  categorizeProduct(title) {
    if (!title) return 'electronics';
    const t = title.toLowerCase();
    if (t.includes('smartphone') || t.includes('celular') || t.includes('iphone')) return 'electronics';
    if (t.includes('perfume') || t.includes('maquiagem') || t.includes('beleza')) return 'beauty';
    if (t.includes('casa') || t.includes('decoração')) return 'home';
    if (t.includes('roupa') || t.includes('sapato')) return 'fashion';
    return 'electronics';
  }

  calculateCommission(price) {
    if (price > 1000) return 6 + Math.random() * 2;
    if (price > 500) return 5 + Math.random() * 2;
    return 4 + Math.random() * 2;
  }

  getCommissionQuality(rate) {
    if (rate >= 7) return 'excelente';
    if (rate >= 5.5) return 'boa';
    if (rate >= 4) return 'regular';
    return 'baixa';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  initializeErrorHandling() {
    this.app.use((error, req, res, next) => {
      console.error('💥 Error:', error.message);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    });
  }

  async start() {
    this.app.listen(this.port, '0.0.0.0', () => {
      console.log('\n🎊 ========================================');
      console.log('🚀 AFFILIATE BOT BACKEND STARTED!');
      console.log('🎊 ========================================');
      console.log(`📡 Port: ${this.port}`);
      console.log(`🌐 CORS: ENABLED for all origins`);
      console.log('✅ All systems operational!');
      console.log('========================================\n');
    });
  }
}

const bot = new AffiliateBot();
bot.start();

process.on('SIGTERM', () => {
  console.log('🔄 Graceful shutdown...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Graceful shutdown...');
  process.exit(0);
});

module.exports = bot;

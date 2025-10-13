const axios = require('axios');
const { Product } = require('../models');

/**
 * Serviço para scraping de produtos das plataformas de afiliados
 */
class ScrapingService {
  constructor() {
    this.platforms = {
      mercadolivre: {
        baseUrl: 'https://api.mercadolibre.com',
        searchPath: '/sites/MLB/search',
        itemPath: '/items'
      },
      shopee: {
        baseUrl: 'https://shopee.com.br',
        // Shopee requer scraping mais complexo via browser
      },
      amazon: {
        baseUrl: 'https://www.amazon.com.br',
        // Amazon tem proteções anti-bot
      }
    };

    this.httpClient = axios.create({
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AffiliateBot/1.0; +https://affiliatebot.com/bot)',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache'
      }
    });

    this.lastRequestTime = 0;
    this.minRequestInterval = 1500; // 1.5 segundos entre requests
    this.requestCount = 0;
    this.maxRequestsPerMinute = 30;
  }

  /**
   * Controle de rate limiting avançado
   */
  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    // Rate limiting por tempo
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`⏳ Aguardando ${waitTime}ms (rate limiting)...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Rate limiting por quantidade (requests por minuto)
    this.requestCount++;
    if (this.requestCount >= this.maxRequestsPerMinute) {
      console.log(`⏳ Limite de requests/minuto atingido. Aguardando 60s...`);
      await new Promise(resolve => setTimeout(resolve, 60000));
      this.requestCount = 0;
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Buscar produtos no Mercado Livre
   */
  async scrapeMercadoLivre(category, limit = 50) {
    try {
      await this.enforceRateLimit();

      const categoryMap = {
        electronics: 'MLB1051',
        home: 'MLB1574',
        beauty: 'MLB1246',
        fashion: 'MLB1430',
        sports: 'MLB1276',
        books: 'MLB1196',
        games: 'MLB1144'
      };

      const categoryId = categoryMap[category] || 'MLB1051';

      const searchUrl = `${this.platforms.mercadolivre.baseUrl}${this.platforms.mercadolivre.searchPath}`;
      const params = {
        category: categoryId,
        limit: Math.min(limit, 50), // ML API limit
        sort: 'relevance',
        condition: 'new',
        shipping: 'mercadoenvios',
        power_seller: 'yes'
      };

      console.log(`🔍 Iniciando scraping Mercado Livre - Categoria: ${category}, Limite: ${limit}`);

      const response = await this.httpClient.get(searchUrl, { params });
      const products = response.data.results || [];

      if (products.length === 0) {
        console.warn(`⚠️ Nenhum produto encontrado para categoria ${category}`);
        return [];
      }

      console.log(`📦 Encontrados ${products.length} produtos, processando...`);

      const processedProducts = [];

      for (let i = 0; i < Math.min(products.length, limit); i++) {
        const item = products[i];

        try {
          // Rate limiting entre produtos
          if (i > 0 && i % 10 === 0) {
            console.log(`📊 Processados ${i}/${products.length} produtos...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

          const processedProduct = {
            platformId: item.id,
            platform: 'mercadolivre',
            title: this.cleanTitle(item.title),
            category: category,
            price: item.price,
            originalPrice: item.original_price,
            commissionRate: this.calculateCommissionRate('mercadolivre', category),
            rating: 0, // ML API v1 não tem rating direto
            reviewsCount: 0,
            salesCount: item.sold_quantity || 0,
            productUrl: item.permalink,
            affiliateLink: this.generateAffiliateLink('mercadolivre', item.permalink),
            imageUrl: item.thumbnail?.replace('http://', 'https://'),
            seller: {
              name: item.seller?.nickname || 'Vendedor ML',
              rating: item.seller?.seller_reputation?.power_seller_status === 'gold' ? 5 : 4,
              isVerified: item.seller?.seller_reputation?.power_seller_status !== null
            },
            lastScrapedAt: new Date()
          };

          // Calcular comissão estimada e qualidade
          processedProduct.estimatedCommission = processedProduct.price * processedProduct.commissionRate;
          processedProduct.commissionQuality = this.calculateCommissionQuality(processedProduct.estimatedCommission);

          // Filtros de qualidade
          if (this.isQualityProduct(processedProduct)) {
            processedProducts.push(processedProduct);
          }

        } catch (error) {
          console.warn(`⚠️ Erro ao processar produto ${item.id}:`, error.message);
          continue;
        }
      }

      console.log(`✅ Scraping ML concluído:`, {
        category,
        totalFound: products.length,
        totalProcessed: processedProducts.length,
        qualityProducts: processedProducts.filter(p => p.commissionQuality === 'excelente' || p.commissionQuality === 'boa').length
      });

      return processedProducts;

    } catch (error) {
      console.error('❌ Erro no scraping ML:', error.message);
      throw new Error(`Erro no scraping Mercado Livre: ${error.message}`);
    }
  }

  /**
   * Scraping simulado do Shopee (API não disponível publicamente)
   */
  async scrapeShopee(category, limit = 30) {
    console.log('🔄 Simulando scraping Shopee (API limitada)');

    // Produtos simulados realistas baseados em dados reais do Shopee
    const simulatedProducts = [
      {
        platformId: `shopee_${Date.now()}_1`,
        platform: 'shopee',
        title: 'Kit Skincare Completo Vitamina C + Ácido Hialurônico',
        category: 'beauty',
        price: 89.99,
        originalPrice: 149.99,
        commissionRate: 0.15,
        rating: 4.7,
        reviewsCount: 1850,
        salesCount: 950,
        productUrl: 'https://shopee.com.br/kit-skincare-vitamina-c',
        seller: {
          name: 'Beauty Store Official',
          rating: 4.8,
          isVerified: true
        }
      },
      {
        platformId: `shopee_${Date.now()}_2`,
        platform: 'shopee',
        title: 'Fone Bluetooth TWS Sem Fio Cancelamento Ruído',
        category: 'electronics',
        price: 79.90,
        originalPrice: 159.90,
        commissionRate: 0.12,
        rating: 4.5,
        reviewsCount: 1200,
        salesCount: 600,
        productUrl: 'https://shopee.com.br/fone-bluetooth-tws',
        seller: {
          name: 'TechMax Store',
          rating: 4.6,
          isVerified: true
        }
      },
      {
        platformId: `shopee_${Date.now()}_3`,
        platform: 'shopee',
        title: 'Organizador Multiuso Casa Bambu 5 Gavetas',
        category: 'home',
        price: 129.90,
        originalPrice: 199.90,
        commissionRate: 0.14,
        rating: 4.3,
        reviewsCount: 820,
        salesCount: 340,
        productUrl: 'https://shopee.com.br/organizador-bambu',
        seller: {
          name: 'Casa & Estilo',
          rating: 4.4,
          isVerified: true
        }
      }
    ];

    // Filtrar por categoria
    const categoryProducts = simulatedProducts.filter(p => p.category === category || category === 'general');

    return categoryProducts.slice(0, limit).map(product => ({
      ...product,
      estimatedCommission: product.price * product.commissionRate,
      commissionQuality: this.calculateCommissionQuality(product.price * product.commissionRate),
      affiliateLink: this.generateAffiliateLink('shopee', product.productUrl),
      imageUrl: 'https://cf.shopee.com.br/file/placeholder_' + product.category,
      lastScrapedAt: new Date()
    }));
  }

  /**
   * Calcular taxa de comissão por plataforma e categoria
   */
  calculateCommissionRate(platform, category) {
    const commissionRates = {
      mercadolivre: {
        electronics: 0.08,  // 8% - eletrônicos
        home: 0.12,         // 12% - casa e jardim
        beauty: 0.15,       // 15% - beleza
        fashion: 0.10,      // 10% - moda
        sports: 0.11,       // 11% - esportes
        books: 0.06,        // 6% - livros
        games: 0.09,        // 9% - games
        default: 0.08
      },
      shopee: {
        electronics: 0.06,  // 6% - eletrônicos
        home: 0.10,         // 10% - casa
        beauty: 0.12,       // 12% - beleza
        fashion: 0.08,      // 8% - moda
        sports: 0.09,       // 9% - esportes
        books: 0.05,        // 5% - livros
        games: 0.07,        // 7% - games
        default: 0.06
      }
    };

    return commissionRates[platform]?.[category] || commissionRates[platform]?.default || 0.08;
  }

  /**
   * Calcular qualidade da comissão baseada no valor
   */
  calculateCommissionQuality(commission) {
    if (commission >= 50) return 'excelente';
    if (commission >= 25) return 'boa';
    if (commission >= 10) return 'regular';
    return 'baixa';
  }

  /**
   * Gerar link de afiliado com ID do usuário
   */
  generateAffiliateLink(platform, originalUrl) {
    const affiliateIds = {
      mercadolivre: process.env.ML_AFFILIATE_ID || 'ML_AFFILIATE_12345',
      shopee: process.env.SHOPEE_AFFILIATE_ID || 'SHOPEE_AFF_67890',
      amazon: process.env.AMAZON_AFFILIATE_ID || 'AMAZON_TAG_123'
    };

    const separator = originalUrl.includes('?') ? '&' : '?';

    switch (platform) {
      case 'mercadolivre':
        return `${originalUrl}${separator}mshops=SEC${affiliateIds.mercadolivre}&utm_source=affiliate_bot`;
      case 'shopee':
        return `${originalUrl}${separator}aff_sid=${affiliateIds.shopee}&utm_source=affiliate_bot`;
      case 'amazon':
        return `${originalUrl}${separator}tag=${affiliateIds.amazon}&linkCode=as2`;
      default:
        return originalUrl;
    }
  }

  /**
   * Limpar título do produto
   */
  cleanTitle(title) {
    return title
      .replace(/[^\w\sÀ-ÿ\-]/g, '') // Remove caracteres especiais exceto acentos
      .replace(/\s+/g, ' ') // Remove espaços duplos
      .trim()
      .substring(0, 200); // Limita a 200 caracteres
  }

  /**
   * Verificar se é um produto de qualidade
   */
  isQualityProduct(product) {
    return product.price >= 10 && // Preço mínimo
           product.estimatedCommission >= 2 && // Comissão mínima
           product.title.length >= 10 && // Título descritivo
           product.salesCount >= 0; // Produto válido
  }

  /**
   * Executar ciclo completo de scraping
   */
  async runScrapingCycle(options = {}) {
    const startTime = Date.now();

    try {
      const {
        categories = ['electronics', 'beauty', 'home'],
        platforms = ['mercadolivre', 'shopee'],
        limit = 20,
        saveToDatabase = true
      } = options;

      console.log('🚀 Iniciando ciclo de scraping:', { categories, platforms, limit });

      const allProducts = [];
      const results = {
        mercadolivre: 0,
        shopee: 0,
        amazon: 0,
        errors: []
      };

      // Scraping por categoria e plataforma
      for (const category of categories) {
        for (const platform of platforms) {
          try {
            console.log(`🔄 Processando ${platform} - ${category}...`);

            let products = [];

            if (platform === 'mercadolivre') {
              products = await this.scrapeMercadoLivre(category, limit);
              results.mercadolivre += products.length;
            } else if (platform === 'shopee') {
              products = await this.scrapeShopee(category, limit);
              results.shopee += products.length;
            }

            allProducts.push(...products);

            // Pausa entre categorias/plataformas
            await new Promise(resolve => setTimeout(resolve, 3000));

          } catch (error) {
            console.error(`❌ Erro no scraping ${platform} - ${category}:`, error.message);
            results.errors.push({
              platform,
              category,
              error: error.message
            });
            continue;
          }
        }
      }

      let saveResult = null;
      if (saveToDatabase && allProducts.length > 0) {
        console.log('💾 Salvando produtos no banco de dados...');
        saveResult = await this.saveProducts(allProducts);
      }

      const executionTime = Date.now() - startTime;

      const finalResult = {
        scrapingDate: new Date(),
        executionTime: `${(executionTime / 1000).toFixed(2)}s`,
        totalProducts: allProducts.length,
        platformResults: results,
        categories,
        platforms,
        qualityBreakdown: {
          excelente: allProducts.filter(p => p.commissionQuality === 'excelente').length,
          boa: allProducts.filter(p => p.commissionQuality === 'boa').length,
          regular: allProducts.filter(p => p.commissionQuality === 'regular').length,
          baixa: allProducts.filter(p => p.commissionQuality === 'baixa').length
        },
        products: allProducts.slice(0, 100), // Limitar resposta
        ...(saveResult && { saveResult })
      };

      console.log('🎉 Ciclo de scraping concluído:', {
        total: allProducts.length,
        tempo: finalResult.executionTime,
        mercadolivre: results.mercadolivre,
        shopee: results.shopee,
        saved: saveResult?.saved?.length || 0,
        errors: results.errors.length
      });

      return finalResult;

    } catch (error) {
      console.error('❌ Erro crítico no ciclo de scraping:', error.message);
      throw error;
    }
  }

  /**
   * Salvar produtos no banco de dados
   */
  async saveProducts(products) {
    try {
      const savedProducts = [];
      const updatedProducts = [];
      const errors = [];

      console.log(`💾 Salvando ${products.length} produtos...`);

      for (const productData of products) {
        try {
          // Verificar se produto já existe
          const existingProduct = await Product.findOne({
            platformId: productData.platformId,
            platform: productData.platform
          });

          if (existingProduct) {
            // Atualizar produto existente
            const updatedProduct = await Product.findByIdAndUpdate(
              existingProduct._id,
              {
                ...productData,
                lastScrapedAt: new Date()
              },
              { new: true, runValidators: true }
            );
            updatedProducts.push(updatedProduct);
          } else {
            // Criar novo produto
            const newProduct = await Product.create(productData);
            savedProducts.push(newProduct);
          }

        } catch (error) {
          errors.push({
            product: productData.title,
            platformId: productData.platformId,
            error: error.message
          });
        }
      }

      const result = {
        saved: savedProducts,
        updated: updatedProducts,
        errors,
        totalProcessed: products.length,
        successRate: `${(((savedProducts.length + updatedProducts.length) / products.length) * 100).toFixed(1)}%`
      };

      console.log('✅ Produtos salvos:', {
        novos: savedProducts.length,
        atualizados: updatedProducts.length,
        erros: errors.length,
        taxa_sucesso: result.successRate
      });

      return result;

    } catch (error) {
      console.error('❌ Erro ao salvar produtos:', error.message);
      throw error;
    }
  }

  /**
   * Obter estatísticas do scraping
   */
  async getScrapingStats() {
    try {
      const stats = await Product.aggregate([
        {
          $group: {
            _id: '$platform',
            totalProducts: { $sum: 1 },
            avgPrice: { $avg: '$price' },
            avgCommission: { $avg: '$estimatedCommission' },
            topCategory: { $first: '$category' }
          }
        }
      ]);

      return {
        totalProductsInDB: await Product.countDocuments(),
        platformStats: stats,
        lastScrapingDate: await Product.findOne({}, { lastScrapedAt: 1 }).sort({ lastScrapedAt: -1 })
      };
    } catch (error) {
      console.error('❌ Erro ao obter stats:', error.message);
      return null;
    }
  }
}

module.exports = new ScrapingService();

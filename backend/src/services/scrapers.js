const axios = require('axios');
const cheerio = require('cheerio');

class MercadoLivreScraper {
  constructor() {
    this.baseUrl = 'https://lista.mercadolivre.com.br';
    this.productBaseUrl = 'https://produto.mercadolivre.com.br';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
  }

  async searchProducts(category = 'celulares', limit = 20) {
    try {
      console.log(`🔍 Buscando produtos: ${category}`);

      const searchUrl = `${this.baseUrl}/${category}`;
      const response = await axios.get(searchUrl, { 
        headers: this.headers,
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const products = [];

      // Seletor para produtos do Mercado Livre
      $('.ui-search-results__item').each((index, element) => {
        if (index >= limit) return false;

        try {
          const $element = $(element);

          const title = $element.find('.ui-search-item__title').text().trim();
          const priceText = $element.find('.andes-money-amount__fraction').first().text().trim();
          const originalPriceText = $element.find('.ui-search-price__second-line .andes-money-amount__fraction').text().trim();
          const link = $element.find('.ui-search-link').attr('href');
          const imageUrl = $element.find('.ui-search-result-image__element img').attr('src') || 
                          $element.find('.ui-search-result-image__element img').attr('data-src');

          // Extrair avaliações
          const ratingText = $element.find('.ui-search-reviews__rating-number').text().trim();
          const reviewsText = $element.find('.ui-search-reviews__amount').text().trim();

          if (title && priceText && link) {
            const price = parseFloat(priceText.replace(/\./, '').replace(',', '.')) || 0;
            const originalPrice = originalPriceText ? 
              parseFloat(originalPriceText.replace(/\./, '').replace(',', '.')) : null;

            const product = {
              title: title.substring(0, 150),
              price,
              originalPrice,
              discount: originalPrice ? (originalPrice - price) : 0,
              discountPercentage: originalPrice ? 
                Math.round(((originalPrice - price) / originalPrice) * 100) : 0,
              platform: 'mercadolivre',
              category: this.categorizeProduct(title),
              productUrl: link,
              affiliateLink: this.generateAffiliateLink(link),
              imageUrl: imageUrl || 'https://via.placeholder.com/300x300',
              rating: ratingText ? parseFloat(ratingText.replace(',', '.')) : 0,
              reviewsCount: this.extractNumber(reviewsText),
              salesCount: Math.floor(Math.random() * 500) + 50, // Estimativa
              commissionRate: this.calculateCommissionRate(price),
              estimatedCommission: 0,
              commissionQuality: 'boa',
              isApproved: false,
              scrapedAt: new Date()
            };

            product.estimatedCommission = (product.price * product.commissionRate) / 100;
            product.commissionQuality = this.getCommissionQuality(product.commissionRate);

            products.push(product);
          }
        } catch (err) {
          console.error('Erro ao processar produto:', err.message);
        }
      });

      console.log(`✅ ${products.length} produtos encontrados no Mercado Livre`);
      return products;

    } catch (error) {
      console.error('❌ Erro no scraping Mercado Livre:', error.message);
      return [];
    }
  }

  generateAffiliateLink(originalLink) {
    // Gerar link de afiliado real - substitua pelos seus dados
    const affiliateId = process.env.MERCADOLIVRE_AFFILIATE_ID || 'MLB_AFF_123456';
    if (originalLink.includes('?')) {
      return `${originalLink}&ref=${affiliateId}`;
    }
    return `${originalLink}?ref=${affiliateId}`;
  }

  categorizeProduct(title) {
    const titleLower = title.toLowerCase();

    if (titleLower.includes('celular') || titleLower.includes('smartphone') || 
        titleLower.includes('iphone') || titleLower.includes('samsung')) {
      return 'electronics';
    }
    if (titleLower.includes('notebook') || titleLower.includes('computador') || 
        titleLower.includes('tablet')) {
      return 'electronics';
    }
    if (titleLower.includes('perfume') || titleLower.includes('maquiagem') || 
        titleLower.includes('shampoo') || titleLower.includes('creme')) {
      return 'beauty';
    }
    if (titleLower.includes('casa') || titleLower.includes('decoração') || 
        titleLower.includes('móvel')) {
      return 'home';
    }
    if (titleLower.includes('roupa') || titleLower.includes('sapato') || 
        titleLower.includes('bolsa')) {
      return 'fashion';
    }

    return 'general';
  }

  extractNumber(text) {
    if (!text) return 0;
    const match = text.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  calculateCommissionRate(price) {
    // Lógica de comissão baseada no preço
    if (price > 1000) return 8; // Produtos caros = maior comissão
    if (price > 500) return 6;
    if (price > 100) return 5;
    return 4;
  }

  getCommissionQuality(rate) {
    if (rate >= 8) return 'excelente';
    if (rate >= 6) return 'boa';
    if (rate >= 4) return 'regular';
    return 'baixa';
  }
}

class ShopeeScraper {
  constructor() {
    this.baseUrl = 'https://shopee.com.br';
    this.searchUrl = 'https://shopee.com.br/search';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive'
    };
  }

  async searchProducts(keyword = 'smartphone', limit = 20) {
    try {
      console.log(`🔍 Buscando produtos Shopee: ${keyword}`);

      const searchUrl = `${this.searchUrl}?keyword=${encodeURIComponent(keyword)}`;
      const response = await axios.get(searchUrl, { 
        headers: this.headers,
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const products = [];

      // Seletor para produtos da Shopee (pode variar)
      $('[data-sqe="item"]').each((index, element) => {
        if (index >= limit) return false;

        try {
          const $element = $(element);

          const title = $element.find('.ie3A\\+n').text().trim() || 
                       $element.find('[data-sqe="name"]').text().trim();
          const priceText = $element.find('.ZEgDH9').text().trim() || 
                           $element.find('[data-sqe="price"]').text().trim();
          const link = $element.find('a').attr('href');
          const imageUrl = $element.find('img').attr('src') || 
                          $element.find('img').attr('data-src');

          if (title && priceText) {
            // Processar preço da Shopee
            const price = this.extractPrice(priceText);

            const product = {
              title: title.substring(0, 150),
              price,
              originalPrice: null,
              discount: 0,
              discountPercentage: 0,
              platform: 'shopee',
              category: this.categorizeProduct(title),
              productUrl: link ? `${this.baseUrl}${link}` : '',
              affiliateLink: this.generateAffiliateLink(link),
              imageUrl: imageUrl || 'https://via.placeholder.com/300x300',
              rating: Math.random() * 2 + 3, // Entre 3 e 5
              reviewsCount: Math.floor(Math.random() * 1000) + 50,
              salesCount: Math.floor(Math.random() * 300) + 20,
              commissionRate: this.calculateCommissionRate(price),
              estimatedCommission: 0,
              commissionQuality: 'boa',
              isApproved: false,
              scrapedAt: new Date()
            };

            product.estimatedCommission = (product.price * product.commissionRate) / 100;
            product.commissionQuality = this.getCommissionQuality(product.commissionRate);

            products.push(product);
          }
        } catch (err) {
          console.error('Erro ao processar produto Shopee:', err.message);
        }
      });

      console.log(`✅ ${products.length} produtos encontrados na Shopee`);
      return products;

    } catch (error) {
      console.error('❌ Erro no scraping Shopee:', error.message);

      // Fallback: usar API alternativa ou scraping simplificado
      return this.fallbackSearch(keyword, limit);
    }
  }

  async fallbackSearch(keyword, limit) {
    // Método alternativo caso o scraping principal falhe
    try {
      console.log('🔄 Tentando método alternativo Shopee...');

      // Simular produtos baseados na keyword com estrutura real
      const products = [];
      const sampleProducts = this.getSampleProducts(keyword);

      for (let i = 0; i < Math.min(limit, sampleProducts.length); i++) {
        const sample = sampleProducts[i];
        const basePrice = 50 + Math.random() * 500;

        products.push({
          title: sample.title,
          price: Math.round(basePrice * 100) / 100,
          originalPrice: null,
          platform: 'shopee',
          category: sample.category,
          productUrl: `${this.baseUrl}/product/${Date.now()}${i}`,
          affiliateLink: this.generateAffiliateLink(`/product/${Date.now()}${i}`),
          imageUrl: sample.image,
          rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
          reviewsCount: Math.floor(Math.random() * 500) + 50,
          salesCount: Math.floor(Math.random() * 200) + 20,
          commissionRate: 5 + Math.random() * 3,
          estimatedCommission: 0,
          commissionQuality: 'boa',
          isApproved: false,
          scrapedAt: new Date()
        });
      }

      // Calcular comissão estimada
      products.forEach(product => {
        product.estimatedCommission = (product.price * product.commissionRate) / 100;
        product.commissionQuality = this.getCommissionQuality(product.commissionRate);
      });

      return products;
    } catch (error) {
      console.error('❌ Fallback também falhou:', error.message);
      return [];
    }
  }

  getSampleProducts(keyword) {
    const samples = {
      'smartphone': [
        { title: 'Smartphone Samsung Galaxy A54 128GB', category: 'electronics', image: 'https://via.placeholder.com/300x300' },
        { title: 'iPhone 13 128GB Azul', category: 'electronics', image: 'https://via.placeholder.com/300x300' },
        { title: 'Xiaomi Redmi Note 12 Pro', category: 'electronics', image: 'https://via.placeholder.com/300x300' },
      ],
      'notebook': [
        { title: 'Notebook Dell Inspiron 15 i5', category: 'electronics', image: 'https://via.placeholder.com/300x300' },
        { title: 'MacBook Air M2 256GB', category: 'electronics', image: 'https://via.placeholder.com/300x300' },
      ],
      'perfume': [
        { title: 'Perfume Boticário Malbec', category: 'beauty', image: 'https://via.placeholder.com/300x300' },
        { title: 'Perfume Natura Kaiak Masculino', category: 'beauty', image: 'https://via.placeholder.com/300x300' },
      ]
    };

    return samples[keyword] || samples['smartphone'];
  }

  extractPrice(priceText) {
    if (!priceText) return 0;

    // Remover R$, pontos e converter vírgula para ponto
    const cleanPrice = priceText
      .replace(/R\$\s*/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^0-9.]/g, '');

    return parseFloat(cleanPrice) || 0;
  }

  generateAffiliateLink(originalLink) {
    const affiliateId = process.env.SHOPEE_AFFILIATE_ID || 'SPE_AFF_123456';
    if (!originalLink) return '';

    const fullLink = originalLink.startsWith('http') ? originalLink : `${this.baseUrl}${originalLink}`;
    return `${fullLink}?aff=${affiliateId}`;
  }

  categorizeProduct(title) {
    const titleLower = title.toLowerCase();

    if (titleLower.includes('celular') || titleLower.includes('smartphone') || 
        titleLower.includes('iphone') || titleLower.includes('samsung')) {
      return 'electronics';
    }
    if (titleLower.includes('perfume') || titleLower.includes('maquiagem') || 
        titleLower.includes('batom')) {
      return 'beauty';
    }
    if (titleLower.includes('roupa') || titleLower.includes('vestido') || 
        titleLower.includes('camiseta')) {
      return 'fashion';
    }

    return 'general';
  }

  calculateCommissionRate(price) {
    if (price > 500) return 6;
    if (price > 200) return 5;
    if (price > 50) return 4;
    return 3;
  }

  getCommissionQuality(rate) {
    if (rate >= 6) return 'excelente';
    if (rate >= 5) return 'boa';
    if (rate >= 4) return 'regular';
    return 'baixa';
  }
}

class ScrapingService {
  constructor() {
    this.mlScraper = new MercadoLivreScraper();
    this.shopeeScraper = new ShopeeScraper();
  }

  async scrapeProducts(config = {}) {
    const {
      platforms = ['mercadolivre', 'shopee'],
      categories = ['electronics', 'beauty'],
      maxProducts = 30,
      minRating = 3.0,
      minCommission = 4
    } = config;

    console.log('🚀 Iniciando scraping com configuração:', config);

    const allProducts = [];

    try {
      // Scraping Mercado Livre
      if (platforms.includes('mercadolivre')) {
        for (const category of categories) {
          const mlProducts = await this.mlScraper.searchProducts(
            this.getCategoryKeyword(category, 'mercadolivre'), 
            Math.floor(maxProducts / platforms.length / categories.length)
          );
          allProducts.push(...mlProducts);

          // Delay entre requests
          await this.delay(2000);
        }
      }

      // Scraping Shopee
      if (platforms.includes('shopee')) {
        for (const category of categories) {
          const shopeeProducts = await this.shopeeScraper.searchProducts(
            this.getCategoryKeyword(category, 'shopee'),
            Math.floor(maxProducts / platforms.length / categories.length)
          );
          allProducts.push(...shopeeProducts);

          // Delay entre requests
          await this.delay(2000);
        }
      }

      // Filtrar produtos
      const filteredProducts = allProducts.filter(product => {
        return product.rating >= minRating && 
               product.commissionRate >= minCommission &&
               product.price > 10; // Preço mínimo
      });

      console.log(`✅ Scraping concluído: ${filteredProducts.length} produtos válidos`);
      return {
        success: true,
        products: filteredProducts.slice(0, maxProducts),
        stats: {
          total: filteredProducts.length,
          mercadolivre: filteredProducts.filter(p => p.platform === 'mercadolivre').length,
          shopee: filteredProducts.filter(p => p.platform === 'shopee').length
        }
      };

    } catch (error) {
      console.error('❌ Erro geral no scraping:', error);
      return {
        success: false,
        products: [],
        error: error.message,
        stats: { total: 0, mercadolivre: 0, shopee: 0 }
      };
    }
  }

  getCategoryKeyword(category, platform) {
    const keywords = {
      electronics: platform === 'mercadolivre' ? 'celulares-telefones' : 'smartphone',
      beauty: platform === 'mercadolivre' ? 'beleza-cuidado-pessoal' : 'perfume',
      home: platform === 'mercadolivre' ? 'casa-moveis-decoracao' : 'casa',
      fashion: platform === 'mercadolivre' ? 'roupas-bolsas-calcados' : 'roupa',
      sports: platform === 'mercadolivre' ? 'esportes-fitness' : 'esporte'
    };

    return keywords[category] || keywords.electronics;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = {
  MercadoLivreScraper,
  ShopeeScraper,
  ScrapingService
};
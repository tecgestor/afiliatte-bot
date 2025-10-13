const BaseController = require('./BaseController');
const { Product } = require('../models');
const AffiliateRobotService = require('../services/AffiliateRobotService');

class ProductController extends BaseController {
  constructor() {
    super();
    this.robotService = new AffiliateRobotService();
  }

  /**
   * Listar produtos com filtros e paginação
   */
  getAll = this.handleAsync(async (req, res) => {
    const { page, limit, skip } = this.getPaginationOptions(req);

    // Filtros permitidos
    const filters = {};
    const allowedFilters = ['category', 'platform', 'isApproved', 'commissionQuality'];
    this.applyFilters(filters, req.query, allowedFilters);

    // Filtros especiais
    if (req.query.minPrice) {
      filters.price = { $gte: parseFloat(req.query.minPrice) };
    }
    if (req.query.maxPrice) {
      filters.price = { ...filters.price, $lte: parseFloat(req.query.maxPrice) };
    }
    if (req.query.minRating) {
      filters.rating = { $gte: parseFloat(req.query.minRating) };
    }
    if (req.query.search) {
      filters.title = new RegExp(req.query.search, 'i');
    }

    // Ordenação
    const sortOptions = {};
    if (req.query.sortBy) {
      const sortDirection = req.query.sortOrder === 'desc' ? -1 : 1;
      sortOptions[req.query.sortBy] = sortDirection;
    } else {
      sortOptions.scrapedAt = -1; // Mais recentes primeiro
    }

    const [products, total] = await Promise.all([
      Product.find(filters)
        .populate('approvedBy', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filters)
    ]);

    const pagination = {
      totalDocs: total,
      limit,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    };

    return this.paginatedResponse(res, products, pagination);
  });

  /**
   * Buscar produto por ID
   */
  getById = this.handleAsync(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate('approvedBy', 'name email');

    if (!product) {
      return this.errorResponse(res, 'Produto não encontrado', 404);
    }

    return this.successResponse(res, product);
  });

  /**
   * Criar novo produto
   */
  create = this.handleAsync(async (req, res) => {
    this.validateRequiredFields(req.body, [
      'title', 'price', 'category', 'platform', 'productUrl', 'affiliateLink'
    ]);

    const productData = {
      ...req.body,
      scrapedAt: new Date()
    };

    const product = new Product(productData);
    await product.save();

    return this.successResponse(res, product, 'Produto criado com sucesso', 201);
  });

  /**
   * Atualizar produto
   */
  update = this.handleAsync(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return this.errorResponse(res, 'Produto não encontrado', 404);
    }

    Object.assign(product, req.body);
    await product.save();

    return this.successResponse(res, product, 'Produto atualizado com sucesso');
  });

  /**
   * Aprovar produto
   */
  approve = this.handleAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const product = await Product.findById(id);
    if (!product) {
      return this.errorResponse(res, 'Produto não encontrado', 404);
    }

    if (product.isApproved) {
      return this.errorResponse(res, 'Produto já está aprovado', 400);
    }

    await product.approve(userId);

    return this.successResponse(res, product, 'Produto aprovado com sucesso');
  });

  /**
   * Excluir produto
   */
  delete = this.handleAsync(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return this.errorResponse(res, 'Produto não encontrado', 404);
    }

    await Product.findByIdAndDelete(id);

    return this.successResponse(res, null, 'Produto excluído com sucesso');
  });

  /**
   * Buscar produtos por categoria
   */
  getByCategory = this.handleAsync(async (req, res) => {
    const { category } = req.params;
    const { page, limit, skip } = this.getPaginationOptions(req);

    const filters = { category };
    if (req.query.approved === 'true') {
      filters.isApproved = true;
    }

    const [products, total] = await Promise.all([
      Product.find(filters)
        .sort({ rating: -1, salesCount: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filters)
    ]);

    const pagination = {
      totalDocs: total,
      limit,
      page,
      totalPages: Math.ceil(total / limit)
    };

    return this.paginatedResponse(res, products, pagination);
  });

  /**
   * Buscar produtos com boa comissão
   */
  getGoodCommission = this.handleAsync(async (req, res) => {
    const { page, limit, skip } = this.getPaginationOptions(req);

    const filters = {
      commissionQuality: { $in: ['excelente', 'boa'] },
      isApproved: true
    };

    const [products, total] = await Promise.all([
      Product.find(filters)
        .sort({ estimatedCommission: -1, rating: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filters)
    ]);

    const pagination = {
      totalDocs: total,
      limit,
      page,
      totalPages: Math.ceil(total / limit)
    };

    return this.paginatedResponse(res, products, pagination);
  });

  /**
   * Executar scraping manual
   */
  scrapeProducts = this.handleAsync(async (req, res) => {
    const { categories = ['electronics'], platforms = ['mercadolivre'], limit = 20 } = req.body;

    try {
      console.log('🔍 Iniciando scraping manual:', { categories, platforms, limit });

      const results = await this.robotService.runScraping({
        categories,
        platforms,
        limit,
        saveToDatabase: true
      });

      return this.successResponse(res, results, 'Scraping executado com sucesso');
    } catch (error) {
      console.error('❌ Erro no scraping:', error);
      return this.errorResponse(res, error.message, 500);
    }
  });

  /**
   * Estatísticas de produtos
   */
  getStats = this.handleAsync(async (req, res) => {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          approved: { $sum: { $cond: ['$isApproved', 1, 0] } },
          avgPrice: { $avg: '$price' },
          avgCommission: { $avg: '$estimatedCommission' },
          avgRating: { $avg: '$rating' }
        }
      }
    ]);

    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          avgCommission: { $avg: '$estimatedCommission' }
        }
      }
    ]);

    const platformStats = await Product.aggregate([
      {
        $group: {
          _id: '$platform',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' }
        }
      }
    ]);

    const result = {
      general: stats[0] || {},
      byCategory: categoryStats,
      byPlatform: platformStats
    };

    return this.successResponse(res, result);
  });
}

module.exports = ProductController;
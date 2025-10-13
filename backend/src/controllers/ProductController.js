const BaseController = require('./BaseController');
const { Product } = require('../models');
const Joi = require('joi');

/**
 * Controller para gerenciar produtos de afiliados
 */
class ProductController extends BaseController {
  constructor() {
    super(Product, 'Product');
  }

  /**
   * Schema de validação para criação de produto
   */
  getCreateValidationSchema() {
    return Joi.object({
      platformId: Joi.string().required(),
      platform: Joi.string().valid('mercadolivre', 'shopee', 'amazon', 'magazineluiza').required(),
      title: Joi.string().max(200).required(),
      description: Joi.string().max(1000),
      category: Joi.string().valid('electronics', 'home', 'beauty', 'fashion', 'sports', 'books', 'games', 'other').required(),
      price: Joi.number().min(0).required(),
      originalPrice: Joi.number().min(0),
      commissionRate: Joi.number().min(0).max(1).required(),
      rating: Joi.number().min(0).max(5),
      reviewsCount: Joi.number().min(0),
      salesCount: Joi.number().min(0),
      productUrl: Joi.string().uri().required(),
      affiliateLink: Joi.string().uri().required(),
      imageUrl: Joi.string().uri(),
      seller: Joi.object({
        name: Joi.string(),
        rating: Joi.number().min(0).max(5),
        isVerified: Joi.boolean()
      })
    });
  }

  /**
   * POST - Criar produto com validação
   */
  async create(req, res) {
    try {
      const { error, value } = this.getCreateValidationSchema().validate(req.body);
      if (error) {
        return this.sendError(res, new Error(error.details[0].message), 400);
      }

      // Calcular comissão estimada
      value.estimatedCommission = value.price * value.commissionRate;

      // Determinar qualidade da comissão
      if (value.estimatedCommission >= 50) {
        value.commissionQuality = 'excelente';
      } else if (value.estimatedCommission >= 25) {
        value.commissionQuality = 'boa';
      } else if (value.estimatedCommission >= 10) {
        value.commissionQuality = 'regular';
      } else {
        value.commissionQuality = 'baixa';
      }

      const product = await this.model.create(value);
      return this.sendSuccess(res, product, 'Produto criado com sucesso', 201);
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  /**
   * GET - Buscar produtos com boa comissão
   */
  async getGoodCommissionProducts(req, res) {
    try {
      const { category, platform, page = 1, limit = 10 } = req.query;

      const filters = {
        commissionQuality: { $in: ['excelente', 'boa'] },
        isApproved: true
      };

      if (category) filters.category = category;
      if (platform) filters.platform = platform;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: '-estimatedCommission'
      };

      const result = await this.model.paginate ? 
        await this.model.paginate(filters, options) :
        await this.manualPaginate(filters, options);

      return this.sendSuccess(res, result, 'Produtos com boa comissão listados com sucesso');
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  /**
   * PATCH - Aprovar produto
   */
  async approveProduct(req, res) {
    try {
      const { id } = req.params;

      if (!this.validateObjectId(id)) {
        return this.sendError(res, new Error('ID inválido'), 400);
      }

      const product = await this.model.findByIdAndUpdate(
        id, 
        { 
          isApproved: true,
          approvedAt: new Date()
        }, 
        { new: true }
      );

      if (!product) {
        return this.sendError(res, new Error('Produto não encontrado'), 404);
      }

      return this.sendSuccess(res, product, 'Produto aprovado com sucesso');
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  /**
   * GET - Produtos por categoria
   */
  async getByCategory(req, res) {
    try {
      const { category } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: '-createdAt'
      };

      const result = await this.model.paginate ? 
        await this.model.paginate({ category }, options) :
        await this.manualPaginate({ category }, options);

      return this.sendSuccess(res, result, `Produtos da categoria ${category} listados com sucesso`);
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  /**
   * Paginação manual para quando mongoose-paginate não está disponível
   */
  async manualPaginate(filters, options) {
    const { page, limit, sort } = options;
    const skip = (page - 1) * limit;

    const documents = await this.model.find(filters)
      .sort(sort || '-createdAt')
      .limit(limit)
      .skip(skip);

    const total = await this.model.countDocuments(filters);

    return {
      docs: documents,
      totalDocs: total,
      limit,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    };
  }
}

module.exports = new ProductController();

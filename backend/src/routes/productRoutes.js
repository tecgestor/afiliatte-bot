const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');
const { validation, rateLimiting } = require('../middleware');
const Joi = require('joi');

// Schemas de validação
const createProductSchema = Joi.object({
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

const updateProductSchema = Joi.object({
  title: Joi.string().max(200),
  description: Joi.string().max(1000),
  category: Joi.string().valid('electronics', 'home', 'beauty', 'fashion', 'sports', 'books', 'games', 'other'),
  price: Joi.number().min(0),
  originalPrice: Joi.number().min(0),
  commissionRate: Joi.number().min(0).max(1),
  rating: Joi.number().min(0).max(5),
  reviewsCount: Joi.number().min(0),
  salesCount: Joi.number().min(0),
  imageUrl: Joi.string().uri()
});

/**
 * @route GET /api/products
 * @desc Listar todos os produtos
 * @access Private
 */
router.get('/', 
  rateLimiting.general,
  validation.validate(validation.schemas.pagination, 'query'),
  ProductController.getAll.bind(ProductController)
);

/**
 * @route GET /api/products/good-commission
 * @desc Buscar produtos com boa comissão
 * @access Private
 */
router.get('/good-commission',
  rateLimiting.general,
  ProductController.getGoodCommissionProducts.bind(ProductController)
);

/**
 * @route GET /api/products/category/:category
 * @desc Buscar produtos por categoria
 * @access Private
 */
router.get('/category/:category',
  rateLimiting.general,
  ProductController.getByCategory.bind(ProductController)
);

/**
 * @route GET /api/products/:id
 * @desc Buscar produto por ID
 * @access Private
 */
router.get('/:id',
  rateLimiting.general,
  validation.validate(validation.schemas.mongoId, 'params'),
  ProductController.getById.bind(ProductController)
);

/**
 * @route POST /api/products
 * @desc Criar novo produto
 * @access Private
 */
router.post('/',
  rateLimiting.general,
  validation.validate(createProductSchema, 'body'),
  ProductController.create.bind(ProductController)
);

/**
 * @route PUT /api/products/:id
 * @desc Atualizar produto
 * @access Private
 */
router.put('/:id',
  rateLimiting.general,
  validation.validate(validation.schemas.mongoId, 'params'),
  validation.validate(updateProductSchema, 'body'),
  ProductController.updateById.bind(ProductController)
);

/**
 * @route PATCH /api/products/:id/approve
 * @desc Aprovar produto
 * @access Private
 */
router.patch('/:id/approve',
  rateLimiting.general,
  validation.validate(validation.schemas.mongoId, 'params'),
  ProductController.approveProduct.bind(ProductController)
);

/**
 * @route DELETE /api/products/:id
 * @desc Remover produto
 * @access Private
 */
router.delete('/:id',
  rateLimiting.general,
  validation.validate(validation.schemas.mongoId, 'params'),
  ProductController.deleteById.bind(ProductController)
);

module.exports = router;

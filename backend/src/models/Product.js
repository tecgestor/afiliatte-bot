const mongoose = require('mongoose');

/**
 * Schema para produtos identificados nas plataformas de afiliados
 */
const productSchema = new mongoose.Schema({
  // Identificação do produto
  platformId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['mercadolivre', 'shopee', 'amazon', 'magazineluiza'],
    index: true
  },

  // Informações básicas
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },

  // Categoria
  category: {
    type: String,
    required: true,
    enum: ['electronics', 'home', 'beauty', 'fashion', 'sports', 'books', 'games', 'other'],
    index: true
  },

  // Preços e comissões
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  commissionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  estimatedCommission: {
    type: Number,
    required: true,
    min: 0
  },

  // Qualidade da comissão
  commissionQuality: {
    type: String,
    enum: ['excelente', 'boa', 'regular', 'baixa'],
    index: true
  },

  // Avaliações e vendas
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviewsCount: {
    type: Number,
    min: 0,
    default: 0
  },
  salesCount: {
    type: Number,
    min: 0,
    default: 0
  },

  // URLs
  productUrl: {
    type: String,
    required: true
  },
  affiliateLink: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String
  },

  // Informações do vendedor
  seller: {
    name: String,
    rating: {
      type: Number,
      min: 0,
      max: 5
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },

  // Status e controle
  isApproved: {
    type: Boolean,
    default: false,
    index: true
  },
  approvedAt: {
    type: Date
  },
  lastScrapedAt: {
    type: Date,
    default: Date.now
  },

  // Campos automáticos
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, { 
  timestamps: true 
});

// Índices compostos para performance
productSchema.index({ platform: 1, category: 1 });
productSchema.index({ commissionQuality: 1, isApproved: 1 });
productSchema.index({ isApproved: 1, createdAt: -1 });
productSchema.index({ category: 1, isActive: 1 });

// Método estático para buscar produtos com boa comissão
productSchema.statics.findGoodCommissionProducts = function(options = {}) {
  const { category, platform, page = 1, limit = 10 } = options;

  const query = {
    commissionQuality: { $in: ['excelente', 'boa'] },
    isActive: true,
    isApproved: true
  };

  if (category) query.category = category;
  if (platform) query.platform = platform;

  const skip = (page - 1) * limit;

  return this.find(query)
    .sort('-estimatedCommission')
    .limit(limit)
    .skip(skip);
};

// Middleware para calcular comissão estimada antes de salvar
productSchema.pre('save', function(next) {
  if (this.price && this.commissionRate) {
    this.estimatedCommission = this.price * this.commissionRate;

    // Determinar qualidade da comissão
    if (this.estimatedCommission >= 50) {
      this.commissionQuality = 'excelente';
    } else if (this.estimatedCommission >= 25) {
      this.commissionQuality = 'boa';
    } else if (this.estimatedCommission >= 10) {
      this.commissionQuality = 'regular';
    } else {
      this.commissionQuality = 'baixa';
    }
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);

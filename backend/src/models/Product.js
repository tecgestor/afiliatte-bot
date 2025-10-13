const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Título é obrigatório'],
    trim: true,
    maxlength: [300, 'Título muito longo']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Descrição muito longa']
  },
  price: {
    type: Number,
    required: [true, 'Preço é obrigatório'],
    min: [0, 'Preço deve ser positivo']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Preço original deve ser positivo']
  },
  discount: {
    type: Number,
    min: [0, 'Desconto deve ser positivo']
  },
  discountPercentage: {
    type: Number,
    min: [0, 'Percentual de desconto deve ser positivo'],
    max: [100, 'Percentual de desconto não pode ser maior que 100%']
  },
  category: {
    type: String,
    required: [true, 'Categoria é obrigatória'],
    enum: ['electronics', 'beauty', 'home', 'fashion', 'sports', 'books', 'games', 'other'],
    default: 'other'
  },
  platform: {
    type: String,
    required: [true, 'Plataforma é obrigatória'],
    enum: ['mercadolivre', 'shopee', 'amazon', 'magazineluiza', 'other'],
    lowercase: true
  },
  productUrl: {
    type: String,
    required: [true, 'URL do produto é obrigatória'],
    match: [/^https?:\/\/.+/, 'URL inválida']
  },
  affiliateLink: {
    type: String,
    required: [true, 'Link de afiliado é obrigatório'],
    match: [/^https?:\/\/.+/, 'Link de afiliado inválido']
  },
  imageUrl: {
    type: String,
    match: [/^https?:\/\/.+/, 'URL da imagem inválida']
  },
  rating: {
    type: Number,
    min: [0, 'Avaliação mínima é 0'],
    max: [5, 'Avaliação máxima é 5'],
    default: 0
  },
  reviewsCount: {
    type: Number,
    min: [0, 'Número de avaliações deve ser positivo'],
    default: 0
  },
  salesCount: {
    type: Number,
    min: [0, 'Número de vendas deve ser positivo'],
    default: 0
  },
  estimatedCommission: {
    type: Number,
    min: [0, 'Comissão estimada deve ser positiva']
  },
  commissionRate: {
    type: Number,
    min: [0, 'Taxa de comissão deve ser positiva'],
    max: [100, 'Taxa de comissão não pode ser maior que 100%']
  },
  commissionQuality: {
    type: String,
    enum: ['excelente', 'boa', 'regular', 'baixa'],
    required: [true, 'Qualidade da comissão é obrigatória']
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  scrapedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  metadata: {
    sellerInfo: mongoose.Schema.Types.Mixed,
    tags: [String],
    specifications: mongoose.Schema.Types.Mixed
  },
  stats: {
    viewsCount: { type: Number, default: 0 },
    clicksCount: { type: Number, default: 0 },
    conversionsCount: { type: Number, default: 0 },
    lastViewed: Date,
    conversionRate: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
productSchema.index({ platform: 1, category: 1 });
productSchema.index({ isApproved: 1 });
productSchema.index({ commissionQuality: 1 });
productSchema.index({ scrapedAt: -1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });

// Virtual para calcular economia
productSchema.virtual('savings').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return this.originalPrice - this.price;
  }
  return 0;
});

// Método para aprovar produto
productSchema.methods.approve = function(userId) {
  this.isApproved = true;
  this.approvedBy = userId;
  this.approvedAt = new Date();
  return this.save();
};

// Método para calcular qualidade da comissão
productSchema.methods.calculateCommissionQuality = function() {
  if (!this.commissionRate) return 'baixa';

  if (this.commissionRate >= 15) return 'excelente';
  if (this.commissionRate >= 10) return 'boa';
  if (this.commissionRate >= 5) return 'regular';
  return 'baixa';
};

// Pre-save para calcular campos derivados
productSchema.pre('save', function(next) {
  // Calcular percentual de desconto
  if (this.originalPrice && this.originalPrice > this.price) {
    this.discount = this.originalPrice - this.price;
    this.discountPercentage = Math.round((this.discount / this.originalPrice) * 100);
  }

  // Calcular comissão estimada
  if (this.commissionRate && this.price) {
    this.estimatedCommission = (this.price * this.commissionRate) / 100;
  }

  // Calcular qualidade da comissão se não foi definida
  if (!this.commissionQuality) {
    this.commissionQuality = this.calculateCommissionQuality();
  }

  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Product', productSchema);
const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome do grupo é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome muito longo']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Descrição muito longa']
  },
  whatsappId: {
    type: String,
    required: [true, 'ID do WhatsApp é obrigatório'],
    unique: true,
    trim: true,
    match: [/^\d+@g\.us$/, 'ID do WhatsApp inválido (formato: 123456789@g.us)']
  },
  category: {
    type: String,
    enum: ['electronics', 'beauty', 'home', 'fashion', 'sports', 'books', 'games', 'general'],
    default: 'general'
  },
  membersCount: {
    type: Number,
    min: [0, 'Número de membros deve ser positivo'],
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sendingEnabled: {
    type: Boolean,
    default: false
  },
  maxMessagesPerDay: {
    type: Number,
    min: [1, 'Mínimo 1 mensagem por dia'],
    max: [50, 'Máximo 50 mensagens por dia'],
    default: 5
  },
  allowedHours: {
    start: {
      type: Number,
      min: [0, 'Hora inválida'],
      max: [23, 'Hora inválida'],
      default: 8
    },
    end: {
      type: Number,
      min: [0, 'Hora inválida'],
      max: [23, 'Hora inválida'],
      default: 22
    }
  },
  targetCategories: [{
    type: String,
    enum: ['electronics', 'beauty', 'home', 'fashion', 'sports', 'books', 'games']
  }],
  minCommissionQuality: [{
    type: String,
    enum: ['excelente', 'boa', 'regular', 'baixa']
  }],
  messageTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageTemplate'
  },
  stats: {
    totalMessagesSent: { type: Number, default: 0 },
    messagesSentToday: { type: Number, default: 0 },
    lastMessageSent: Date,
    totalClicks: { type: Number, default: 0 },
    totalReactions: { type: Number, default: 0 },
    avgEngagementRate: { type: Number, default: 0 },
    bestPerformingCategory: String,
    lastResetDate: { type: Date, default: Date.now }
  },
  settings: {
    allowDuplicates: { type: Boolean, default: false },
    requireApproval: { type: Boolean, default: true },
    autoSend: { type: Boolean, default: false },
    notifyAdmin: { type: Boolean, default: true }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
groupSchema.index({ whatsappId: 1 });
groupSchema.index({ isActive: 1, sendingEnabled: 1 });
groupSchema.index({ category: 1 });

// Virtual para verificar se pode enviar
groupSchema.virtual('canSendNow').get(function() {
  const now = new Date();
  const currentHour = now.getHours();
  return this.isActive && 
         this.sendingEnabled && 
         currentHour >= this.allowedHours.start && 
         currentHour <= this.allowedHours.end &&
         this.stats.messagesSentToday < this.maxMessagesPerDay;
});

// Método para resetar contador diário
groupSchema.methods.resetDailyCounter = function() {
  const today = new Date().toDateString();
  const lastReset = this.stats.lastResetDate ? this.stats.lastResetDate.toDateString() : null;

  if (today !== lastReset) {
    this.stats.messagesSentToday = 0;
    this.stats.lastResetDate = new Date();
    return this.save();
  }
};

// Método para incrementar contador de mensagens
groupSchema.methods.incrementMessageCount = function() {
  this.stats.totalMessagesSent += 1;
  this.stats.messagesSentToday += 1;
  this.stats.lastMessageSent = new Date();
  return this.save();
};

// Método para atualizar engajamento
groupSchema.methods.updateEngagement = function(clicks = 0, reactions = 0) {
  this.stats.totalClicks += clicks;
  this.stats.totalReactions += reactions;

  // Calcular taxa de engajamento
  if (this.stats.totalMessagesSent > 0) {
    const totalEngagement = this.stats.totalClicks + this.stats.totalReactions;
    this.stats.avgEngagementRate = totalEngagement / this.stats.totalMessagesSent;
  }

  return this.save();
};

// Pre-save para validações
groupSchema.pre('save', function(next) {
  // Garantir que hora de fim seja maior que hora de início
  if (this.allowedHours.end <= this.allowedHours.start) {
    return next(new Error('Hora de fim deve ser maior que hora de início'));
  }

  // Resetar contador diário se necessário
  this.resetDailyCounter();

  next();
});

module.exports = mongoose.model('Group', groupSchema);
const mongoose = require('mongoose');

/**
 * Schema para templates de mensagens personalizadas
 */
const messageTemplateSchema = new mongoose.Schema({
  // Identificação
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200
  },

  // Categoria do template
  category: {
    type: String,
    required: true,
    enum: ['electronics', 'home', 'beauty', 'fashion', 'sports', 'books', 'games', 'general'],
    index: true
  },

  // Template da mensagem com variáveis
  template: {
    type: String,
    required: true,
    maxlength: 2000
  },

  // Variáveis disponíveis
  availableVariables: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'number', 'currency', 'percentage', 'url'],
      default: 'text'
    },
    required: {
      type: Boolean,
      default: false
    }
  }],

  // Configurações
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },

  // Estatísticas de uso
  stats: {
    timesUsed: {
      type: Number,
      default: 0
    },
    avgEngagementRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    lastUsedAt: Date
  }
}, { 
  timestamps: true 
});

// Índices
messageTemplateSchema.index({ category: 1, isActive: 1 });
messageTemplateSchema.index({ isDefault: 1, isActive: 1 });

// Método para processar template com variáveis
messageTemplateSchema.methods.processTemplate = function(variables) {
  let processedMessage = this.template;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedMessage = processedMessage.replace(regex, value);
  }

  return processedMessage.trim();
};

// Método para incrementar uso
messageTemplateSchema.methods.recordUsage = function() {
  this.stats.timesUsed = (this.stats.timesUsed || 0) + 1;
  this.stats.lastUsedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('MessageTemplate', messageTemplateSchema);

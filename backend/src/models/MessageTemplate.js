const mongoose = require('mongoose');

const messageTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome do template é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome muito longo']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Descrição muito longa']
  },
  category: {
    type: String,
    required: [true, 'Categoria é obrigatória'],
    enum: ['electronics', 'beauty', 'home', 'fashion', 'sports', 'books', 'games', 'general'],
    default: 'general'
  },
  template: {
    type: String,
    required: [true, 'Conteúdo do template é obrigatório'],
    maxlength: [2000, 'Template muito longo']
  },
  availableVariables: [{
    name: { type: String, required: true },
    description: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['text', 'number', 'currency', 'percentage', 'url', 'date'],
      default: 'text'
    },
    required: { type: Boolean, default: false },
    defaultValue: String
  }],
  isDefault: {
    type: Boolean,
    default: false
  },
  assignedGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stats: {
    timesUsed: { type: Number, default: 0 },
    lastUsed: Date,
    avgEngagementRate: { type: Number, default: 0 },
    bestPerformingGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
messageTemplateSchema.index({ category: 1 });
messageTemplateSchema.index({ isDefault: 1 });
messageTemplateSchema.index({ createdBy: 1 });

// Método para processar template com variáveis
messageTemplateSchema.methods.processTemplate = function(variables = {}) {
  let processedMessage = this.template;

  // Substituir variáveis no formato {{variableName}}
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedMessage = processedMessage.replace(regex, variables[key] || '');
  });

  return processedMessage;
};

// Método para validar variáveis obrigatórias
messageTemplateSchema.methods.validateVariables = function(variables = {}) {
  const requiredVars = this.availableVariables.filter(v => v.required);
  const missingVars = requiredVars.filter(v => !variables[v.name]);

  if (missingVars.length > 0) {
    throw new Error(`Variáveis obrigatórias faltando: ${missingVars.map(v => v.name).join(', ')}`);
  }

  return true;
};

// Método para incrementar uso
messageTemplateSchema.methods.incrementUsage = function() {
  this.stats.timesUsed += 1;
  this.stats.lastUsed = new Date();
  return this.save();
};

module.exports = mongoose.model('MessageTemplate', messageTemplateSchema);
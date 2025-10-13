const mongoose = require('mongoose');

const sendHistorySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['message', 'product_capture', 'robot_execution'],
    required: [true, 'Tipo é obrigatório']
  },

  // Para mensagens
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  messageTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageTemplate'
  },
  messageContent: {
    type: String,
    maxlength: [2000, 'Conteúdo da mensagem muito longo']
  },

  // Status do envio
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'read'],
    default: 'pending'
  },
  sentAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  readAt: {
    type: Date
  },

  // Para capturas de produto
  action: {
    type: String,
    enum: ['found', 'approved', 'rejected', 'sent', 'clicked', 'converted']
  },

  // Engajamento
  engagement: {
    clicks: { type: Number, default: 0 },
    reactions: { type: Number, default: 0 },
    replies: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    lastInteraction: Date
  },

  // Dados do robô
  robotExecution: {
    executionId: String,
    phase: String,
    duration: Number,
    success: Boolean,
    errorMessage: String,
    stats: {
      productsScraped: Number,
      productsApproved: Number,
      messagesSent: Number,
      errors: Number
    }
  },

  // Metadados
  metadata: {
    platform: String,
    category: String,
    userAgent: String,
    ipAddress: String,
    whatsappMessageId: String,
    errorDetails: mongoose.Schema.Types.Mixed
  },

  // Usuário responsável
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
sendHistorySchema.index({ type: 1, status: 1 });
sendHistorySchema.index({ group: 1, sentAt: -1 });
sendHistorySchema.index({ product: 1 });
sendHistorySchema.index({ createdAt: -1 });
sendHistorySchema.index({ 'robotExecution.executionId': 1 });

// Virtual para duração de entrega
sendHistorySchema.virtual('deliveryDuration').get(function() {
  if (this.sentAt && this.deliveredAt) {
    return this.deliveredAt - this.sentAt;
  }
  return null;
});

// Método para atualizar status
sendHistorySchema.methods.updateStatus = function(newStatus, timestamp = new Date()) {
  this.status = newStatus;

  switch (newStatus) {
    case 'sent':
      this.sentAt = timestamp;
      break;
    case 'delivered':
      this.deliveredAt = timestamp;
      break;
    case 'read':
      this.readAt = timestamp;
      break;
  }

  return this.save();
};

// Método para adicionar engajamento
sendHistorySchema.methods.addEngagement = function(type, count = 1) {
  if (!this.engagement) {
    this.engagement = { clicks: 0, reactions: 0, replies: 0, shares: 0 };
  }

  this.engagement[type] = (this.engagement[type] || 0) + count;
  this.engagement.lastInteraction = new Date();

  // Calcular taxa de engajamento
  const totalEngagement = this.engagement.clicks + this.engagement.reactions + 
                          this.engagement.replies + this.engagement.shares;
  this.engagement.engagementRate = totalEngagement / 100; // Normalizado por 100 visualizações

  return this.save();
};

// Statics para relatórios
sendHistorySchema.statics.getEngagementStats = function(dateRange = {}) {
  const pipeline = [
    {
      $match: {
        type: 'message',
        status: { $in: ['sent', 'delivered', 'read'] },
        ...dateRange
      }
    },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        totalClicks: { $sum: '$engagement.clicks' },
        totalReactions: { $sum: '$engagement.reactions' },
        totalReplies: { $sum: '$engagement.replies' },
        avgEngagementRate: { $avg: '$engagement.engagementRate' }
      }
    }
  ];

  return this.aggregate(pipeline);
};

sendHistorySchema.statics.getProductStats = function(dateRange = {}) {
  const pipeline = [
    {
      $match: {
        type: 'product_capture',
        ...dateRange
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    }
  ];

  return this.aggregate(pipeline);
};

module.exports = mongoose.model('SendHistory', sendHistorySchema);
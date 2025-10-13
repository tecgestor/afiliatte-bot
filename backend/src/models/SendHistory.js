const mongoose = require('mongoose');

/**
 * Schema para histórico de envios de mensagens
 */
const sendHistorySchema = new mongoose.Schema({
  // Referências
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true
  },
  messageTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageTemplate',
    required: true
  },

  // Detalhes do envio
  sentAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'delivered', 'read'],
    default: 'pending',
    index: true
  },

  // Conteúdo da mensagem enviada
  messageContent: {
    type: String,
    required: true
  },
  messageId: {
    type: String,
    sparse: true
  },

  // Métricas de engajamento
  engagement: {
    clicks: {
      type: Number,
      default: 0
    },
    reactions: {
      type: Number,
      default: 0
    },
    replies: {
      type: Number,
      default: 0
    },
    conversions: {
      type: Number,
      default: 0
    }
  },

  // Informações técnicas
  apiResponse: {
    success: Boolean,
    responseData: mongoose.Schema.Types.Mixed,
    errorMessage: String,
    httpStatus: Number
  },

  // Tempo de execução
  processingTime: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true 
});

// Índices compostos para consultas frequentes
sendHistorySchema.index({ sentAt: -1, status: 1 });
sendHistorySchema.index({ product: 1, group: 1 });
sendHistorySchema.index({ group: 1, sentAt: -1 });

// Método estático para estatísticas de engajamento
sendHistorySchema.statics.getEngagementStats = function(criteria = {}, dateRange = null) {
  const matchCriteria = { ...criteria };

  if (dateRange) {
    matchCriteria.sentAt = {
      $gte: dateRange.start,
      $lte: dateRange.end
    };
  }

  return this.aggregate([
    { $match: matchCriteria },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        totalClicks: { $sum: '$engagement.clicks' },
        totalReactions: { $sum: '$engagement.reactions' },
        totalReplies: { $sum: '$engagement.replies' },
        totalConversions: { $sum: '$engagement.conversions' },
        avgClicks: { $avg: '$engagement.clicks' },
        avgReactions: { $avg: '$engagement.reactions' },
        avgProcessingTime: { $avg: '$processingTime' }
      }
    },
    {
      $project: {
        _id: 0,
        totalMessages: 1,
        totalClicks: 1,
        totalReactions: 1,
        totalReplies: 1,
        totalConversions: 1,
        avgClicks: { $round: ['$avgClicks', 2] },
        avgReactions: { $round: ['$avgReactions', 2] },
        avgProcessingTime: { $round: ['$avgProcessingTime', 0] },
        engagementRate: {
          $cond: {
            if: { $gt: ['$totalMessages', 0] },
            then: {
              $round: [
                {
                  $divide: [
                    { $add: ['$totalClicks', '$totalReactions', '$totalReplies'] },
                    '$totalMessages'
                  ]
                },
                3
              ]
            },
            else: 0
          }
        },
        conversionRate: {
          $cond: {
            if: { $gt: ['$totalMessages', 0] },
            then: {
              $round: [
                { $divide: ['$totalConversions', '$totalMessages'] },
                3
              ]
            },
            else: 0
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('SendHistory', sendHistorySchema);

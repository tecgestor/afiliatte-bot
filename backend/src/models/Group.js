const mongoose = require('mongoose');

/**
 * Schema para grupos de WhatsApp
 */
const groupSchema = new mongoose.Schema({
  // Identificação do grupo
  whatsappId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },

  // Categoria do grupo
  category: {
    type: String,
    required: true,
    enum: ['electronics', 'home', 'beauty', 'fashion', 'sports', 'books', 'games', 'general'],
    index: true
  },

  // Configurações de envio
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  maxMessagesPerDay: {
    type: Number,
    default: 5,
    min: 1,
    max: 20
  },
  sendingEnabled: {
    type: Boolean,
    default: true
  },

  // Horários permitidos para envio
  allowedHours: {
    start: {
      type: Number,
      default: 8,
      min: 0,
      max: 23
    },
    end: {
      type: Number,
      default: 22,
      min: 0,
      max: 23
    }
  },

  // Informações do grupo
  membersCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  },

  // Template de mensagem vinculado
  messageTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageTemplate'
  },

  // Estatísticas de envio
  stats: {
    totalMessagesSent: {
      type: Number,
      default: 0
    },
    messagesSentToday: {
      type: Number,
      default: 0
    },
    lastMessageSentAt: Date,
    avgEngagementRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    totalClicks: {
      type: Number,
      default: 0
    },
    totalConversions: {
      type: Number,
      default: 0
    }
  }
}, { 
  timestamps: true 
});

// Índices para performance
groupSchema.index({ category: 1, isActive: 1 });
groupSchema.index({ sendingEnabled: 1, isActive: 1 });

// Método para verificar se pode enviar mensagem
groupSchema.methods.canSendMessage = function() {
  if (!this.isActive || !this.sendingEnabled) {
    return { canSend: false, reason: 'Grupo inativo ou envio desabilitado' };
  }

  const currentHour = new Date().getHours();
  if (currentHour < this.allowedHours.start || currentHour > this.allowedHours.end) {
    return { canSend: false, reason: 'Fora do horário permitido' };
  }

  if (this.stats.messagesSentToday >= this.maxMessagesPerDay) {
    return { canSend: false, reason: 'Limite diário de mensagens atingido' };
  }

  return { canSend: true };
};

// Método para registrar envio de mensagem
groupSchema.methods.recordMessageSent = function() {
  this.stats.totalMessagesSent = (this.stats.totalMessagesSent || 0) + 1;
  this.stats.messagesSentToday = (this.stats.messagesSentToday || 0) + 1;
  this.stats.lastMessageSentAt = new Date();
  this.lastActivityAt = new Date();

  return this.save();
};

// Método estático para resetar contadores diários (executar via cron)
groupSchema.statics.resetDailyCounters = function() {
  return this.updateMany(
    {},
    {
      $set: {
        'stats.messagesSentToday': 0
      }
    }
  );
};

module.exports = mongoose.model('Group', groupSchema);

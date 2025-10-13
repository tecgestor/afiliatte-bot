const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Schema para usuários do sistema
 */
const userSchema = new mongoose.Schema({
  // Informações básicas
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },

  // Configurações do usuário
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  // Configurações de notificação
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    dailyReport: {
      type: Boolean,
      default: true
    },
    alertsEnabled: {
      type: Boolean,
      default: true
    }
  },

  // Segurança
  lastLoginAt: Date,
  passwordChangedAt: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, { 
  timestamps: true 
});

// Middleware para hash da senha antes de salvar
userSchema.pre('save', async function(next) {
  // Só hash se a senha foi modificada (ou é nova)
  if (!this.isModified('password')) return next();

  try {
    // Hash da senha com cost 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware para atualizar passwordChangedAt
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Método para comparar senha
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Erro ao comparar senhas');
  }
};

// Método para verificar se senha foi alterada após JWT
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Método para verificar se usuário está bloqueado
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Método para incrementar tentativas de login
userSchema.methods.incLoginAttempts = function() {
  // Se temos um lockUntil anterior e expirou, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Se chegamos ao máximo de tentativas e não estamos bloqueados, bloquear
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 horas
  }

  return this.updateOne(updates);
};

// Método estático para autenticação
userSchema.statics.authenticate = async function(email, password) {
  try {
    // Buscar usuário com senha
    const user = await this.findOne({ email }).select('+password');

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    // Verificar se está bloqueado
    if (user.isLocked()) {
      throw new Error('Conta temporariamente bloqueada devido a muitas tentativas de login');
    }

    // Verificar se está ativo
    if (!user.isActive) {
      throw new Error('Conta desativada');
    }

    // Verificar senha
    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      // Incrementar tentativas de login
      await user.incLoginAttempts();
      throw new Error('Credenciais inválidas');
    }

    // Login bem-sucedido, resetar tentativas
    if (user.loginAttempts > 0) {
      await user.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
      });
    }

    // Remover senha do objeto retornado
    user.password = undefined;

    return user;
  } catch (error) {
    throw error;
  }
};

module.exports = mongoose.model('User', userSchema);

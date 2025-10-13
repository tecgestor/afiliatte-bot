/**
 * Middleware global de tratamento de erros
 */

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('🚨 Erro capturado:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Erro de validação do Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      message,
      statusCode: 400
    };
  }

  // Erro de duplicação (MongoDB)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} já existe`;
    error = {
      message,
      statusCode: 409
    };
  }

  // Erro de cast do Mongoose (ID inválido)
  if (err.name === 'CastError') {
    const message = 'ID inválido';
    error = {
      message,
      statusCode: 400
    };
  }

  // Erro JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token JWT inválido';
    error = {
      message,
      statusCode: 401
    };
  }

  // Erro de token expirado
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expirado';
    error = {
      message,
      statusCode: 401
    };
  }

  // Erro de rate limiting
  if (err.status === 429) {
    const message = 'Muitas requisições';
    error = {
      message,
      statusCode: 429
    };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;

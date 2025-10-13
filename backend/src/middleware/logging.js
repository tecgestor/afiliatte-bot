/**
 * Middleware de logging estruturado
 */

const logging = (req, res, next) => {
  const start = Date.now();

  // Log da requisição
  const logData = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    userId: req.user?.id || 'anonymous'
  };

  console.log('📥 Requisição:', JSON.stringify(logData));

  // Override do res.json para capturar resposta
  const originalJson = res.json;
  res.json = function(body) {
    const duration = Date.now() - start;

    const responseLog = {
      ...logData,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      success: body?.success || res.statusCode < 400,
      responseSize: JSON.stringify(body).length
    };

    // Log apenas erros em produção
    if (process.env.NODE_ENV !== 'production' || res.statusCode >= 400) {
      console.log('📤 Resposta:', JSON.stringify(responseLog));
    }

    return originalJson.call(this, body);
  };

  next();
};

module.exports = logging;

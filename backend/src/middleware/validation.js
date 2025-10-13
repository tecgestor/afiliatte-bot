const Joi = require('joi');

/**
 * Middleware de validação usando Joi
 */

// Schemas comuns
const schemas = {
  mongoId: Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().default('-createdAt')
  })
};

/**
 * Middleware de validação
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source];
      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Dados de entrada inválidos',
          errors
        });
      }

      req[source] = value;
      next();
    } catch (err) {
      console.error('Erro no middleware de validação:', err);
      return res.status(500).json({
        success: false,
        message: 'Erro interno no servidor'
      });
    }
  };
};

/**
 * Validação de sanitização
 */
const sanitize = (req, res, next) => {
  // Remove campos perigosos
  const dangerousFields = ['__proto__', 'constructor', 'prototype'];

  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;

    for (const field of dangerousFields) {
      delete obj[field];
    }

    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'object') {
        obj[key] = sanitizeObject(obj[key]);
      }
    });

    return obj;
  };

  req.body = sanitizeObject(req.body || {});
  req.query = sanitizeObject(req.query || {});
  req.params = sanitizeObject(req.params || {});

  next();
};

module.exports = {
  validate,
  sanitize,
  schemas
};

/**
 * Exporta todos os middlewares da aplicação
 */

const auth = require('./auth');
const adminOnly = require('./adminOnly');
const rateLimiting = require('./rateLimiting');
const logging = require('./logging');
const validation = require('./validation');
const errorHandler = require('./errorHandler');

module.exports = {
  auth,
  adminOnly,
  rateLimiting,
  logging,
  validation,
  errorHandler
};

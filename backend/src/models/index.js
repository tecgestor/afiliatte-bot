/**
 * Exporta todos os models da aplicação
 */

const Product = require('./Product');
const Group = require('./Group');
const MessageTemplate = require('./MessageTemplate');
const SendHistory = require('./SendHistory');
const User = require('./User');
const BaseModel = require('./BaseModel');

module.exports = {
  Product,
  Group,
  MessageTemplate,
  SendHistory,
  User,
  BaseModel
};

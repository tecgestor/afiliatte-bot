/**
 * Exporta todos os controllers da aplicação
 */

const ProductController = require('./ProductController');
const GroupController = require('./GroupController');
const MessageTemplateController = require('./MessageTemplateController');
const SendHistoryController = require('./SendHistoryController');
const UserController = require('./UserController');
const BaseController = require('./BaseController');

module.exports = {
  ProductController,
  GroupController,
  MessageTemplateController,
  SendHistoryController,
  UserController,
  BaseController
};

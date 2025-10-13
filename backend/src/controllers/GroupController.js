const BaseController = require('./BaseController');
const { Group } = require('../models');
const Joi = require('joi');

/**
 * Controller para gerenciar grupos de WhatsApp
 */
class GroupController extends BaseController {
  constructor() {
    super(Group, 'Group');
  }

  /**
   * Schema de validação para criação de grupo
   */
  getCreateValidationSchema() {
    return Joi.object({
      whatsappId: Joi.string().required(),
      name: Joi.string().max(100).required(),
      description: Joi.string().max(500),
      category: Joi.string().valid('electronics', 'home', 'beauty', 'fashion', 'sports', 'books', 'games', 'general').required(),
      maxMessagesPerDay: Joi.number().min(1).max(20).default(5),
      sendingEnabled: Joi.boolean().default(true),
      allowedHours: Joi.object({
        start: Joi.number().min(0).max(23).default(8),
        end: Joi.number().min(0).max(23).default(22)
      }),
      membersCount: Joi.number().min(0)
    });
  }

  /**
   * POST - Criar grupo com validação
   */
  async create(req, res) {
    try {
      const { error, value } = this.getCreateValidationSchema().validate(req.body);
      if (error) {
        return this.sendError(res, new Error(error.details[0].message), 400);
      }

      const group = await this.model.create(value);
      return this.sendSuccess(res, group, 'Grupo criado com sucesso', 201);
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  /**
   * PATCH - Alternar status de envio
   */
  async toggleSending(req, res) {
    try {
      const { id } = req.params;

      if (!this.validateObjectId(id)) {
        return this.sendError(res, new Error('ID inválido'), 400);
      }

      const group = await this.model.findById(id);
      if (!group) {
        return this.sendError(res, new Error('Grupo não encontrado'), 404);
      }

      const updatedGroup = await this.model.findByIdAndUpdate(id, {
        sendingEnabled: !group.sendingEnabled
      }, { new: true });

      return this.sendSuccess(res, updatedGroup, 
        `Envio ${updatedGroup.sendingEnabled ? 'ativado' : 'desativado'} para o grupo`);
    } catch (error) {
      return this.sendError(res, error);
    }
  }
}

module.exports = new GroupController();

const BaseController = require('./BaseController');
const { MessageTemplate } = require('../models');
const Joi = require('joi');

/**
 * Controller para gerenciar templates de mensagem
 */
class MessageTemplateController extends BaseController {
  constructor() {
    super(MessageTemplate, 'MessageTemplate');
  }

  /**
   * Schema de validação para criação de template
   */
  getCreateValidationSchema() {
    return Joi.object({
      name: Joi.string().max(50).required(),
      description: Joi.string().max(200),
      category: Joi.string().valid('electronics', 'home', 'beauty', 'fashion', 'sports', 'books', 'games', 'general').required(),
      template: Joi.string().max(2000).required(),
      availableVariables: Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          description: Joi.string().required(),
          type: Joi.string().valid('text', 'number', 'currency', 'percentage', 'url').default('text'),
          required: Joi.boolean().default(false)
        })
      ),
      isDefault: Joi.boolean().default(false)
    });
  }

  /**
   * POST - Processar template com variáveis
   */
  async processTemplate(req, res) {
    try {
      const { id } = req.params;
      const { variables } = req.body;

      if (!this.validateObjectId(id)) {
        return this.sendError(res, new Error('ID inválido'), 400);
      }

      if (!variables || typeof variables !== 'object') {
        return this.sendError(res, new Error('Variáveis são obrigatórias'), 400);
      }

      const template = await this.model.findById(id);
      if (!template) {
        return this.sendError(res, new Error('Template não encontrado'), 404);
      }

      let processedMessage = template.template;
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processedMessage = processedMessage.replace(regex, value);
      }

      const result = {
        originalTemplate: template.template,
        processedMessage: processedMessage.trim(),
        variables: variables
      };

      return this.sendSuccess(res, result, 'Template processado com sucesso');
    } catch (error) {
      return this.sendError(res, error);
    }
  }
}

module.exports = new MessageTemplateController();

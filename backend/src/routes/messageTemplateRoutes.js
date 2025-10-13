const express = require('express');
const router = express.Router();
const MessageTemplateController = require('../controllers/MessageTemplateController');
const { validation, rateLimiting } = require('../middleware');
const Joi = require('joi');

const createTemplateSchema = Joi.object({
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

const processTemplateSchema = Joi.object({
  variables: Joi.object().required()
});

router.get('/', rateLimiting.general, MessageTemplateController.getAll.bind(MessageTemplateController));
router.get('/:id', validation.validate(validation.schemas.mongoId, 'params'), MessageTemplateController.getById.bind(MessageTemplateController));
router.post('/', validation.validate(createTemplateSchema, 'body'), MessageTemplateController.create.bind(MessageTemplateController));
router.post('/:id/process', validation.validate(processTemplateSchema, 'body'), MessageTemplateController.processTemplate.bind(MessageTemplateController));
router.put('/:id', validation.validate(validation.schemas.mongoId, 'params'), MessageTemplateController.updateById.bind(MessageTemplateController));
router.delete('/:id', validation.validate(validation.schemas.mongoId, 'params'), MessageTemplateController.deleteById.bind(MessageTemplateController));

module.exports = router;

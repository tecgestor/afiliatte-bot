const express = require('express');
const router = express.Router();
const GroupController = require('../controllers/GroupController');
const { validation, rateLimiting } = require('../middleware');
const Joi = require('joi');

const createGroupSchema = Joi.object({
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

router.get('/', rateLimiting.general, GroupController.getAll.bind(GroupController));
router.get('/:id', validation.validate(validation.schemas.mongoId, 'params'), GroupController.getById.bind(GroupController));
router.post('/', validation.validate(createGroupSchema, 'body'), GroupController.create.bind(GroupController));
router.put('/:id', validation.validate(validation.schemas.mongoId, 'params'), GroupController.updateById.bind(GroupController));
router.patch('/:id/toggle-sending', validation.validate(validation.schemas.mongoId, 'params'), GroupController.toggleSending.bind(GroupController));
router.delete('/:id', validation.validate(validation.schemas.mongoId, 'params'), GroupController.deleteById.bind(GroupController));

module.exports = router;

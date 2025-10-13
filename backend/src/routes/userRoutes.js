const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { validation, rateLimiting, auth } = require('../middleware');
const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'user').default('user')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Rotas públicas
router.post('/register', rateLimiting.auth, validation.validate(registerSchema, 'body'), UserController.register.bind(UserController));
router.post('/login', rateLimiting.auth, validation.validate(loginSchema, 'body'), UserController.login.bind(UserController));

// Rotas protegidas
router.get('/profile', auth, UserController.getProfile.bind(UserController));
router.put('/profile', auth, UserController.updateProfile.bind(UserController));
router.get('/', auth, UserController.getAll.bind(UserController));
router.get('/:id', auth, validation.validate(validation.schemas.mongoId, 'params'), UserController.getById.bind(UserController));

module.exports = router;

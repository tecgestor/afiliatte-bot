const BaseController = require('./BaseController');
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

/**
 * Controller para gerenciar usuários e autenticação
 */
class UserController extends BaseController {
  constructor() {
    super(User, 'User');
  }

  /**
   * Gerar JWT Token
   */
  generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  }

  /**
   * POST - Registrar novo usuário
   */
  async register(req, res) {
    try {
      const schema = Joi.object({
        name: Joi.string().max(100).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        role: Joi.string().valid('admin', 'user').default('user')
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return this.sendError(res, new Error(error.details[0].message), 400);
      }

      // Verificar se email já existe
      const existingUser = await this.model.findOne({ email: value.email });
      if (existingUser) {
        return this.sendError(res, new Error('Email já está em uso'), 409);
      }

      const user = await this.model.create(value);
      const token = this.generateToken(user._id);

      // Remover senha da resposta
      const userResponse = user.toObject();
      delete userResponse.password;

      return this.sendSuccess(res, { user: userResponse, token }, 'Usuário registrado com sucesso', 201);
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  /**
   * POST - Login de usuário
   */
  async login(req, res) {
    try {
      const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return this.sendError(res, new Error(error.details[0].message), 400);
      }

      // Buscar usuário com senha
      const user = await this.model.findOne({ email: value.email }).select('+password');
      if (!user) {
        return this.sendError(res, new Error('Credenciais inválidas'), 401);
      }

      // Verificar senha
      const isValidPassword = await user.comparePassword(value.password);
      if (!isValidPassword) {
        return this.sendError(res, new Error('Credenciais inválidas'), 401);
      }

      // Verificar se usuário está ativo
      if (!user.isActive) {
        return this.sendError(res, new Error('Conta desativada'), 401);
      }

      // Atualizar último login
      await this.model.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

      const token = this.generateToken(user._id);

      // Remover senha da resposta
      const userResponse = user.toObject();
      delete userResponse.password;

      return this.sendSuccess(res, { user: userResponse, token }, 'Login realizado com sucesso');
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  /**
   * GET - Obter perfil do usuário autenticado
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id || req.user._id;

      const user = await this.model.findById(userId).select('-password');
      if (!user) {
        return this.sendError(res, new Error('Usuário não encontrado'), 404);
      }

      return this.sendSuccess(res, user, 'Perfil obtido com sucesso');
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  /**
   * PUT - Atualizar perfil
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.id || req.user._id;

      const allowedFields = ['name', 'email'];
      const updateData = {};

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      if (Object.keys(updateData).length === 0) {
        return this.sendError(res, new Error('Nenhum campo válido para atualizar'), 400);
      }

      const user = await this.model.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return this.sendError(res, new Error('Usuário não encontrado'), 404);
      }

      return this.sendSuccess(res, user, 'Perfil atualizado com sucesso');
    } catch (error) {
      return this.sendError(res, error);
    }
  }
}

module.exports = new UserController();

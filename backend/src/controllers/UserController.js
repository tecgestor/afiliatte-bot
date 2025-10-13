const jwt = require('jsonwebtoken');
const BaseController = require('./BaseController');
const { User } = require('../models');

class UserController extends BaseController {
  constructor() {
    super();
  }

  /**
   * Registrar novo usuário
   */
  register = this.handleAsync(async (req, res) => {
    this.validateRequiredFields(req.body, ['name', 'email', 'password']);

    const { name, email, password, role = 'user' } = req.body;

    // Verificar se usuário já existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return this.errorResponse(res, 'Email já está em uso', 400);
    }

    // Validar força da senha
    if (password.length < 6) {
      return this.errorResponse(res, 'Senha deve ter pelo menos 6 caracteres', 400);
    }

    // Criar usuário
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: req.user?.role === 'admin' ? role : 'user' // Apenas admin pode criar outros admins
    });

    await user.save();

    // Gerar token
    const token = this.generateToken(user._id);

    // Remover senha da resposta
    const userResponse = user.toJSON();

    return this.successResponse(res, { user: userResponse, token }, 'Usuário criado com sucesso', 201);
  });

  /**
   * Login de usuário
   */
  login = this.handleAsync(async (req, res) => {
    this.validateRequiredFields(req.body, ['email', 'password']);

    const { email, password } = req.body;

    // Buscar usuário e incluir senha para verificação
    const user = await User.findOne({ 
      email: email.toLowerCase().trim(),
      isActive: true 
    }).select('+password');

    if (!user) {
      return this.errorResponse(res, 'Credenciais inválidas', 401);
    }

    // Verificar senha
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Incrementar tentativas de login
      user.loginAttempts += 1;
      await user.save();

      return this.errorResponse(res, 'Credenciais inválidas', 401);
    }

    // Reset contador de tentativas e atualizar último login
    user.loginAttempts = 0;
    user.lastLogin = new Date();
    await user.save();

    // Gerar token
    const token = this.generateToken(user._id);

    // Remover senha da resposta
    const userResponse = user.toJSON();

    return this.successResponse(res, { user: userResponse, token }, 'Login realizado com sucesso');
  });

  /**
   * Obter perfil do usuário atual
   */
  getProfile = this.handleAsync(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
      return this.errorResponse(res, 'Usuário não encontrado', 404);
    }

    return this.successResponse(res, user);
  });

  /**
   * Atualizar perfil
   */
  updateProfile = this.handleAsync(async (req, res) => {
    const allowedFields = ['name', 'notifications'];
    const updates = {};

    // Filtrar apenas campos permitidos
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return this.errorResponse(res, 'Nenhum campo válido para atualização', 400);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    return this.successResponse(res, user, 'Perfil atualizado com sucesso');
  });

  /**
   * Alterar senha
   */
  changePassword = this.handleAsync(async (req, res) => {
    this.validateRequiredFields(req.body, ['currentPassword', 'newPassword']);

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Verificar senha atual
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return this.errorResponse(res, 'Senha atual incorreta', 400);
    }

    // Validar nova senha
    if (newPassword.length < 6) {
      return this.errorResponse(res, 'Nova senha deve ter pelo menos 6 caracteres', 400);
    }

    // Atualizar senha
    user.password = newPassword;
    await user.save();

    return this.successResponse(res, null, 'Senha alterada com sucesso');
  });

  /**
   * Listar usuários (apenas admin)
   */
  getAll = this.handleAsync(async (req, res) => {
    const { page, limit, skip } = this.getPaginationOptions(req);

    const filters = {};
    if (req.query.role) {
      filters.role = req.query.role;
    }
    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === 'true';
    }

    const [users, total] = await Promise.all([
      User.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filters)
    ]);

    const pagination = {
      totalDocs: total,
      limit,
      page,
      totalPages: Math.ceil(total / limit)
    };

    return this.paginatedResponse(res, users, pagination);
  });

  /**
   * Desativar usuário (apenas admin)
   */
  deactivate = this.handleAsync(async (req, res) => {
    const { id } = req.params;

    if (id === req.user.id) {
      return this.errorResponse(res, 'Não é possível desativar sua própria conta', 400);
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return this.errorResponse(res, 'Usuário não encontrado', 404);
    }

    return this.successResponse(res, user, 'Usuário desativado com sucesso');
  });

  /**
   * Gerar token JWT
   */
  generateToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }
}

module.exports = UserController;
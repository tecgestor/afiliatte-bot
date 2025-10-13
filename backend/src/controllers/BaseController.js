const mongoose = require('mongoose');

/**
 * Controlador base abstrato com funcionalidades CRUD comuns
 */
class BaseController {
  constructor(model, modelName) {
    if (new.target === BaseController) {
      throw new Error('BaseController é uma classe abstrata');
    }
    this.model = model;
    this.modelName = modelName;
  }

  /**
   * Validar ObjectId do MongoDB
   */
  validateObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
  }

  /**
   * Enviar resposta de sucesso
   */
  sendSuccess(res, data, message = 'Operação realizada com sucesso', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  /**
   * Enviar resposta de erro
   */
  sendError(res, error, statusCode = 500) {
    console.error(`Erro no ${this.modelName}Controller:`, error);

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }

  /**
   * GET - Listar todos os documentos
   */
  async getAll(req, res) {
    try {
      const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort
      };

      let result;
      if (this.model.paginate) {
        result = await this.model.paginate({}, options);
      } else {
        const documents = await this.model.find()
          .sort(sort)
          .limit(parseInt(limit))
          .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await this.model.countDocuments();

        result = {
          docs: documents,
          totalDocs: total,
          limit: parseInt(limit),
          page: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit))
        };
      }

      return this.sendSuccess(res, result, `${this.modelName}s listados com sucesso`);
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  /**
   * GET - Buscar por ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      if (!this.validateObjectId(id)) {
        return this.sendError(res, new Error('ID inválido'), 400);
      }

      const document = await this.model.findById(id);

      if (!document) {
        return this.sendError(res, new Error(`${this.modelName} não encontrado`), 404);
      }

      return this.sendSuccess(res, document, `${this.modelName} encontrado com sucesso`);
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  /**
   * POST - Criar novo documento
   */
  async create(req, res) {
    try {
      const document = new this.model(req.body);
      const savedDocument = await document.save();

      return this.sendSuccess(res, savedDocument, `${this.modelName} criado com sucesso`, 201);
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  /**
   * PUT - Atualizar por ID
   */
  async updateById(req, res) {
    try {
      const { id } = req.params;

      if (!this.validateObjectId(id)) {
        return this.sendError(res, new Error('ID inválido'), 400);
      }

      const document = await this.model.findByIdAndUpdate(
        id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!document) {
        return this.sendError(res, new Error(`${this.modelName} não encontrado`), 404);
      }

      return this.sendSuccess(res, document, `${this.modelName} atualizado com sucesso`);
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  /**
   * DELETE - Remover por ID
   */
  async deleteById(req, res) {
    try {
      const { id } = req.params;

      if (!this.validateObjectId(id)) {
        return this.sendError(res, new Error('ID inválido'), 400);
      }

      const document = await this.model.findByIdAndDelete(id);

      if (!document) {
        return this.sendError(res, new Error(`${this.modelName} não encontrado`), 404);
      }

      return this.sendSuccess(res, document, `${this.modelName} removido com sucesso`);
    } catch (error) {
      return this.sendError(res, error);
    }
  }
}

module.exports = BaseController;

class BaseController {
  constructor() {
    this.handleAsync = this.handleAsync.bind(this);
  }

  /**
   * Wrapper para tratar erros assíncronos
   * @param {Function} fn - Função assíncrona
   */
  handleAsync(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Resposta de sucesso padronizada
   * @param {Object} res - Response object
   * @param {*} data - Dados para retornar  
   * @param {String} message - Mensagem de sucesso
   * @param {Number} statusCode - Código de status
   */
  successResponse(res, data = null, message = 'Operação realizada com sucesso', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Resposta de erro padronizada
   * @param {Object} res - Response object
   * @param {String} message - Mensagem de erro
   * @param {Number} statusCode - Código de status
   * @param {*} error - Detalhes do erro
   */
  errorResponse(res, message = 'Erro interno do servidor', statusCode = 500, error = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };

    if (process.env.NODE_ENV === 'development' && error) {
      response.error = error;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Resposta paginada padronizada
   * @param {Object} res - Response object
   * @param {Array} docs - Documentos
   * @param {Object} pagination - Informações de paginação
   * @param {String} message - Mensagem
   */
  paginatedResponse(res, docs, pagination, message = 'Dados recuperados com sucesso') {
    return res.status(200).json({
      success: true,
      message,
      data: {
        docs,
        ...pagination
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Validar parâmetros obrigatórios
   * @param {Object} data - Dados para validar
   * @param {Array} requiredFields - Campos obrigatórios
   */
  validateRequiredFields(data, requiredFields) {
    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
      throw new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Aplicar filtros de busca
   * @param {Object} query - Query base
   * @param {Object} filters - Filtros a aplicar
   * @param {Array} allowedFilters - Filtros permitidos
   */
  applyFilters(query, filters, allowedFilters) {
    Object.keys(filters).forEach(key => {
      if (allowedFilters.includes(key) && filters[key]) {
        if (typeof filters[key] === 'string') {
          query[key] = new RegExp(filters[key], 'i');
        } else {
          query[key] = filters[key];
        }
      }
    });

    return query;
  }

  /**
   * Configurar paginação
   * @param {Object} req - Request object
   * @param {Number} defaultLimit - Limite padrão
   */
  getPaginationOptions(req, defaultLimit = 10) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || defaultLimit));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }
}

module.exports = BaseController;
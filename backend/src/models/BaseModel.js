const mongoose = require('mongoose');

/**
 * Classe base abstrata para todos os modelos
 * Implementa funcionalidades comuns como timestamps e validações
 */
class BaseModel {
  constructor(modelName, schema, options = {}) {
    if (new.target === BaseModel) {
      throw new Error('BaseModel é uma classe abstrata e não pode ser instanciada diretamente');
    }

    // Adicionar campos comuns
    schema.add({
      createdAt: {
        type: Date,
        default: Date.now
      },
      updatedAt: {
        type: Date,
        default: Date.now
      },
      isActive: {
        type: Boolean,
        default: true
      }
    });

    // Middleware pre-save para atualizar updatedAt
    schema.pre('save', function(next) {
      this.updatedAt = new Date();
      next();
    });

    schema.pre('findOneAndUpdate', function(next) {
      this.set({ updatedAt: new Date() });
      next();
    });

    // Criar o modelo
    this.model = mongoose.model(modelName, schema, options.collection);
  }

  /**
   * Criar um novo documento
   */
  async create(data) {
    try {
      const document = new this.model(data);
      return await document.save();
    } catch (error) {
      throw new Error(`Erro ao criar ${this.model.modelName}: ${error.message}`);
    }
  }

  /**
   * Buscar por ID
   */
  async findById(id) {
    try {
      return await this.model.findById(id);
    } catch (error) {
      throw new Error(`Erro ao buscar ${this.model.modelName}: ${error.message}`);
    }
  }

  /**
   * Buscar um documento por critérios
   */
  async findOne(criteria) {
    try {
      return await this.model.findOne(criteria);
    } catch (error) {
      throw new Error(`Erro ao buscar ${this.model.modelName}: ${error.message}`);
    }
  }

  /**
   * Atualizar por ID
   */
  async updateById(id, data) {
    try {
      return await this.model.findByIdAndUpdate(
        id, 
        { ...data, updatedAt: new Date() }, 
        { new: true, runValidators: true }
      );
    } catch (error) {
      throw new Error(`Erro ao atualizar ${this.model.modelName}: ${error.message}`);
    }
  }

  /**
   * Deletar por ID (soft delete)
   */
  async deleteById(id) {
    try {
      return await this.model.findByIdAndUpdate(
        id, 
        { isActive: false, updatedAt: new Date() }, 
        { new: true }
      );
    } catch (error) {
      throw new Error(`Erro ao deletar ${this.model.modelName}: ${error.message}`);
    }
  }
}

module.exports = BaseModel;

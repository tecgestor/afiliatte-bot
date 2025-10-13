const BaseController = require('./BaseController');
const { SendHistory } = require('../models');
const Joi = require('joi');

/**
 * Controller para gerenciar histórico de envios
 */
class SendHistoryController extends BaseController {
  constructor() {
    super(SendHistory, 'SendHistory');
  }

  /**
   * GET - Histórico com filtros
   */
  async getFilteredHistory(req, res) {
    try {
      const {
        groupId,
        productId,
        status,
        startDate,
        endDate,
        page = 1,
        limit = 20
      } = req.query;

      const filters = {};

      if (groupId && this.validateObjectId(groupId)) {
        filters.group = groupId;
      }

      if (productId && this.validateObjectId(productId)) {
        filters.product = productId;
      }

      if (status) {
        filters.status = status;
      }

      if (startDate && endDate) {
        filters.sentAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: '-sentAt',
        populate: [
          { path: 'product', select: 'title platform price' },
          { path: 'group', select: 'name category' },
          { path: 'messageTemplate', select: 'name' }
        ]
      };

      const result = await this.model.paginate ? 
        await this.model.paginate(filters, options) :
        await this.manualPaginateWithPopulate(filters, options);

      return this.sendSuccess(res, result, 'Histórico obtido com sucesso');
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  /**
   * GET - Estatísticas de engajamento
   */
  async getEngagementStats(req, res) {
    try {
      const { startDate, endDate, groupId, productId } = req.query;

      const matchCriteria = {};

      if (groupId && this.validateObjectId(groupId)) {
        matchCriteria.group = mongoose.Types.ObjectId(groupId);
      }

      if (productId && this.validateObjectId(productId)) {
        matchCriteria.product = mongoose.Types.ObjectId(productId);
      }

      if (startDate && endDate) {
        matchCriteria.sentAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const stats = await this.model.aggregate([
        { $match: matchCriteria },
        {
          $group: {
            _id: null,
            totalMessages: { $sum: 1 },
            totalClicks: { $sum: '$engagement.clicks' },
            totalReactions: { $sum: '$engagement.reactions' },
            totalReplies: { $sum: '$engagement.replies' },
            totalConversions: { $sum: '$engagement.conversions' },
            avgClicks: { $avg: '$engagement.clicks' },
            avgReactions: { $avg: '$engagement.reactions' }
          }
        }
      ]);

      const result = stats.length > 0 ? stats[0] : {
        totalMessages: 0,
        totalClicks: 0,
        totalReactions: 0,
        totalReplies: 0,
        totalConversions: 0,
        avgClicks: 0,
        avgReactions: 0
      };

      // Calcular taxa de engajamento
      if (result.totalMessages > 0) {
        result.engagementRate = ((result.totalClicks + result.totalReactions + result.totalReplies) / result.totalMessages).toFixed(3);
        result.conversionRate = (result.totalConversions / result.totalMessages).toFixed(3);
      } else {
        result.engagementRate = 0;
        result.conversionRate = 0;
      }

      return this.sendSuccess(res, result, 'Estatísticas de engajamento obtidas com sucesso');
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  /**
   * Paginação manual com populate
   */
  async manualPaginateWithPopulate(filters, options) {
    const { page, limit, sort, populate } = options;
    const skip = (page - 1) * limit;

    let query = this.model.find(filters)
      .sort(sort || '-sentAt')
      .limit(limit)
      .skip(skip);

    if (populate) {
      populate.forEach(pop => {
        query = query.populate(pop);
      });
    }

    const documents = await query;
    const total = await this.model.countDocuments(filters);

    return {
      docs: documents,
      totalDocs: total,
      limit,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    };
  }
}

module.exports = new SendHistoryController();

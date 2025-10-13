const { Product, Group, MessageTemplate, SendHistory } = require('../models');
const WhatsAppService = require('./WhatsAppService');
const ScrapingService = require('./ScrapingService');

/**
 * Serviço principal do robô de afiliados
 * Orquestra o scraping, seleção de produtos e envio de mensagens
 */
class AffiliateRobotService {
  constructor() {
    this.isRunning = false;
    this.currentExecution = null;
    this.executionHistory = [];
    this.config = {
      maxMessagesPerExecution: 50,
      delayBetweenMessages: 30000, // 30 segundos
      maxRetries: 3,
      onlyApprovedProducts: true,
      minCommissionQuality: ['excelente', 'boa']
    };
  }

  /**
   * Executar ciclo completo do robô
   */
  async runCompleteCycle(options = {}) {
    if (this.isRunning) {
      throw new Error('Robô já está em execução');
    }

    this.isRunning = true;
    const executionId = Date.now();

    this.currentExecution = {
      id: executionId,
      startedAt: new Date(),
      phase: 'iniciando',
      progress: 0,
      stats: {
        productsScraped: 0,
        messagesSent: 0,
        errors: 0,
        successful: 0
      }
    };

    try {
      console.log('🤖 Iniciando ciclo completo do robô de afiliados');

      // FASE 1: Scraping de produtos
      await this.runScrapingPhase(options);

      // FASE 2: Seleção de produtos
      await this.runProductSelectionPhase();

      // FASE 3: Envio de mensagens
      await this.runMessagingPhase(options);

      // FASE 4: Finalização
      await this.finalizeCycle();

      const result = {
        executionId,
        success: true,
        duration: Date.now() - executionId,
        stats: this.currentExecution.stats,
        finishedAt: new Date()
      };

      this.executionHistory.unshift(result);
      if (this.executionHistory.length > 50) {
        this.executionHistory = this.executionHistory.slice(0, 50);
      }

      return result;

    } catch (error) {
      console.error('❌ Erro no ciclo do robô:', error.message);

      const errorResult = {
        executionId,
        success: false,
        error: error.message,
        duration: Date.now() - executionId,
        stats: this.currentExecution.stats,
        finishedAt: new Date()
      };

      this.executionHistory.unshift(errorResult);
      return errorResult;

    } finally {
      this.isRunning = false;
      this.currentExecution = null;
    }
  }

  /**
   * Fase 1: Scraping de produtos
   */
  async runScrapingPhase(options) {
    this.currentExecution.phase = 'scraping';
    this.currentExecution.progress = 10;

    console.log('🔍 FASE 1: Executando scraping de produtos...');

    const scrapingOptions = {
      categories: options.categories || ['electronics', 'beauty', 'home'],
      platforms: options.platforms || ['mercadolivre', 'shopee'],
      limit: options.scrapingLimit || 30,
      saveToDatabase: true
    };

    const scrapingResult = await ScrapingService.runScrapingCycle(scrapingOptions);

    this.currentExecution.stats.productsScraped = scrapingResult.totalProducts;
    this.currentExecution.progress = 30;

    console.log(`✅ Scraping concluído: ${scrapingResult.totalProducts} produtos encontrados`);
    return scrapingResult;
  }

  /**
   * Fase 2: Seleção de produtos de qualidade
   */
  async runProductSelectionPhase() {
    this.currentExecution.phase = 'seleção';
    this.currentExecution.progress = 40;

    console.log('🎯 FASE 2: Selecionando produtos de qualidade...');

    const filters = {
      isActive: true
    };

    if (this.config.onlyApprovedProducts) {
      filters.isApproved = true;
    }

    if (this.config.minCommissionQuality.length > 0) {
      filters.commissionQuality = { $in: this.config.minCommissionQuality };
    }

    const selectedProducts = await Product.find(filters)
      .sort('-estimatedCommission')
      .limit(this.config.maxMessagesPerExecution);

    this.currentExecution.selectedProducts = selectedProducts;
    this.currentExecution.progress = 50;

    console.log(`✅ Selecionados ${selectedProducts.length} produtos de qualidade`);
    return selectedProducts;
  }

  /**
   * Fase 3: Envio de mensagens
   */
  async runMessagingPhase(options) {
    this.currentExecution.phase = 'envio';
    this.currentExecution.progress = 60;

    console.log('📱 FASE 3: Enviando mensagens...');

    if (!this.currentExecution.selectedProducts || this.currentExecution.selectedProducts.length === 0) {
      console.log('⚠️ Nenhum produto selecionado para envio');
      return;
    }

    // Buscar grupos ativos
    const activeGroups = await Group.find({
      isActive: true,
      sendingEnabled: true
    }).populate('messageTemplate');

    if (activeGroups.length === 0) {
      console.log('⚠️ Nenhum grupo ativo encontrado');
      return;
    }

    console.log(`📤 Enviando para ${activeGroups.length} grupos...`);

    const progressIncrement = 30 / (this.currentExecution.selectedProducts.length * activeGroups.length);

    // Enviar produtos para grupos
    for (const product of this.currentExecution.selectedProducts) {
      for (const group of activeGroups) {
        try {
          // Verificar se grupo pode receber mensagem
          const canSend = group.canSendMessage();
          if (!canSend.canSend) {
            console.log(`⚠️ Grupo ${group.name}: ${canSend.reason}`);
            continue;
          }

          // Enviar mensagem
          await this.sendProductToGroup(product, group);

          // Delay entre mensagens
          if (this.config.delayBetweenMessages > 0) {
            await new Promise(resolve => setTimeout(resolve, this.config.delayBetweenMessages));
          }

          this.currentExecution.progress += progressIncrement;

        } catch (error) {
          console.error(`❌ Erro ao enviar para grupo ${group.name}:`, error.message);
          this.currentExecution.stats.errors++;
        }
      }
    }

    this.currentExecution.progress = 90;
    console.log(`✅ Fase de envio concluída`);
  }

  /**
   * Enviar produto para grupo específico
   */
  async sendProductToGroup(product, group) {
    try {
      // Selecionar template
      const template = group.messageTemplate || 
                      await MessageTemplate.findOne({ category: product.category, isDefault: true }) ||
                      await MessageTemplate.findOne({ isDefault: true });

      if (!template) {
        throw new Error('Template de mensagem não encontrado');
      }

      // Processar template com dados do produto
      const variables = {
        title: product.title,
        price: this.formatCurrency(product.price),
        originalPrice: product.originalPrice ? this.formatCurrency(product.originalPrice) : null,
        discount: product.originalPrice ? this.formatCurrency(product.originalPrice - product.price) : null,
        discountPercentage: product.originalPrice ? `${Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%` : null,
        rating: product.rating || 'N/A',
        reviewsCount: product.reviewsCount || 0,
        salesCount: product.salesCount || 0,
        platform: product.platform.toUpperCase(),
        category: this.translateCategory(product.category),
        affiliateLink: product.affiliateLink,
        commission: this.formatCurrency(product.estimatedCommission),
        commissionQuality: product.commissionQuality.toUpperCase()
      };

      const processedMessage = template.processTemplate(variables);

      // Enviar via WhatsApp
      const whatsappResult = await WhatsAppService.sendMessageWithRetry(
        group.whatsappId,
        processedMessage,
        product.imageUrl,
        this.config.maxRetries
      );

      // Registrar histórico
      const historyRecord = await SendHistory.create({
        product: product._id,
        group: group._id,
        messageTemplate: template._id,
        messageContent: processedMessage,
        messageId: whatsappResult.messageId,
        status: whatsappResult.success ? 'sent' : 'failed',
        apiResponse: {
          success: whatsappResult.success,
          responseData: whatsappResult.data,
          errorMessage: whatsappResult.error,
          httpStatus: whatsappResult.httpStatus
        },
        processingTime: whatsappResult.processingTime || 0
      });

      // Atualizar estatísticas do grupo
      if (whatsappResult.success) {
        await group.recordMessageSent();
        await template.recordUsage();
        this.currentExecution.stats.successful++;
      } else {
        this.currentExecution.stats.errors++;
      }

      this.currentExecution.stats.messagesSent++;

      console.log(`${whatsappResult.success ? '✅' : '❌'} ${group.name}: ${product.title.substring(0, 50)}...`);

      return historyRecord;

    } catch (error) {
      console.error('❌ Erro no envio:', error.message);
      this.currentExecution.stats.errors++;
      throw error;
    }
  }

  /**
   * Fase 4: Finalizar ciclo
   */
  async finalizeCycle() {
    this.currentExecution.phase = 'finalizando';
    this.currentExecution.progress = 95;

    console.log('🏁 FASE 4: Finalizando ciclo...');

    // Resetar contadores diários se necessário
    const now = new Date();
    const isNewDay = !this.lastResetDate || 
                    this.lastResetDate.getDate() !== now.getDate();

    if (isNewDay) {
      await Group.resetDailyCounters();
      this.lastResetDate = now;
      console.log('🔄 Contadores diários resetados');
    }

    this.currentExecution.progress = 100;
    console.log('✅ Ciclo completo finalizado');
  }

  /**
   * Obter status do robô
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      currentExecution: this.currentExecution,
      lastExecution: this.executionHistory[0] || null,
      totalExecutions: this.executionHistory.length,
      config: this.config
    };
  }

  /**
   * Atualizar configurações
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Configurações atualizadas:', newConfig);
    return this.config;
  }

  /**
   * Parar execução atual
   */
  async stop() {
    if (this.isRunning && this.currentExecution) {
      this.currentExecution.phase = 'parando';
      console.log('🛑 Parando robô...');

      // Aguardar um pouco para finalizar operações em andamento
      await new Promise(resolve => setTimeout(resolve, 5000));

      this.isRunning = false;
      this.currentExecution = null;

      console.log('✅ Robô parado');
      return true;
    }
    return false;
  }

  /**
   * Formatar valor monetário
   */
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Traduzir categoria
   */
  translateCategory(category) {
    const translations = {
      electronics: 'Eletrônicos',
      home: 'Casa e Jardim',
      beauty: 'Beleza e Cuidados',
      fashion: 'Moda',
      sports: 'Esportes',
      books: 'Livros',
      games: 'Games',
      general: 'Geral'
    };

    return translations[category] || category;
  }

  /**
   * Obter histórico de execuções
   */
  getExecutionHistory(limit = 10) {
    return this.executionHistory.slice(0, limit);
  }

  /**
   * Obter estatísticas gerais
   */
  async getGeneralStats() {
    try {
      const [
        totalProducts,
        approvedProducts,
        totalGroups,
        activeGroups,
        totalMessages,
        todayMessages
      ] = await Promise.all([
        Product.countDocuments({ isActive: true }),
        Product.countDocuments({ isActive: true, isApproved: true }),
        Group.countDocuments({ isActive: true }),
        Group.countDocuments({ isActive: true, sendingEnabled: true }),
        SendHistory.countDocuments(),
        SendHistory.countDocuments({
          sentAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        })
      ]);

      return {
        products: {
          total: totalProducts,
          approved: approvedProducts,
          approvalRate: totalProducts > 0 ? ((approvedProducts / totalProducts) * 100).toFixed(1) : 0
        },
        groups: {
          total: totalGroups,
          active: activeGroups,
          activeRate: totalGroups > 0 ? ((activeGroups / totalGroups) * 100).toFixed(1) : 0
        },
        messages: {
          total: totalMessages,
          today: todayMessages
        },
        robot: this.getStatus()
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error.message);
      return null;
    }
  }
}

module.exports = new AffiliateRobotService();

const axios = require('axios');

/**
 * Serviço para integração com APIs do WhatsApp
 * Compatível com Evolution API e outras soluções
 */
class WhatsAppService {
  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'http://localhost:8080';
    this.apiKey = process.env.WHATSAPP_API_KEY || 'B6D711FCDE4D4FD5936544120E713976';
    this.instanceName = process.env.WHATSAPP_INSTANCE_NAME || 'affiliate_bot';

    this.httpClient = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.apiKey
      }
    });

    this.lastRequestTime = 0;
    this.minRequestInterval = 2000; // 2 segundos entre requests
  }

  /**
   * Controle de rate limiting
   */
  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Verificar conexão com a API do WhatsApp
   */
  async checkConnection() {
    try {
      await this.enforceRateLimit();

      const response = await this.httpClient.get(`/instance/connectionState/${this.instanceName}`);

      return {
        connected: response.data.instance?.state === 'open',
        state: response.data.instance?.state || 'unknown',
        instanceName: this.instanceName,
        qrCode: response.data.qrcode || null,
        lastConnected: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao verificar conexão WhatsApp:', error.message);
      return { 
        connected: false, 
        error: error.message,
        instanceName: this.instanceName,
        lastConnected: null
      };
    }
  }

  /**
   * Enviar mensagem de texto
   */
  async sendTextMessage(groupId, message) {
    try {
      await this.enforceRateLimit();

      const payload = {
        number: groupId,
        textMessage: {
          text: message
        }
      };

      console.log(`📱 Enviando mensagem para grupo ${groupId}:`, message.substring(0, 50) + '...');

      const startTime = Date.now();
      const response = await this.httpClient.post(
        `/message/sendText/${this.instanceName}`,
        payload
      );
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        messageId: response.data.key?.id,
        data: response.data,
        sentAt: new Date(),
        groupId,
        message,
        processingTime
      };
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error.message);
      return {
        success: false,
        error: error.message,
        httpStatus: error.response?.status,
        sentAt: new Date(),
        groupId,
        message,
        processingTime: 0
      };
    }
  }

  /**
   * Enviar mensagem com mídia (imagem)
   */
  async sendMediaMessage(groupId, imageUrl, caption) {
    try {
      await this.enforceRateLimit();

      const payload = {
        number: groupId,
        mediaMessage: {
          mediatype: 'image',
          media: imageUrl,
          ...(caption && { caption })
        }
      };

      console.log(`🖼️ Enviando mídia para grupo ${groupId}`);

      const startTime = Date.now();
      const response = await this.httpClient.post(
        `/message/sendMedia/${this.instanceName}`,
        payload
      );
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        messageId: response.data.key?.id,
        data: response.data,
        sentAt: new Date(),
        groupId,
        imageUrl,
        caption,
        processingTime
      };
    } catch (error) {
      console.error('❌ Erro ao enviar mídia:', error.message);
      return {
        success: false,
        error: error.message,
        httpStatus: error.response?.status,
        sentAt: new Date(),
        groupId,
        imageUrl,
        caption,
        processingTime: 0
      };
    }
  }

  /**
   * Listar grupos do bot
   */
  async listGroups() {
    try {
      await this.enforceRateLimit();

      const response = await this.httpClient.get(`/group/fetchAllGroups/${this.instanceName}`);

      if (!response.data || !Array.isArray(response.data)) {
        return [];
      }

      return response.data.map(group => ({
        id: group.id,
        subject: group.subject,
        description: group.description,
        participantsCount: group.participants?.length || 0,
        createdAt: group.creation ? new Date(group.creation * 1000) : null,
        isActive: true,
        owner: group.owner
      }));
    } catch (error) {
      console.error('❌ Erro ao listar grupos:', error.message);
      return [];
    }
  }

  /**
   * Enviar mensagem com retry automático
   */
  async sendMessageWithRetry(groupId, message, imageUrl = null, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = imageUrl 
          ? await this.sendMediaMessage(groupId, imageUrl, message)
          : await this.sendTextMessage(groupId, message);

        if (result.success) {
          console.log(`✅ Mensagem enviada com sucesso na tentativa ${attempt}`);
          return result;
        }

        if (attempt === maxRetries) {
          console.error(`❌ Todas as ${maxRetries} tentativas falharam`);
          return result;
        }

        console.warn(`⚠️ Tentativa ${attempt} falhou, tentando novamente...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));

      } catch (error) {
        if (attempt === maxRetries) {
          console.error(`❌ Erro fatal após ${maxRetries} tentativas:`, error.message);
          return {
            success: false,
            error: error.message,
            sentAt: new Date(),
            groupId,
            message,
            imageUrl,
            attempts: maxRetries
          };
        }

        console.warn(`⚠️ Erro na tentativa ${attempt}:`, error.message);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  /**
   * Verificar se número/grupo é válido
   */
  async validateNumber(number) {
    try {
      await this.enforceRateLimit();

      const response = await this.httpClient.get(`/chat/whatsappNumbers/${this.instanceName}`, {
        params: { numbers: number }
      });

      return response.data && response.data.length > 0;
    } catch (error) {
      console.error('❌ Erro ao validar número:', error.message);
      return false;
    }
  }

  /**
   * Obter informações do grupo
   */
  async getGroupInfo(groupId) {
    try {
      await this.enforceRateLimit();

      const response = await this.httpClient.get(`/group/participants/${this.instanceName}`, {
        params: { groupJid: groupId }
      });

      return {
        success: true,
        groupInfo: response.data
      };
    } catch (error) {
      console.error('❌ Erro ao obter info do grupo:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new WhatsAppService();

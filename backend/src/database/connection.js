const mongoose = require('mongoose');

/**
 * Classe para gerenciar conexão com MongoDB
 */
class Database {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Conectar ao MongoDB
   */
  async connect() {
    try {
      if (this.isConnected) {
        console.log('✅ MongoDB já está conectado');
        return this.connection;
      }

      const mongoUri = process.env.MONGODB_URI;

      if (!mongoUri) {
        throw new Error('❌ MONGODB_URI não definida nas variáveis de ambiente');
      }

      console.log('🔄 Conectando ao MongoDB...');

      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferMaxEntries: 0,
        bufferCommands: false
      };

      this.connection = await mongoose.connect(mongoUri, options);
      this.isConnected = true;
      this.reconnectAttempts = 0;

      console.log(`✅ MongoDB conectado: ${this.connection.connection.host}:${this.connection.connection.port}`);
      console.log(`📊 Banco de dados: ${this.connection.connection.name}`);

      this.setupEventListeners();
      return this.connection;

    } catch (error) {
      console.error('❌ Erro ao conectar MongoDB:', error.message);
      this.isConnected = false;

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔄 Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts} em 5 segundos...`);
        setTimeout(() => this.connect(), 5000);
      } else {
        console.error('❌ Número máximo de tentativas de conexão atingido');
        process.exit(1);
      }

      throw error;
    }
  }

  /**
   * Configurar event listeners do MongoDB
   */
  setupEventListeners() {
    mongoose.connection.on('error', (err) => {
      console.error('❌ Erro na conexão MongoDB:', err.message);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB desconectado');
      this.isConnected = false;

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log('🔄 Tentando reconectar...');
        setTimeout(() => this.connect(), 5000);
      }
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconectado');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🔄 Encerrando aplicação...');
      await this.disconnect();
      console.log('👋 Aplicação encerrada');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🔄 Recebido SIGTERM, encerrando aplicação...');
      await this.disconnect();
      process.exit(0);
    });
  }

  /**
   * Desconectar do MongoDB
   */
  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.connection.close();
        this.isConnected = false;
        console.log('✅ MongoDB desconectado com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro ao desconectar MongoDB:', error.message);
      throw error;
    }
  }

  /**
   * Verificar status da conexão
   */
  getStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      readyStateText: states[mongoose.connection.readyState] || 'unknown',
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Health check do banco de dados
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return {
          status: 'unhealthy',
          error: 'Não conectado ao MongoDB',
          timestamp: new Date().toISOString()
        };
      }

      await mongoose.connection.db.admin().ping();

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        details: this.getStatus()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
        details: this.getStatus()
      };
    }
  }
}

module.exports = new Database();

const mongoose = require('mongoose');

class DatabaseConnection {
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
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxIdleTimeMS: 30000,
        heartbeatFrequencyMS: 10000,
        retryWrites: true,
        w: 'majority'
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
   * Configurar listeners de eventos
   */
  setupEventListeners() {
    mongoose.connection.on('connected', () => {
      console.log('📡 Mongoose conectado ao MongoDB');
      this.isConnected = true;
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Erro de conexão Mongoose:', err);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📡 Mongoose desconectado do MongoDB');
      this.isConnected = false;
    });

    process.on('SIGINT', () => {
      mongoose.connection.close(() => {
        console.log('📡 Conexão Mongoose fechada devido ao término da aplicação');
        process.exit(0);
      });
    });
  }

  /**
   * Desconectar do MongoDB
   */
  async disconnect() {
    try {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log('✅ Desconectado do MongoDB');
    } catch (error) {
      console.error('❌ Erro ao desconectar:', error);
      throw error;
    }
  }

  /**
   * Verificar status da conexão
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }
}

module.exports = DatabaseConnection;
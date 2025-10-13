require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Importar configurações
const Database = require('./src/database/connection');
const apiRoutes = require('./src/routes');
const { logging, errorHandler } = require('./src/middleware');

/**
 * Classe principal do servidor Express
 */
class AffiliateBot {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 5000;
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Configurar middlewares básicos
   */
  setupMiddlewares() {
    // Segurança
    this.app.use(helmet({
      contentSecurityPolicy: this.isProduction,
      crossOriginEmbedderPolicy: false
    }));

    // Compressão
    this.app.use(compression());

    // CORS
    const corsOptions = {
      origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:3001'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
      maxAge: 86400
    };
    this.app.use(cors(corsOptions));

    // Parse JSON e URL encoded
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging personalizado
    this.app.use(logging);
  }

  /**
   * Configurar rotas
   */
  setupRoutes() {
    // Rota raiz
    this.app.get('/', (req, res) => {
      res.json({
        message: '🤖 Affiliate Bot API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          api: '/api',
          health: '/api/health',
          docs: '/api/info'
        }
      });
    });

    // Rotas da API
    this.app.use('/api', apiRoutes);

    // Middleware para rotas não encontradas
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: `Rota ${req.method} ${req.originalUrl} não encontrada`,
        timestamp: new Date().toISOString()
      });
    });

    // Middleware de tratamento de erros (deve ser o último)
    this.app.use(errorHandler);
  }

  /**
   * Conectar ao banco de dados
   */
  async connectDatabase() {
    try {
      await Database.connect();
      console.log('✅ Conexão com banco estabelecida');
    } catch (error) {
      console.error('❌ Erro ao conectar com banco:', error.message);
      process.exit(1);
    }
  }

  /**
   * Iniciar servidor
   */
  async start() {
    try {
      // Verificar variáveis de ambiente obrigatórias
      this.checkRequiredEnvVars();

      // Conectar ao banco
      await this.connectDatabase();

      // Configurar middlewares e rotas
      this.setupMiddlewares();
      this.setupRoutes();

      // Iniciar servidor
      const server = this.app.listen(this.port, () => {
        console.log('🚀 Servidor iniciado com sucesso!');
        console.log(`📡 Porta: ${this.port}`);
        console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📊 API: http://localhost:${this.port}/api`);
        console.log(`❤️  Health: http://localhost:${this.port}/api/health`);
        console.log('\n✨ Affiliate Bot está rodando!\n');
      });

      // Graceful shutdown
      process.on('SIGTERM', () => {
        console.log('\n🔄 Recebido SIGTERM, encerrando servidor...');
        server.close(() => {
          console.log('✅ Servidor HTTP encerrado');
        });
      });

      process.on('SIGINT', () => {
        console.log('\n🔄 Recebido SIGINT (Ctrl+C), encerrando servidor...');
        server.close(() => {
          console.log('✅ Servidor HTTP encerrado');
        });
      });

      return server;

    } catch (error) {
      console.error('❌ Erro ao iniciar servidor:', error.message);
      process.exit(1);
    }
  }

  /**
   * Verificar variáveis de ambiente obrigatórias
   */
  checkRequiredEnvVars() {
    const required = [
      'MONGODB_URI',
      'JWT_SECRET'
    ];

    const missing = required.filter(envVar => !process.env[envVar]);

    if (missing.length > 0) {
      console.error('❌ Variáveis de ambiente obrigatórias não definidas:');
      missing.forEach(envVar => {
        console.error(`   - ${envVar}`);
      });
      console.error('\n💡 Crie um arquivo .env na raiz do projeto com essas variáveis');
      process.exit(1);
    }

    console.log('✅ Variáveis de ambiente verificadas');
  }
}

// Iniciar aplicação
if (require.main === module) {
  const bot = new AffiliateBot();
  bot.start();
}

module.exports = AffiliateBot;

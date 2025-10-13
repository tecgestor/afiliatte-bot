const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
require('dotenv').config();

const DatabaseConnection = require('./src/database/connection');
const routes = require('./src/routes');
const { errorHandler, logging } = require('./src/middleware');
const AffiliateRobotService = require('./src/services/AffiliateRobotService');

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 5000;
    this.database = new DatabaseConnection();
    this.robotService = new AffiliateRobotService();

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.scheduleTasks();
  }

  // Middlewares
  initializeMiddlewares() {
    // CORS configuração
    const corsOptions = {
      origin: [
        process.env.FRONTEND_URL,
        'https://afiliatte-bot.vercel.app',
        'http://localhost:3000',
        'http://localhost:3001'
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With', 
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control'
      ],
      credentials: true,
      optionsSuccessStatus: 200,
      maxAge: 86400
    };

    this.app.use(cors(corsOptions));

    // Headers manuais para garantir CORS
    this.app.use((req, res, next) => {
      const origin = req.headers.origin;
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'https://afiliatte-bot.vercel.app',
        'http://localhost:3000'
      ];

      if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }

      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.setHeader('Access-Control-Max-Age', '86400');

      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }

      next();
    });

    // Segurança
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false
    }));

    // Compressão
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // máximo 100 requests por IP
      message: 'Muitas requisições, tente novamente em alguns minutos',
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use('/api', limiter);

    // Body parsers
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    this.app.use(logging);
  }

  // Rotas
  initializeRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '2.0.0'
      });
    });

    // API routes
    this.app.use('/api', routes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Rota não encontrada',
        path: req.originalUrl
      });
    });
  }

  // Error handling
  initializeErrorHandling() {
    this.app.use(errorHandler);
  }

  // Tarefas agendadas
  scheduleTasks() {
    // Executar robô diariamente às 09:00
    cron.schedule('0 9 * * *', async () => {
      console.log('🤖 Executando robô automaticamente...');
      try {
        await this.robotService.run({
          categories: ['electronics', 'beauty', 'home'],
          platforms: ['mercadolivre', 'shopee'],
          scrapingLimit: 30
        });
      } catch (error) {
        console.error('❌ Erro na execução automática:', error);
      }
    });

    // Limpeza de logs antigos - todo domingo às 02:00
    cron.schedule('0 2 * * 0', async () => {
      console.log('🧹 Limpando logs antigos...');
      // Implementar limpeza de logs
    });
  }

  // Verificar variáveis de ambiente
  checkEnvironmentVariables() {
    const required = [
      'MONGODB_URI',
      'JWT_SECRET'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      console.error('❌ Variáveis de ambiente obrigatórias não definidas:');
      missing.forEach(key => console.error(` - ${key}`));
      process.exit(1);
    }

    console.log('✅ Variáveis de ambiente verificadas');
  }

  // Iniciar servidor
  async start() {
    try {
      // Verificar variáveis
      this.checkEnvironmentVariables();

      // Conectar ao banco
      await this.database.connect();

      // Iniciar servidor
      this.app.listen(this.port, () => {
        console.log('🚀 Servidor iniciado com sucesso!');
        console.log(`📡 Rodando na porta: ${this.port}`);
        console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🕐 Horário: ${new Date().toLocaleString('pt-BR')}`);
      });

    } catch (error) {
      console.error('❌ Erro ao iniciar servidor:', error);
      process.exit(1);
    }
  }
}

// Inicializar servidor
const server = new Server();
server.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Recebido SIGTERM, fechando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Recebido SIGINT, fechando servidor...');
  process.exit(0);
});

module.exports = server;
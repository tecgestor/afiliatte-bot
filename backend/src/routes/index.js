const express = require('express');
const router = express.Router();

// Middleware de autenticação básico
const auth = (req, res, next) => {
  // Por simplicidade, aceitar qualquer token por enquanto
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    req.user = { id: '1', role: 'admin' };
  }
  next();
};

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Auth routes
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (email === 'admin@affiliatebot.com' && password === 'admin123') {
    const token = 'fake-jwt-token-' + Date.now();
    const user = {
      id: '1',
      name: 'Administrador',
      email: 'admin@affiliatebot.com',
      role: 'admin'
    };

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: { user, token }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Credenciais inválidas'
    });
  }
});

// Protected routes que retornam dados mockados
router.use('/products', auth, (req, res) => {
  res.json({
    success: true,
    data: {
      docs: [
        {
          _id: '1',
          title: 'Smartphone Samsung Galaxy S24',
          price: 2499.99,
          platform: 'mercadolivre',
          category: 'electronics',
          isApproved: true,
          commissionQuality: 'excelente',
          rating: 4.8,
          imageUrl: 'https://via.placeholder.com/300x300'
        }
      ],
      totalDocs: 1,
      limit: 10,
      page: 1,
      totalPages: 1
    }
  });
});

router.use('/robot', auth, (req, res) => {
  if (req.method === 'GET') {
    res.json({
      success: true,
      data: {
        isRunning: false,
        lastExecution: {
          stats: {
            productsScraped: 25,
            messagesSent: 8
          }
        }
      }
    });
  } else if (req.method === 'POST') {
    setTimeout(() => {
      res.json({
        success: true,
        message: 'Robô executado com sucesso',
        data: {
          productsScraped: 30,
          messagesSent: 12
        }
      });
    }, 2000);
  }
});

// Catch all para outras rotas
router.use('*', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando',
    data: { available: true }
  });
});

module.exports = router;
/**
 * Middleware para verificar se usuário é admin
 */
const adminOnly = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Acesso não autorizado'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso restrito a administradores'
      });
    }

    next();
  } catch (error) {
    console.error('Erro no middleware adminOnly:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno no servidor'
    });
  }
};

module.exports = adminOnly;

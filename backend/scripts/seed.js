const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { User, Product } = require('../src/models');

class DatabaseSeeder {
  async run() {
    try {
      console.log('🌱 Iniciando seed do banco de dados...');

      // Conectar ao banco
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Conectado ao MongoDB');

      // Limpar dados existentes
      await User.deleteMany({});
      await Product.deleteMany({});
      console.log('🧹 Dados existentes removidos');

      // Criar usuários
      await this.createUsers();

      // Criar produtos de exemplo
      await this.createProducts();

      console.log('✅ Seed concluído com sucesso!');
      console.log('👤 Login: admin@affiliatebot.com / admin123');

    } catch (error) {
      console.error('❌ Erro no seed:', error);
    } finally {
      await mongoose.disconnect();
    }
  }

  async createUsers() {
    const adminPassword = await bcrypt.hash('admin123', 12);
    const userPassword = await bcrypt.hash('user123', 12);

    const users = [
      {
        name: 'Administrador',
        email: 'admin@affiliatebot.com',
        password: adminPassword,
        role: 'admin'
      },
      {
        name: 'Usuário Teste',
        email: 'user@test.com',
        password: userPassword,
        role: 'user'
      }
    ];

    await User.insertMany(users);
    console.log('👤 Usuários criados');
  }

  async createProducts() {
    const products = [
      {
        title: 'Smartphone Samsung Galaxy S24 Ultra 256GB',
        description: 'Smartphone top de linha com câmera profissional',
        price: 4299.99,
        originalPrice: 4999.99,
        category: 'electronics',
        platform: 'mercadolivre',
        productUrl: 'https://produto.mercadolivre.com.br/MLB-123',
        affiliateLink: 'https://produto.mercadolivre.com.br/MLB-123?ref=aff',
        rating: 4.8,
        reviewsCount: 1250,
        salesCount: 850,
        estimatedCommission: 215.00,
        commissionRate: 5.0,
        commissionQuality: 'excelente',
        isApproved: true
      },
      {
        title: 'Perfume Importado Feminino 100ml',
        description: 'Perfume importado de alta qualidade',
        price: 299.99,
        originalPrice: 399.99,
        category: 'beauty',
        platform: 'shopee',
        productUrl: 'https://shopee.com.br/produto-123',
        affiliateLink: 'https://shopee.com.br/produto-123?aff=1',
        rating: 4.5,
        reviewsCount: 320,
        salesCount: 180,
        estimatedCommission: 45.00,
        commissionRate: 15.0,
        commissionQuality: 'excelente',
        isApproved: false
      }
    ];

    await Product.insertMany(products);
    console.log('📦 Produtos criados');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const seeder = new DatabaseSeeder();
  seeder.run();
}

module.exports = DatabaseSeeder;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Schemas simples inline
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  title: String,
  price: Number,
  originalPrice: Number,
  category: String,
  platform: String,
  productUrl: String,
  affiliateLink: String,
  rating: Number,
  reviewsCount: Number,
  salesCount: Number,
  estimatedCommission: Number,
  commissionRate: Number,
  commissionQuality: String,
  isApproved: { type: Boolean, default: false },
  scrapedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);

class DatabaseSeeder {
  async run() {
    try {
      console.log('🌱 Iniciando seed do banco de dados...');

      if (!process.env.MONGODB_URI) {
        console.log('⚠️ MONGODB_URI não configurada');
        return;
      }

      // Conectar ao banco
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Conectado ao MongoDB');

      // Verificar se já existem usuários
      const existingUsers = await User.countDocuments();
      if (existingUsers > 0) {
        console.log('ℹ️ Usuários já existem, pulando seed');
        return;
      }

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
    try {
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
    } catch (error) {
      console.error('❌ Erro ao criar usuários:', error);
    }
  }

  async createProducts() {
    try {
      const products = [
        {
          title: 'Smartphone Samsung Galaxy S24 Ultra 256GB',
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
          title: 'iPhone 15 Pro Max 512GB',
          price: 7999.99,
          originalPrice: 8999.99,
          category: 'electronics',
          platform: 'mercadolivre',
          productUrl: 'https://produto.mercadolivre.com.br/MLB-456',
          affiliateLink: 'https://produto.mercadolivre.com.br/MLB-456?ref=aff',
          rating: 4.9,
          reviewsCount: 890,
          salesCount: 432,
          estimatedCommission: 400.00,
          commissionRate: 5.0,
          commissionQuality: 'excelente',
          isApproved: false
        }
      ];

      await Product.insertMany(products);
      console.log('📦 Produtos criados');
    } catch (error) {
      console.error('❌ Erro ao criar produtos:', error);
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const seeder = new DatabaseSeeder();
  seeder.run();
}

module.exports = DatabaseSeeder;

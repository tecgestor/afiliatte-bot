require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Importar models
const { Product, Group, MessageTemplate, User } = require('../src/models');

/**
 * Script para popular o banco de dados com dados iniciais
 */
class DatabaseSeeder {
  constructor() {
    this.mongoUri = process.env.MONGODB_URI;
  }

  /**
   * Conectar ao banco de dados
   */
  async connect() {
    try {
      await mongoose.connect(this.mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('✅ Conectado ao MongoDB');
    } catch (error) {
      console.error('❌ Erro ao conectar MongoDB:', error.message);
      process.exit(1);
    }
  }

  /**
   * Desconectar do banco de dados
   */
  async disconnect() {
    await mongoose.disconnect();
    console.log('✅ Desconectado do MongoDB');
  }

  /**
   * Limpar coleções existentes
   */
  async clearCollections() {
    try {
      await User.deleteMany({});
      await Product.deleteMany({});
      await Group.deleteMany({});
      await MessageTemplate.deleteMany({});
      console.log('🧹 Coleções limpas');
    } catch (error) {
      console.error('❌ Erro ao limpar coleções:', error.message);
    }
  }

  /**
   * Criar usuários iniciais
   */
  async seedUsers() {
    try {
      const users = [
        {
          name: 'Administrador',
          email: 'admin@affiliatebot.com',
          password: 'admin123',
          role: 'admin'
        },
        {
          name: 'Usuário Teste',
          email: 'user@test.com',
          password: 'user123',
          role: 'user'
        }
      ];

      for (const userData of users) {
        const hashedPassword = await bcrypt.hash(userData.password, 12);

        await User.create({
          ...userData,
          password: hashedPassword
        });
      }

      console.log('👤 Usuários criados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao criar usuários:', error.message);
    }
  }

  /**
   * Criar produtos de exemplo
   */
  async seedProducts() {
    try {
      const products = [
        {
          platformId: 'MLB123456789',
          platform: 'mercadolivre',
          title: 'Smartphone Samsung Galaxy A54 5G 128GB Violeta',
          description: 'Smartphone com tela de 6.4", câmera tripla de 50MP e bateria de 5000mAh',
          category: 'electronics',
          price: 1299.00,
          originalPrice: 1699.00,
          commissionRate: 0.12,
          estimatedCommission: 155.88,
          commissionQuality: 'excelente',
          rating: 4.5,
          reviewsCount: 1250,
          salesCount: 850,
          productUrl: 'https://produto.mercadolivre.com.br/MLB-123456789',
          affiliateLink: 'https://produto.mercadolivre.com.br/MLB-123456789?mshops=SECML_AFFILIATE_12345',
          imageUrl: 'https://http2.mlstatic.com/D_NQ_NP_2X_123456-MLA123456789_123456-F.webp',
          seller: {
            name: 'Samsung Oficial',
            rating: 4.8,
            isVerified: true
          },
          isApproved: true,
          approvedAt: new Date()
        },
        {
          platformId: 'SH987654321',
          platform: 'shopee',
          title: 'Kit Skincare Vitamina C + Ácido Hialurônico Anti-Idade',
          description: 'Kit completo para cuidados com a pele com vitamina C e ácido hialurônico',
          category: 'beauty',
          price: 89.99,
          originalPrice: 149.99,
          commissionRate: 0.15,
          estimatedCommission: 13.50,
          commissionQuality: 'regular',
          rating: 4.7,
          reviewsCount: 2030,
          salesCount: 1200,
          productUrl: 'https://shopee.com.br/kit-skincare-vitamina-c',
          affiliateLink: 'https://shopee.com.br/kit-skincare-vitamina-c?aff_sid=SHOPEE_AFF_67890',
          imageUrl: 'https://cf.shopee.com.br/file/placeholder_skincare',
          seller: {
            name: 'Beauty Store Official',
            rating: 4.6,
            isVerified: true
          },
          isApproved: true,
          approvedAt: new Date()
        },
        {
          platformId: 'MLB555444333',
          platform: 'mercadolivre',
          title: 'Conjunto Panelas Antiaderente 5 Peças Tramontina Paris',
          description: 'Conjunto de panelas com revestimento antiaderente e cabos ergonômicos',
          category: 'home',
          price: 189.99,
          originalPrice: 299.99,
          commissionRate: 0.14,
          estimatedCommission: 26.60,
          commissionQuality: 'boa',
          rating: 4.3,
          reviewsCount: 890,
          salesCount: 450,
          productUrl: 'https://produto.mercadolivre.com.br/MLB-555444333',
          affiliateLink: 'https://produto.mercadolivre.com.br/MLB-555444333?mshops=SECML_AFFILIATE_12345',
          imageUrl: 'https://http2.mlstatic.com/D_NQ_NP_2X_555444-MLA555444333_555444-F.webp',
          seller: {
            name: 'Tramontina Oficial',
            rating: 4.7,
            isVerified: true
          },
          isApproved: false
        },
        {
          platformId: 'SH111222333',
          platform: 'shopee',
          title: 'Fone Bluetooth TWS Sem Fio Cancelamento de Ruído Premium',
          description: 'Fone de ouvido bluetooth com cancelamento ativo de ruído e bateria de longa duração',
          category: 'electronics',
          price: 159.90,
          originalPrice: 299.90,
          commissionRate: 0.10,
          estimatedCommission: 15.99,
          commissionQuality: 'regular',
          rating: 4.4,
          reviewsCount: 1580,
          salesCount: 720,
          productUrl: 'https://shopee.com.br/fone-bluetooth-tws-premium',
          affiliateLink: 'https://shopee.com.br/fone-bluetooth-tws-premium?aff_sid=SHOPEE_AFF_67890',
          imageUrl: 'https://cf.shopee.com.br/file/placeholder_electronics',
          seller: {
            name: 'TechMax Store',
            rating: 4.5,
            isVerified: true
          },
          isApproved: true,
          approvedAt: new Date()
        }
      ];

      await Product.insertMany(products);
      console.log('📦 Produtos criados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao criar produtos:', error.message);
    }
  }

  /**
   * Criar grupos de exemplo
   */
  async seedGroups() {
    try {
      const groups = [
        {
          whatsappId: '120363041234567890@g.us',
          name: '🔥 Promoções Tech Imperdíveis',
          description: 'As melhores ofertas de eletrônicos e tecnologia com desconto',
          category: 'electronics',
          maxMessagesPerDay: 5,
          sendingEnabled: true,
          allowedHours: {
            start: 8,
            end: 22
          },
          membersCount: 1250,
          stats: {
            totalMessagesSent: 45,
            messagesSentToday: 2,
            avgEngagementRate: 0.08,
            totalClicks: 120,
            totalConversions: 8
          }
        },
        {
          whatsappId: '120363041234567891@g.us',
          name: '🏠 Casa & Decoração Ofertas',
          description: 'Produtos para casa, decoração e organização com preços especiais',
          category: 'home',
          maxMessagesPerDay: 4,
          sendingEnabled: true,
          allowedHours: {
            start: 9,
            end: 21
          },
          membersCount: 890,
          stats: {
            totalMessagesSent: 32,
            messagesSentToday: 1,
            avgEngagementRate: 0.06,
            totalClicks: 85,
            totalConversions: 5
          }
        },
        {
          whatsappId: '120363041234567892@g.us',
          name: '✨ Beleza & Cuidados Premium',
          description: 'Produtos de beleza, skincare e cuidados pessoais selecionados',
          category: 'beauty',
          maxMessagesPerDay: 3,
          sendingEnabled: false,
          allowedHours: {
            start: 10,
            end: 20
          },
          membersCount: 650,
          stats: {
            totalMessagesSent: 28,
            messagesSentToday: 0,
            avgEngagementRate: 0.12,
            totalClicks: 95,
            totalConversions: 12
          }
        }
      ];

      await Group.insertMany(groups);
      console.log('👥 Grupos criados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao criar grupos:', error.message);
    }
  }

  /**
   * Criar templates de exemplo
   */
  async seedMessageTemplates() {
    try {
      const templates = [
        {
          name: 'Template Eletrônicos',
          description: 'Template otimizado para produtos eletrônicos e tecnologia',
          category: 'electronics',
          template: `🔥 SUPER OFERTA TECH!

📱 {{title}}
💰 Por apenas {{price}}
⚡ Era {{originalPrice}} - Economia de {{discount}}!
⭐ {{rating}}/5 estrelas ({{reviewsCount}} avaliações)
🚚 Entrega rápida garantida

👆 COMPRAR AGORA: {{affiliateLink}}

#TechOfertas #{{platform}} #Desconto #Tecnologia`,
          availableVariables: [
            {
              name: 'title',
              description: 'Nome do produto',
              type: 'text',
              required: true
            },
            {
              name: 'price',
              description: 'Preço atual do produto',
              type: 'currency',
              required: true
            },
            {
              name: 'originalPrice',
              description: 'Preço original',
              type: 'currency',
              required: false
            },
            {
              name: 'discount',
              description: 'Valor do desconto',
              type: 'currency',
              required: false
            },
            {
              name: 'rating',
              description: 'Avaliação do produto',
              type: 'number',
              required: false
            },
            {
              name: 'reviewsCount',
              description: 'Número de avaliações',
              type: 'number',
              required: false
            },
            {
              name: 'affiliateLink',
              description: 'Link de afiliado',
              type: 'url',
              required: true
            },
            {
              name: 'platform',
              description: 'Plataforma do produto',
              type: 'text',
              required: true
            }
          ],
          isDefault: true
        },
        {
          name: 'Template Casa & Jardim',
          description: 'Template para produtos de casa, decoração e jardim',
          category: 'home',
          template: `🏠 OFERTA ESPECIAL CASA!

✨ {{title}}
💵 Apenas {{price}}
⭐ Avaliação: {{rating}}/5 estrelas
🚚 Entrega rápida para sua casa

Transform your home! 🏡

🛒 GARANTIR O SEU: {{affiliateLink}}

#CasaEJardim #Decoração #{{platform}} #Oferta`,
          availableVariables: [
            {
              name: 'title',
              description: 'Nome do produto',
              type: 'text',
              required: true
            },
            {
              name: 'price',
              description: 'Preço do produto',
              type: 'currency',
              required: true
            },
            {
              name: 'rating',
              description: 'Avaliação do produto',
              type: 'number',
              required: false
            },
            {
              name: 'affiliateLink',
              description: 'Link de afiliado',
              type: 'url',
              required: true
            },
            {
              name: 'platform',
              description: 'Plataforma do produto',
              type: 'text',
              required: true
            }
          ],
          isDefault: true
        },
        {
          name: 'Template Beleza',
          description: 'Template especializado em produtos de beleza e cuidados',
          category: 'beauty',
          template: `💄 BELEZA EM PROMOÇÃO!

✨ {{title}}
💅 Por apenas {{price}}
⭐ {{rating}} estrelas | {{reviewsCount}} pessoas adoraram
💎 Resultado garantido ou seu dinheiro de volta!

Sua beleza merece o melhor! ✨

💄 COMPRAR AGORA: {{affiliateLink}}

#Beleza #Skincare #{{platform}} #Cuidados #Promoção`,
          availableVariables: [
            {
              name: 'title',
              description: 'Nome do produto',
              type: 'text',
              required: true
            },
            {
              name: 'price',
              description: 'Preço do produto',
              type: 'currency',
              required: true
            },
            {
              name: 'rating',
              description: 'Avaliação do produto',
              type: 'number',
              required: false
            },
            {
              name: 'reviewsCount',
              description: 'Número de avaliações',
              type: 'number',
              required: false
            },
            {
              name: 'affiliateLink',
              description: 'Link de afiliado',
              type: 'url',
              required: true
            },
            {
              name: 'platform',
              description: 'Plataforma do produto',
              type: 'text',
              required: true
            }
          ],
          isDefault: true
        }
      ];

      await MessageTemplate.insertMany(templates);
      console.log('💬 Templates criados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao criar templates:', error.message);
    }
  }

  /**
   * Executar seeding completo
   */
  async run() {
    try {
      console.log('🌱 Iniciando seeding do banco de dados...\n');

      await this.connect();
      await this.clearCollections();

      await this.seedUsers();
      await this.seedProducts();
      await this.seedGroups();
      await this.seedMessageTemplates();

      console.log('\n🎉 Seeding concluído com sucesso!');
      console.log('\n📋 Dados criados:');
      console.log('   👤 Usuários: 2');
      console.log('     - admin@affiliatebot.com / admin123 (Admin)');
      console.log('     - user@test.com / user123 (User)');
      console.log('   📦 Produtos: 4 (2 aprovados, 2 pendentes)');
      console.log('   👥 Grupos: 3 (2 ativos, 1 inativo)');
      console.log('   💬 Templates: 3 (por categoria)');

      console.log('\n🚀 Sistema pronto para usar!');
      console.log('   Frontend: http://localhost:3000');
      console.log('   Backend: http://localhost:5000/api');
      console.log('   Health: http://localhost:5000/api/health');
      console.log('\n📊 Login: admin@affiliatebot.com / admin123');

    } catch (error) {
      console.error('❌ Erro no seeding:', error.message);
      process.exit(1);
    } finally {
      await this.disconnect();
      process.exit(0);
    }
  }
}

// Executar seeding se chamado diretamente
if (require.main === module) {
  const seeder = new DatabaseSeeder();
  seeder.run();
}

module.exports = DatabaseSeeder;

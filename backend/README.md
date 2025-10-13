# 🤖 Affiliate Bot Backend

Backend completo do robô de afiliados automatizado com WhatsApp.

## 🚀 Funcionalidades

- **API RESTful** completa
- **Scraping automatizado** (ML + Shopee)
- **Gestão de produtos** com aprovação
- **Templates de mensagem** dinâmicos
- **Integração WhatsApp** (Evolution API)
- **Sistema de usuários** com roles
- **Histórico completo** de atividades
- **Configurações avançadas** do robô

## 📦 Tecnologias

- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **JWT** para autenticação
- **Bcrypt** para senhas
- **Puppeteer** para scraping
- **Winston** para logs
- **Joi** para validação

## 🚀 Instalação

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/affiliate-bot-backend.git
cd affiliate-bot-backend

# Instalar dependências
npm install

# Configurar variáveis
cp .env.example .env
```

## ⚙️ Configuração

Edite `.env`:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/affiliatebot
JWT_SECRET=sua-chave-secreta-de-32-caracteres-minimo
FRONTEND_URL=https://seu-frontend.vercel.app
```

## 🖥️ Scripts

```bash
# Desenvolvimento
npm run dev

# Produção
npm start

# Seed do banco
npm run seed

# Testes
npm test
```

## 🌐 Deploy

### Render (Gratuito)

1. **Conectar GitHub** ao Render
2. **Configurar variáveis** de ambiente
3. **Deploy automático**

## 📊 API Endpoints

```
POST /api/auth/login          # Login
GET  /api/products            # Listar produtos
POST /api/products            # Criar produto
GET  /api/robot/status        # Status do robô
POST /api/robot/run           # Executar robô
GET  /api/templates           # Listar templates
GET  /api/groups              # Listar grupos
GET  /api/history             # Histórico
```

## 🔐 Autenticação

- **JWT tokens** com expiração de 7 dias
- **Roles:** user, admin
- **Middleware** de autenticação automático

## 📄 Licença

MIT License
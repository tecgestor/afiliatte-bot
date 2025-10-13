# 🤖 Affiliate Bot Backend

Backend API para robô de afiliados com integração WhatsApp, scraping automatizado e sistema de comissões inteligente.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação segura
- **Joi** - Validação de dados
- **Axios** - Cliente HTTP
- **Bcrypt** - Hash de senhas

## 📁 Estrutura

```
src/
├── controllers/     # Controllers (OOP)
├── models/         # Models Mongoose
├── services/       # Serviços de negócio
├── routes/         # Rotas da API
├── middleware/     # Middlewares
├── database/       # Conexão banco
└── utils/          # Utilitários
```

## 🔧 Instalação

```bash
# Clonar repositório
git clone <url>
cd affiliate-bot-backend

# Instalar dependências
npm install

# Configurar variáveis
cp .env.example .env
# Edite o .env com suas configurações

# Executar seeding
npm run seed

# Iniciar desenvolvimento
npm run dev
```

## 🌍 Deploy

### Render.com (Gratuito)
1. Conectar repositório GitHub
2. Configurar variáveis de ambiente
3. Deploy automático

### Variáveis Obrigatórias
- `MONGODB_URI` - String conexão MongoDB
- `JWT_SECRET` - Chave JWT (32+ chars)
- `NODE_ENV` - production

## 📊 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login usuário
- `POST /api/auth/register` - Registrar usuário

### Produtos
- `GET /api/products` - Listar produtos
- `POST /api/products` - Criar produto
- `PATCH /api/products/:id/approve` - Aprovar produto

### Robô
- `GET /api/robot/status` - Status do robô
- `POST /api/robot/run` - Executar ciclo
- `POST /api/robot/scraping/run` - Scraping manual

## 🤖 Funcionalidades

### ✅ Scraping Automatizado
- Mercado Livre API
- Shopee (simulado)
- Filtros de qualidade
- Rate limiting inteligente

### ✅ Sistema de Comissões
- Cálculo automático
- Classificação por qualidade
- Aprovação manual

### ✅ WhatsApp Integration
- Evolution API
- Envio com retry
- Templates personalizáveis

### ✅ Segurança
- JWT Authentication
- Rate limiting
- Validação Joi
- Middleware de segurança

## 🔒 Autenticação

```javascript
// Headers necessários
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

## 📈 Monitoramento

- Health check: `/api/health`
- Status robô: `/api/robot/status`
- Logs estruturados
- Error handling robusto

## 🧪 Testes

```bash
npm test
```

## 📝 Licença

MIT License - veja LICENSE para detalhes.

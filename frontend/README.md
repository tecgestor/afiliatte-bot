# 🤖 Affiliate Bot Frontend

Interface web para o robô de afiliados automatizado com WhatsApp.

## 🚀 Tecnologias

- **Next.js 13** - Framework React
- **React 18** - Biblioteca UI
- **Tailwind CSS** - Framework CSS utilitário
- **React Query** - Estado de servidor
- **React Hook Form** - Formulários
- **Headless UI** - Componentes acessíveis
- **Heroicons** - Ícones
- **Axios** - Cliente HTTP

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
```

## ⚙️ Configuração

Edite o arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=Affiliate Bot
```

## 🖥️ Scripts

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Servidor de produção
npm start

# Lint
npm run lint
```

## 🌐 Deploy

### Vercel (Recomendado)

1. **Conectar repositório GitHub**
2. **Configurar variáveis de ambiente:**
   - `NEXT_PUBLIC_API_URL`: URL do backend
   - `NEXT_PUBLIC_APP_NAME`: Nome da aplicação

3. **Deploy automático**

### Manual

```bash
# Build
npm run build

# Start
npm start
```

## 📁 Estrutura

```
src/
├── components/
│   ├── Layout/         # Layout principal
│   ├── UI/            # Componentes reutilizáveis
│   └── Forms/         # Formulários
├── pages/             # Páginas Next.js
├── hooks/             # React Hooks customizados
├── services/          # API e autenticação
├── utils/             # Utilitários
└── styles/            # Estilos globais
```

## 🔐 Autenticação

O sistema usa JWT tokens com:
- Cookies seguros para tokens
- LocalStorage para dados do usuário
- Refresh automático
- Logout automático em caso de token inválido

## 📊 Funcionalidades

### ✅ Implementadas
- Dashboard com métricas
- Gestão de produtos
- Controle do robô
- Sistema de login/logout
- Interface responsiva

### 🚧 Em Desenvolvimento
- Gestão de grupos WhatsApp
- Editor de templates
- Histórico detalhado
- Configurações avançadas

## 🎨 Design System

O projeto usa Tailwind CSS com:
- Paleta de cores personalizada
- Componentes reutilizáveis
- Sistema de tipografia
- Utilities customizados

## 🔧 Desenvolvimento

### Variáveis de Ambiente

```env
# Obrigatórias
NEXT_PUBLIC_API_URL=       # URL da API backend

# Opcionais
NEXT_PUBLIC_APP_NAME=      # Nome da aplicação
NEXT_PUBLIC_APP_VERSION=   # Versão da aplicação
```

### Hooks Customizados

- `useAuth` - Gerenciar autenticação
- `useApi` - Fazer requisições HTTP
- `useApiQuery` - Queries com React Query
- `useApiMutation` - Mutations com React Query

## 📱 Responsividade

- Mobile-first design
- Breakpoints: sm, md, lg, xl
- Menu lateral retrátil
- Interface adaptativa

## 🚀 Performance

- Code splitting automático
- Lazy loading de componentes
- Otimizações de imagem
- Cache inteligente com React Query

## 📄 Licença

MIT License - veja LICENSE para detalhes.

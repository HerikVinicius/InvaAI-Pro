# 🚀 InvaAI Pro - Setup & Installation Guide

**InvaAI Pro** é uma aplicação MERN (MongoDB, Express, React, Node.js) full-stack para gerenciamento de PDV, inventário e vendas com suporte a múltiplos tenants.

---

## 📋 Pré-requisitos

- **Node.js** 18+ ([download](https://nodejs.org/))
- **MongoDB Atlas** (conta gratuita em [mongodb.com](https://www.mongodb.com/cloud/atlas))
- **npm** ou **yarn**
- **Git**

---

## 🔧 Configuração Rápida

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/ProjetoSaas.git
cd ProjetoSaas
```

### 2. Configure variáveis de ambiente

**Backend (.env na raiz)**:
```bash
cp .env.example .env
```

Edite `.env` com suas credenciais:

```env
# MongoDB Atlas (obrigatório)
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/?appName=MyApp

# JWT Secret (gere com: openssl rand -hex 64)
JWT_SECRET=seu-token-super-secreto-aqui

# Node environment
NODE_ENV=development
PORT=5000

# Anthropic API Key (opcional, para AI Insights)
ANTHROPIC_API_KEY=sk-sua-chave-aqui
```

**Frontend (.env no frontend)**:
```bash
cp frontend/.env.example frontend/.env
```

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Instale dependências

```bash
# Backend
npm install

# Frontend
cd frontend
npm install
cd ..
```

### 4. Inicie o projeto

**Terminal 1 - Backend**:
```bash
npm start
# Servidor rodando em http://localhost:5000
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
# Aplicação rodando em http://localhost:5173
```

---

## 📦 Estrutura do Projeto

```
ProjetoSaas/
├── src/                          # Backend Node.js/Express
│   ├── controllers/              # Lógica de negócio
│   ├── models/                   # Schemas MongoDB
│   ├── routes/                   # Endpoints da API
│   ├── middlewares/              # Auth, validação, etc
│   ├── utils/                    # Helpers e utilitários
│   └── server.js                 # Entry point
│
├── frontend/                     # Frontend React/Vite
│   ├── src/
│   │   ├── components/           # Componentes React
│   │   ├── hooks/                # Custom hooks
│   │   ├── pages/                # Páginas
│   │   ├── services/             # Chamadas API
│   │   └── main.jsx              # Entry point
│   ├── .env.example              # Template env
│   └── vite.config.js            # Config Vite
│
├── .env.example                  # Template env (raiz)
├── .gitignore                    # Git ignore rules
├── docker-compose.yml            # Docker orchestration
├── SECURITY.md                   # Security audit
└── README.md                     # Este arquivo
```

---

## 🔑 Gerando Credenciais Seguras

### JWT Secret
```bash
# macOS/Linux
openssl rand -hex 64

# Windows (PowerShell)
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
```

### MongoDB Atlas
1. Crie uma conta em [mongodb.com](https://www.mongodb.com/cloud/atlas)
2. Crie um cluster (free tier disponível)
3. Crie um usuário de banco de dados
4. Copie a connection string: `mongodb+srv://user:pass@cluster.mongodb.net/?appName=MyApp`

### Anthropic API Key
1. Acesse [console.anthropic.com](https://console.anthropic.com/)
2. Crie uma API key na seção "API Keys"
3. Copie e salve em `.env`

---

## 🐳 Deploy com Docker

```bash
# Build e inicie
docker-compose up -d

# Frontend: http://localhost
# Backend: http://localhost:5000
# MongoDB: localhost:27017
```

Veja `DOCKER_SETUP.md` para configuração detalhada.

---

## 📚 Documentação

- **[SECURITY.md](SECURITY.md)** - Auditoria de segurança e boas práticas
- **[DOCKER_SETUP.md](DOCKER_SETUP.md)** - Guia completo Docker
- **[DOCKER_CHEATSHEET.md](DOCKER_CHEATSHEET.md)** - Comandos Docker úteis

---

## 🚀 Features

- ✅ Sistema PDV (Point of Sale) completo
- ✅ Gerenciamento de inventário em tempo real
- ✅ Suporte multi-tenant (múltiplas lojas)
- ✅ Controle de usuários e permissões
- ✅ Rastreamento de vendas
- ✅ IA insights com Claude (Anthropic)
- ✅ Relatórios e dashboards
- ✅ Docker ready
- ✅ Production-grade error handling

---

## 🤝 Contribuindo

1. Crie uma branch: `git checkout -b feature/sua-feature`
2. Commit suas mudanças: `git commit -m "Add: sua feature"`
3. Push: `git push origin feature/sua-feature`
4. Abra um Pull Request

---

## 📝 Licença

MIT License - veja LICENSE.md para detalhes

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique [SECURITY.md](SECURITY.md)
2. Veja logs: `docker-compose logs -f`
3. Abra uma issue no GitHub

---

**Feito com ❤️ usando Node.js, React e MongoDB**


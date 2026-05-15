# ProjetoSaas - Gestão de Vendas e Estoque

Sistema SaaS multi-tenant para gestão de vendas, estoque, clientes e financeiro. Desenvolvido em Node.js + Express (backend) e React + Vite (frontend).

## 🚀 Stack Tecnológico

**Backend**:
- Node.js + Express
- MongoDB (Mongoose)
- JWT para autenticação
- Multi-tenant com isolamento de dados por tenant

**Frontend**:
- React 18 + Vite
- React Router para navegação
- Axios para requisições HTTP
- Tailwind CSS para estilização
- React Hot Toast para notificações
- Lucide React para ícones

## 📁 Estrutura do Projeto

```
ProjetoSaas/
├── src/                      # Backend (Node.js)
│   ├── models/              # Schemas MongoDB
│   ├── controllers/         # Lógica de requisição
│   ├── routes/              # Definição de endpoints
│   ├── middlewares/         # Auth, validação, etc
│   ├── services/            # Lógica de negócio
│   └── server.js            # Inicialização
├── frontend/                # Frontend (React)
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API clients
│   │   ├── utils/           # Utilitários
│   │   ├── store/           # Zustand stores
│   │   └── App.jsx          # Componente root
│   ├── index.html           # HTML template
│   └── vite.config.js       # Configuração Vite
├── package.json             # Dependências backend
└── README.md               # Este arquivo
```

## ⚙️ Setup & Instalação

### Pré-requisitos
- Node.js v16+ e npm
- MongoDB local ou remoto

### Backend

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# Iniciar servidor (desenvolvimento)
npm run dev

# Iniciar servidor (produção)
npm start
```

O backend roda em `http://localhost:3000`

### Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Editar .env com URL do backend (padrão: http://localhost:3000)

# Iniciar dev server
npm run dev

# Build para produção
npm run build
```

O frontend roda em `http://localhost:5173`

## 🔐 Autenticação

Sistema de autenticação JWT com roles:
- **master** - Acesso completo a todos os tenants
- **admin** - Administrador do tenant
- **lojista** - Proprietário da loja
- **gerente** - Gerente (acesso a relatórios)
- **vendedor** - Vendedor (PDV e vendas)

## 📚 Funcionalidades Principais

### Gestão de Usuários
- CRUD de usuários com roles
- Controle de permissões
- Reset de senha
- Toggle de features (AI Chat)

### PDV (Ponto de Venda)
- Busca de produtos em tempo real
- Carrinho de compras com desconto
- Desconto global (% ou R$)
- Registro de vendas
- Recibo/comprovante

### Estoque
- Cadastro e edição de produtos
- Desconto padrão por produto (% ou R$)
- Alerta de estoque baixo
- Log de movimentações
- Importação em massa (PDF, XLSX, TXT)

### Gestão de Clientes
- Cadastro de clientes
- Controle de saldo devedor
- Histórico de vendas
- Pagamentos

### Relatórios & Dashboard
- Resumo de vendas
- Tendência de vendas
- Ranking de vendedores
- Breakdown de pagamentos
- AI Insights

### Financeiro
- Gestão de caixa (abrir/fechar)
- Transações (vendas, recebimentos, sangria)
- Conciliação

## 🛠️ Padrões de Código

### Error Handling
- ErrorBoundary para componentes
- Tratamento centralizado de erros de API
- Logs estruturados com contexto
- Retry automático para erros transitórios

### Hooks React
- `useFormSubmit` - Submissão de formulários
- `useAsyncOperation` - Operações assíncronas
- `useListData` - Fetch de dados paginados
- Custom hooks para cada seção (useUsersData, useInventoryData, etc)

### State Management
- Zustand para estado global (autenticação)
- Local state com useState/useReducer
- SWR para cache de dados

## 📖 Documentação

- `QUICK_START.md` - Guia rápido de setup
- `README_IMPORTACAO_NFE.md` - Importação de NFe
- `TEST_AI_INSIGHTS.md` - Testes de AI Insights

## 🚦 Build & Deploy

### Development
```bash
npm run dev
cd frontend && npm run dev
```

### Production Build
```bash
npm run build
cd frontend && npm run build
```

### Verificação
```bash
# Backend testa com npm test
npm test

# Frontend testa com npm run build (verifica TypeScript)
cd frontend && npm run build
```

## 📝 Variáveis de Ambiente

Backend (`.env`):
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/projeto_saas
JWT_SECRET=seu_secret_aqui
NODE_ENV=development
```

Frontend (`.env` em `frontend/`):
```
VITE_API_BASE_URL=http://localhost:3000
```

## 🔍 Resolução de Problemas

**Erro de conexão ao MongoDB**:
- Verificar se MongoDB está rodando
- Confirmar MONGODB_URI em .env

**Erro de CORS no frontend**:
- Verificar VITE_API_BASE_URL
- Confirmar que backend está rodando

**Build lento**:
- Limpar `node_modules` e reinstalar
- Usar `npm ci` em produção em vez de `npm install`

## 📞 Suporte

Para dúvidas ou issues, consulte a documentação de setup ou entre em contato com o time de desenvolvimento.

---

**Última atualização**: 15 de maio de 2026  
**Versão**: 1.0.0  
**Status**: Produção

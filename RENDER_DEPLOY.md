# 🚀 Guia de Deploy - Backend no Render

Seu projeto está configurado para fazer deploy **apenas do Backend** no Render.

---

## ⚙️ Configuração Criada

- **render.yaml** - Arquivo de configuração do Render
- **.renderignore** - Ignora Frontend, Docker Compose, e documentação
- **Dockerfile** - Multi-stage build otimizado (já existente)

---

## 📋 Pré-requisitos

1. ✅ Conta GitHub (já tem seu repositório)
2. ✅ MongoDB Atlas (banco de dados na nuvem)
3. ✅ Conta Render (https://render.com)

---

## 🔧 Passo 1: Configurar MongoDB Atlas

### 1.1 Criar Cluster no MongoDB Atlas

1. Acesse: https://www.mongodb.com/cloud/atlas
2. Faça login ou crie uma conta (gratuito)
3. Crie um novo projeto
4. Clique em "Create a Deployment" → "M0 Free"
5. Escolha a região mais próxima
6. Clique em "Create Deployment"

### 1.2 Criar Usuário de Banco de Dados

1. No painel MongoDB, vá para "Database Access"
2. Clique em "Add New Database User"
3. Preencha:
   - **Username**: escolha um (ex: `invaai_user`)
   - **Password**: gere uma senha forte
   - **Role**: `Atlas Admin` (ou `readWriteAnyDatabase`)
4. Clique em "Add User"

### 1.3 Obter Connection String

1. Vá para "Database" → "Clusters"
2. Clique em "Connect" no seu cluster
3. Selecione "Drivers"
4. Copie a connection string
5. Ela deve ser algo como:
```
mongodb+srv://invaai_user:SENHA@cluster.mongodb.net/?retryWrites=true&w=majority
```

**⚠️ IMPORTANTE**: Substitua `SENHA` pela senha que você criou!

---

## 🎯 Passo 2: Deploy no Render

### 2.1 Conectar Repositório

1. Acesse: https://render.com
2. Clique em "New +" → "Web Service"
3. Selecione "Build and deploy from a Git repository"
4. Conecte sua conta GitHub
5. Selecione o repositório `ProjetoSaas`
6. Clique em "Connect"

### 2.2 Configurar Build

Na página de configuração, preencha:

**Nome e Ambiente:**
- **Name**: `invaai-backend`
- **Environment**: `Node`
- **Region**: Escolha a mais próxima
- **Branch**: `main`

**Comandos:**
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Plano:**
- **Plan**: `Free` (ou pago se preferir)

### 2.3 Adicionar Variáveis de Ambiente

Clique em "Environment" e adicione:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://invaai_user:SENHA@cluster.mongodb.net/invaai_prod?retryWrites=true&w=majority
JWT_SECRET=seu-secret-aleatorio-aqui-gerado-com-openssl-rand-hex-64
ANTHROPIC_API_KEY=sk-sua-chave-do-anthropic
```

**Como gerar JWT_SECRET seguro:**

No PowerShell:
```powershell
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
```

Ou no terminal (Linux/Mac):
```bash
openssl rand -hex 64
```

### 2.4 Deploy

1. Clique em "Create Web Service"
2. Render fará o build (pode levar alguns minutos)
3. Quando terminar, você verá a URL de acesso

Exemplo: `https://invaai-backend.onrender.com`

---

## ✅ Verificar Deploy

Após o deploy, teste se está funcionando:

### 1. Health Check

```
curl https://seu-url-render.onrender.com/health
```

Deve retornar:
```json
{
  "status": "ok",
  "system": "InvaAI Pro",
  "timestamp": "2026-05-15T..."
}
```

### 2. Ver Logs

No dashboard do Render:
1. Clique em seu serviço
2. Vá para "Logs"
3. Procure por mensagens de erro

### 3. Testar Endpoints

```bash
# Login (criar usuário)
curl -X POST https://seu-url-render.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sua Loja",
    "username": "seu_usuario",
    "password": "senha_forte_aqui"
  }'
```

---

## 🌐 Conectar Frontend

Agora que o Backend está rodando, você precisa atualizar o Frontend para apontar para a URL do Render.

### No seu `frontend/.env` (ou `.env.local`):

```env
VITE_API_URL=https://seu-url-render.onrender.com/api
```

Exemplo real:
```env
VITE_API_URL=https://invaai-backend.onrender.com/api
```

---

## 🆘 Troubleshooting

### Erro: "Build failed"

**Causa**: Provavelmente faltam dependências
**Solução**: Verifique se `package.json` está na raiz

### Erro: "Service crash"

**Causa**: Variáveis de ambiente faltando
**Solução**: Confirme que `MONGODB_URI` e `JWT_SECRET` estão configuradas

### Erro: "Cannot connect to MongoDB"

**Causa**: Connection string incorreta ou IP não whitelisted
**Solução**: 
1. No MongoDB Atlas, vá para "Network Access"
2. Clique em "Add IP Address"
3. Selecione "Allow access from anywhere" (0.0.0.0/0)
4. Clique em "Confirm"

### Erro: "Service spinning down"

**Causa**: Free tier do Render dorme após 15 minutos de inatividade
**Solução**: Upgrade para plano pago ou use um serviço de "ping" (ex: UptimeRobot)

---

## 📊 Monitorar em Produção

### Usar UptimeRobot (Gratuito)

1. Acesse: https://uptimerobot.com
2. Crie uma conta
3. Clique em "Add New Monitor"
4. Preencha:
   - **Monitor Type**: HTTP(s)
   - **URL**: `https://seu-url-render.onrender.com/health`
   - **Monitoring Interval**: 5 minutos
5. Clique em "Create Monitor"

Isso vai fazer "ping" no seu serviço a cada 5 minutos, evitando que durma.

---

## 🔄 Fazer Deploy de Mudanças

Sempre que você fizer um push para GitHub:

1. Render detecta o push automaticamente
2. Faz um novo build
3. Reinicia o serviço

Para forçar um rebuild manual:
1. No dashboard do Render
2. Clique em seu serviço
3. Vá para "Deploys"
4. Clique em "Deploy latest commit"

---

## 📝 Resumo

✅ Backend rodando em: `https://seu-url-render.onrender.com`
✅ API disponível em: `https://seu-url-render.onrender.com/api`
✅ MongoDB Atlas configurado
✅ Variáveis de ambiente seguras

**Próxima ação**: Deploy do Frontend no Vercel (vejo o guia `VERCEL_DEPLOY.md`)

---

**Precisa de ajuda?** Consulte os logs do Render ou entre em contato!


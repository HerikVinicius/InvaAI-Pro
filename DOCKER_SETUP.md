# Docker Setup - InvaAI Pro

Guia completo para executar o projeto em containers Docker.

## 📋 Pré-requisitos

- **Docker**: v24.0+
- **Docker Compose**: v2.20+

### Instalação

**Windows**:
```bash
# Baixar Docker Desktop
# https://www.docker.com/products/docker-desktop

# Ou via Chocolatey
choco install docker-desktop
```

**macOS**:
```bash
# Via Homebrew
brew install docker docker-compose

# Ou baixar Docker Desktop
# https://www.docker.com/products/docker-desktop
```

**Linux (Ubuntu)**:
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Adicionar usuário ao grupo docker (para evitar sudo)
sudo usermod -aG docker $USER
```

---

## 🚀 Quick Start

### 1. Preparar arquivos

```bash
# Clone o projeto
cd ProjetoSaas

# Copie o arquivo de ambiente para Docker
cp .env.docker .env

# (Opcional) Customize .env com suas credenciais
```

### 2. Iniciar containers

```bash
# Build e start todos os serviços
docker-compose up -d

# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### 3. Acessar a aplicação

- **Frontend**: http://localhost:80 (ou http://localhost)
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017 (apenas local)

### 4. Parar containers

```bash
# Parar serviços (mantém dados)
docker-compose down

# Parar e remover volumes (remove dados)
docker-compose down -v
```

---

## 🛠️ Arquitetura

```
┌──────────────────────────────────────────────────────────┐
│                   Docker Network                         │
│              (invaai-network - bridge)                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────┐  ┌────────────────┐                │
│  │   Frontend     │  │    Backend     │  ┌────────────┐ │
│  │   (Nginx)      │  │   (Node.js)    │  │  MongoDB   │ │
│  │   :80          │  │   :5000        │  │  :27017    │ │
│  └────────────────┘  └────────────────┘  └────────────┘ │
│         │                   │                    │        │
│         └───────────────────┼────────────────────┘        │
│                    Communicação                          │
│                 via hostname interno                     │
│              (backend, mongodb)                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 📦 Serviços

### MongoDB

**Imagem**: `mongo:8.0-alpine`
**Porta**: 27017
**Volume**: `mongodb_data` (persistência)

**Variáveis**:
- `MONGO_USER`: admin
- `MONGO_PASSWORD`: admin
- `MONGO_INITDB_DATABASE`: invaai_prod

**Inicialização**:
- Script: `mongo-init.js`
- Cria coleções: users, products, sales, clients, caixa, tenants
- Cria índices para performance

### Backend

**Imagem**: Build local (Dockerfile)
**Porta**: 5000
**Volume**: `./src` (reload em desenvolvimento)

**Variáveis Importantes**:
- `MONGODB_URI`: Conexão com MongoDB
- `JWT_SECRET`: Chave para tokens JWT
- `NODE_ENV`: development ou production
- `ANTHROPIC_API_KEY`: API do Claude (opcional)

**Health Check**: `GET /health`

### Frontend

**Imagem**: Build local (frontend/Dockerfile)
**Porta**: 80
**Tecnologia**: Nginx (servir SPA)

**Features**:
- Gzip compression
- Cache de assets (1 ano para .js, .css, etc)
- SPA routing (todos requests → index.html)
- Proxy /api/ → backend:5000

**Health Check**: `GET /health`

---

## 🔧 Comandos Úteis

### Build

```bash
# Build todas as imagens
docker-compose build

# Build imagem específica
docker-compose build backend
docker-compose build frontend

# Build sem cache
docker-compose build --no-cache
```

### Logs

```bash
# Todos os logs
docker-compose logs

# Últimas 100 linhas
docker-compose logs --tail 100

# Em tempo real
docker-compose logs -f

# Logs de um serviço
docker-compose logs -f backend

# Logs com timestamps
docker-compose logs -t
```

### Containers

```bash
# Ver status dos containers
docker-compose ps

# Ver recursos (CPU, memória)
docker stats

# Entrar no container (shell)
docker-compose exec backend sh
docker-compose exec mongodb mongosh

# Reiniciar um serviço
docker-compose restart backend

# Recriar containers
docker-compose up -d --force-recreate
```

### Database

```bash
# Entrar no MongoDB
docker-compose exec mongodb mongosh

# Dentro do mongosh:
> use invaai_prod
> db.users.find()
> db.products.find()
> exit
```

### Cleanup

```bash
# Remove containers parados
docker container prune

# Remove imagens não utilizadas
docker image prune

# Remove volumes não utilizados
docker volume prune

# Remove tudo (containers, imagens, volumes)
docker system prune -a --volumes
```

---

## 🔐 Segurança

### Produção

1. **Mude TODAS as senhas em `.env`**:
```env
MONGO_USER=seu_usuario
MONGO_PASSWORD=senha_forte_aqui
JWT_SECRET=$(openssl rand -hex 32)
```

2. **Disable MongoDB auth em production** (ou use MongoDB Atlas)

3. **Use HTTPS** (adicionar Nginx reverse proxy com Let's Encrypt)

4. **Restringir portas** (não expor MongoDB em produção)

5. **Usar secrets do Docker** em lugar de .env (para Swarm/Kubernetes)

### Exemplo de env seguro

```bash
# Gerar JWT_SECRET seguro
openssl rand -hex 32

# Exemplo output
a3f5c9e2d1b6f4a8c2e9d5f3a1b6c8e2f5a3d9c1e4f8b2d6a9c3e7f1b5d9a2
```

---

## 📊 Volumes e Persistência

### Volumes

- `mongodb_data`: Dados do MongoDB (banco inteiro)
- `mongodb_config`: Configuração do MongoDB

### Backup

```bash
# Fazer dump do MongoDB
docker-compose exec mongodb mongodump --uri="mongodb://admin:admin@localhost:27017/invaai_prod?authSource=admin" --out=/backup

# Restaurar dump
docker-compose exec mongodb mongorestore --uri="mongodb://admin:admin@localhost:27017/invaai_prod?authSource=admin" /backup/invaai_prod
```

---

## 🚨 Troubleshooting

### MongoDB connection refused

```bash
# Verificar se MongoDB está saudável
docker-compose ps mongodb

# Ver logs
docker-compose logs mongodb

# Reiniciar
docker-compose restart mongodb
```

### Backend não consegue conectar ao MongoDB

1. Verificar `.env`:
```env
MONGODB_URI=mongodb://admin:admin@mongodb:27017/invaai_prod?authSource=admin
```

2. Verificar network:
```bash
docker network ls
docker inspect invaai-network
```

3. Testar conexão:
```bash
docker-compose exec backend ping mongodb
```

### Frontend não consegue conectar ao backend

1. Verificar `nginx-default.conf`:
```conf
proxy_pass http://backend:5000/;
```

2. Verificar VITE_API_BASE_URL no frontend

3. Testar conexão:
```bash
docker-compose exec frontend ping backend
```

### Porta já em uso

```bash
# Linux/Mac
lsof -i :80
lsof -i :5000

# Windows
netstat -ano | findstr :80
netstat -ano | findstr :5000

# Parar processo ou usar porta diferente em docker-compose
```

---

## 📈 Performance

### Otimizações Implementadas

1. **Multi-stage builds** - Reduz tamanho das imagens
2. **Alpine images** - Base mínima (mongoDB, Node, Nginx)
3. **npm ci** - Instalação mais rápida que npm install
4. **Health checks** - Garante serviços saudáveis
5. **Logging estruturado** - JSON-file com limite de tamanho

### Tamanhos de Imagem

- Backend: ~200-300 MB (com node_modules)
- Frontend: ~50-100 MB (com nginx)
- MongoDB: ~200 MB

### Limites de Recursos (Recomendado)

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '1'
          memory: 512M

  frontend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M

  mongodb:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

---

## 🚀 Deployment

### Docker Hub

```bash
# Build com tag
docker build -t seu-username/invaai-backend:1.0.0 .

# Push
docker push seu-username/invaai-backend:1.0.0

# Pull em outro servidor
docker pull seu-username/invaai-backend:1.0.0
```

### Docker Swarm

```bash
# Initialize Swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml invaai

# Ver services
docker service ls
docker service logs invaai_backend
```

### Kubernetes

```bash
# Converter docker-compose para Kubernetes
kompose convert -f docker-compose.yml

# Deploy
kubectl apply -f *.yaml
```

---

## 📝 Exemplo: docker-compose customizado para development

```yaml
# docker-compose.dev.yml
version: '3.9'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      NODE_ENV: development
    volumes:
      - ./src:/app/src
      - /app/node_modules
    command: npm run dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: development
    volumes:
      - ./frontend/src:/app/src
    command: npm run dev
    ports:
      - "5173:5173"

  mongodb:
    environment:
      MONGO_USER: dev
      MONGO_PASSWORD: dev
```

Uso:
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

---

## 📚 Links Úteis

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)
- [Nginx Docker Hub](https://hub.docker.com/_/nginx)
- [Node.js Docker Hub](https://hub.docker.com/_/node)

---

**Última atualização**: 15 de maio de 2026  
**Status**: ✅ Production Ready

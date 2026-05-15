# Docker Cheatsheet - InvaAI Pro

Referência rápida de comandos Docker e Docker Compose.

## 🚀 Quick Start (30 segundos)

```bash
# Windows
.\docker-start.ps1

# Linux/Mac
bash docker-start.sh

# Ou manualmente
docker-compose up -d
```

Acesse: http://localhost

---

## 📋 Comandos Essenciais

### Start/Stop

```bash
# Iniciar
docker-compose up -d

# Parar
docker-compose down

# Parar e remover volumes
docker-compose down -v

# Reiniciar
docker-compose restart
```

### Logs

```bash
# Todos os logs
docker-compose logs

# Em tempo real
docker-compose logs -f

# Serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# Últimas 50 linhas
docker-compose logs --tail 50
```

### Containers

```bash
# Ver status
docker-compose ps

# Entrar no container
docker-compose exec backend sh
docker-compose exec frontend sh
docker-compose exec mongodb mongosh

# Ver recursos
docker stats
```

### Build

```bash
# Build
docker-compose build

# Build sem cache
docker-compose build --no-cache

# Build serviço específico
docker-compose build backend
```

---

## 🔧 Development

### Hot Reload

Backend recarrega automaticamente quando você muda `src/`:

```bash
# O arquivo docker-compose.yml já tem volumes configurados
volumes:
  - ./src:/app/src
```

### Acessar MongoDB

```bash
# Entrar no container
docker-compose exec mongodb mongosh

# Dentro do mongosh
use invaai_prod
db.users.find()
db.products.find()
db.sales.count()
exit
```

### Recriar Containers

```bash
# Se tiver problemas, force recriação
docker-compose up -d --force-recreate

# Ou delete e recrie
docker-compose down
docker-compose up -d
```

---

## 🐛 Troubleshooting

### Verificar se está tudo OK

```bash
# Status geral
docker-compose ps

# Health checks
docker-compose exec backend sh -c 'curl http://localhost:5000/health'
docker-compose exec frontend wget http://localhost/health
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

### Limpar Tudo

```bash
# Remove containers, networks, volumes
docker-compose down -v

# Remove também imagens
docker-compose down -v --rmi all

# Remove tudo do Docker (cuidado!)
docker system prune -a --volumes
```

### Logs de Erro

```bash
# Ver erro específico
docker-compose logs backend 2>&1 | grep -i error

# Ver últimas linhas
docker-compose logs --tail 100 backend

# Salvar logs em arquivo
docker-compose logs backend > logs.txt
```

---

## 💾 Database

### Backup

```bash
# Fazer dump
docker-compose exec mongodb mongodump \
  --uri="mongodb://admin:admin@localhost:27017/invaai_prod?authSource=admin" \
  --out=/data/backup

# Restaurar
docker-compose exec mongodb mongorestore \
  --uri="mongodb://admin:admin@localhost:27017/invaai_prod?authSource=admin" \
  /data/backup/invaai_prod
```

### Reset Database

```bash
# Apagar dados (mantém estrutura)
docker-compose exec mongodb mongosh --eval "db.dropDatabase()"

# Reset completo (apaga tudo, recria)
docker-compose down -v
docker-compose up -d
```

---

## 🌐 Ports

| Serviço  | Porta | URL                      |
|----------|-------|--------------------------|
| Frontend | 80    | http://localhost         |
| Backend  | 5000  | http://localhost:5000    |
| MongoDB  | 27017 | localhost:27017          |

---

## 📊 Monitoramento

### Resource Usage

```bash
# Ver uso de CPU, memória, I/O
docker stats

# Saída:
# CONTAINER       CPU%   MEM USAGE / LIMIT     MEM%
# invaai-backend  2.5%   150MiB / 1GiB         15%
# invaai-frontend 0.1%   50MiB / 512MiB        10%
# invaai-mongodb  5.2%   800MiB / 2GiB         40%
```

### Disk Usage

```bash
# Ver espaço usado por Docker
docker system df

# Limpar espaço
docker system prune  # Containers e imagens parados
docker volume prune  # Volumes não utilizados
```

---

## 🔐 Environment Variables

Variaveis importante em `.env`:

```bash
NODE_ENV=production          # development ou production
MONGO_USER=admin             # Usuário MongoDB
MONGO_PASSWORD=admin         # Senha MongoDB
JWT_SECRET=seu-secret-aqui   # Chave para JWT
ANTHROPIC_API_KEY=           # API key do Claude (opcional)
```

---

## 📝 Configuração para Produção

### 1. Mudar senhas

```bash
# Gerar JWT_SECRET seguro
openssl rand -hex 32

# Gerar senha MongoDB
openssl rand -base64 32

# Atualizar .env
MONGO_PASSWORD=nova_senha_forte_aqui
JWT_SECRET=seu_hash_aleatorio_aqui
```

### 2. Usar variáveis secretas

Em produção, use Docker secrets:

```bash
# Criar secrets
echo "senha_super_secreta" | docker secret create mongo_password -
echo "jwt_secret_aleatorio" | docker secret create jwt_secret -

# Usar em docker-compose.yml
services:
  backend:
    secrets:
      - jwt_secret
    environment:
      JWT_SECRET_FILE: /run/secrets/jwt_secret
```

### 3. Desabilitar MongoDB auth local

Não exponha MongoDB para internet:

```yaml
mongodb:
  ports:
    # Remova esta linha para não expor
    # - "27017:27017"
```

---

## 🎯 Casos de Uso Comuns

### Desenvolver

```bash
docker-compose up -d
# Editar código em src/ e frontend/src/
# Mudanças recarregam automaticamente
docker-compose logs -f
```

### Testar

```bash
# Rodar um comando único
docker-compose exec backend npm test

# Entrar e explorar
docker-compose exec backend sh
npm test
exit
```

### Deploy para Staging

```bash
# Build com tag
docker build -t seu-registry/backend:v1.0.0 .
docker push seu-registry/backend:v1.0.0

# Pull e run
docker pull seu-registry/backend:v1.0.0
docker-compose pull
docker-compose up -d
```

### Debug

```bash
# Entrar no container e explorar
docker-compose exec backend sh
ps aux
env
curl http://backend:5000/health

# Ver arquivo
cat src/server.js

# Testar conexão
ping mongodb
curl http://mongodb:27017
```

---

## ⚡ Performance Tips

1. **Use `.dockerignore`** - Evita copiar arquivos desnecessários
2. **Multi-stage builds** - Reduz tamanho da imagem final
3. **Alpine images** - Mais leve que debian/ubuntu
4. **npm ci** - Mais rápido que npm install em CI/CD
5. **Health checks** - Garante serviços prontos antes de continuar

---

## 📚 Mais Informações

- `DOCKER_SETUP.md` - Guia completo
- `docker-compose.yml` - Configuração completa
- `Dockerfile` - Build backend
- `frontend/Dockerfile` - Build frontend

---

## 🆘 Quando algo dá errado

1. Verificar logs: `docker-compose logs -f`
2. Verificar saúde: `docker-compose ps`
3. Restart: `docker-compose restart`
4. Reset: `docker-compose down -v && docker-compose up -d`
5. Procurar erro: `docker-compose logs | grep -i error`

---

**Última atualização**: 15 de maio de 2026

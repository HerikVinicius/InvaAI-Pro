# Backend Dockerfile - Node.js + Express + MongoDB
# Multi-stage build para otimizar tamanho da imagem

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Instalar dumb-init para melhor gerenciamento de sinais
RUN apk add --no-cache dumb-init

# Copiar arquivos do builder
COPY --from=builder /app/node_modules ./node_modules

# Copiar código-fonte
COPY package*.json ./
COPY src ./src

# Criar diretório para logs (opcional)
RUN mkdir -p /app/logs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Usar dumb-init para passar sinais corretamente
ENTRYPOINT ["/sbin/dumb-init", "--"]

# Comando padrão
CMD ["npm", "start"]

# Metadata
LABEL maintainer="InvaAI Pro <dev@invaai.com>"
LABEL description="InvaAI Pro Backend - Multi-tenant Inventory System"
LABEL version="1.0.0"

# Expor porta
EXPOSE 5000

# Frontend Dockerfile - React + Vite + Nginx
# Multi-stage build para otimizar tamanho da imagem

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci

# Copiar código-fonte
COPY . .

# Build para produção
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# Copiar configuração nginx customizada
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-default.conf /etc/nginx/conf.d/default.conf

# Copiar arquivos buildados do stage anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Criar health endpoint
RUN echo "OK" > /usr/share/nginx/html/health

# Metadata
LABEL maintainer="InvaAI Pro <dev@invaai.com>"
LABEL description="InvaAI Pro Frontend - React SPA"
LABEL version="1.0.0"

# Expor porta
EXPOSE 80

# Comando padrão (nginx roda em foreground)
CMD ["nginx", "-g", "daemon off;"]

#!/bin/bash
# Script para iniciar o Docker Compose com verificações

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     InvaAI Pro - Docker Startup Script                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Por favor, instale o Docker."
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Por favor, instale o Docker Compose."
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker e Docker Compose encontrados"
echo ""

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado"
    echo "   Criando a partir de .env.docker..."
    cp .env.docker .env
    echo "✅ .env criado. Por favor, revise e customize se necessário."
fi

echo ""
echo "🔨 Building e iniciando containers..."
echo ""

# Build e start
docker-compose up -d --build

echo ""
echo "⏳ Aguardando serviços ficarem saudáveis..."
sleep 10

# Verificar saúde
echo ""
echo "📊 Status dos containers:"
docker-compose ps

echo ""
echo "✅ Startup completo!"
echo ""
echo "📋 URLs:"
echo "   Frontend:    http://localhost:80"
echo "   Backend API: http://localhost:5000"
echo "   MongoDB:     localhost:27017"
echo ""
echo "💡 Próximos passos:"
echo "   • Ver logs:              docker-compose logs -f"
echo "   • Parar serviços:        docker-compose down"
echo "   • Entrar no backend:     docker-compose exec backend sh"
echo "   • Entrar no MongoDB:     docker-compose exec mongodb mongosh"
echo ""

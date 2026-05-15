# Script para iniciar o Docker Compose no Windows PowerShell

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     InvaAI Pro - Docker Startup Script (Windows)          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar se Docker está instalado
try {
    docker --version | Out-Null
    Write-Host "✅ Docker encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não encontrado. Por favor, instale o Docker Desktop." -ForegroundColor Red
    Write-Host "   https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Verificar se Docker Compose está instalado
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose não encontrado." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Verificar se .env existe
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Arquivo .env não encontrado" -ForegroundColor Yellow
    Write-Host "   Criando a partir de .env.docker..." -ForegroundColor Yellow
    Copy-Item ".env.docker" ".env"
    Write-Host "✅ .env criado. Por favor, revise e customize se necessário." -ForegroundColor Green
}

Write-Host ""
Write-Host "🔨 Building e iniciando containers..." -ForegroundColor Yellow
Write-Host ""

# Build e start
docker-compose up -d --build

Write-Host ""
Write-Host "⏳ Aguardando serviços ficarem saudáveis..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar saúde
Write-Host ""
Write-Host "📊 Status dos containers:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "✅ Startup completo!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 URLs:" -ForegroundColor Cyan
Write-Host "   Frontend:    http://localhost:80" -ForegroundColor White
Write-Host "   Backend API: http://localhost:5000" -ForegroundColor White
Write-Host "   MongoDB:     localhost:27017" -ForegroundColor White
Write-Host ""
Write-Host "💡 Próximos passos:" -ForegroundColor Cyan
Write-Host "   • Ver logs:              docker-compose logs -f" -ForegroundColor White
Write-Host "   • Parar serviços:        docker-compose down" -ForegroundColor White
Write-Host "   • Entrar no backend:     docker-compose exec backend sh" -ForegroundColor White
Write-Host "   • Entrar no MongoDB:     docker-compose exec mongodb mongosh" -ForegroundColor White
Write-Host ""

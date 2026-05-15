#!/bin/bash
# Script para parar e limpar Docker Compose

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     InvaAI Pro - Docker Stop Script                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

read -p "Deseja parar os containers? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "⏹️  Parando containers..."
    docker-compose down
    echo "✅ Containers parados"
else
    echo "❌ Operação cancelada"
    exit 1
fi

read -p "Deseja remover volumes (isso vai deletar os dados do MongoDB)? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "🗑️  Removendo volumes..."
    docker-compose down -v
    echo "✅ Volumes removidos"
fi

echo ""
echo "✅ Cleanup completo!"

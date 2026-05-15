# Testing AI Insights Integration

## Quick Start Test

### 1. Setup
```bash
cd C:\Users\Herik Vinicius\Documents\ProjetoSaas

# Update .env com sua chave
# ANTHROPIC_API_KEY=sk-ant-xxxxx

# Install dependencies (if not already)
npm install

# Start server
npm run dev
```

### 2. Test com cURL (Terminal)

```bash
# Terminal / PowerShell
$token = "seu_jwt_token_aqui"
$body = @{
    message = "Oi! Como você pode me ajudar?"
} | ConvertTo-Json

Invoke-WebRequest `
  -Uri "http://localhost:5000/api/ai-insights/analyze" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
  } `
  -Body $body
```

### 3. Test via Browser

1. Acesse: http://localhost:3000
2. Login com suas credenciais
3. Navegue para "AI Insights"
4. Digite uma pergunta e envie
5. Veja a resposta em streaming

## Exemplos de Perguntas

### Categoria: Vendas
```
"Qual foi o total de vendas nos últimos 7 dias?"
"Quais foram os 3 produtos mais vendidos este mês?"
"Qual categoria teve melhor desempenho?"
"Mostre a tendência de vendas ao longo do tempo"
```

### Categoria: Estoque
```
"Quais produtos estão com estoque crítico?"
"Recomende produtos para restoque"
"Análise ABC do meu inventário"
"Quais itens não foram vendidos este mês?"
```

### Categoria: Lucratividade
```
"Qual é minha margem de lucro média?"
"Quais produtos têm maior margem?"
"Analise a saúde financeira do meu negócio"
"Recomende ajustes de preço"
```

### Categoria: Clientes
```
"Quem são meus top 5 clientes?"
"Qual é o ticket médio de compra?"
"Identifique padrões de comportamento de compra"
"Quais clientes estão inativos?"
```

## Response Format

### Success Flow
```
POST /api/ai-insights/analyze
  ↓ (200 OK)
Content-Type: text/event-stream

data: {"type":"text","content":"Olá"}
data: {"type":"text","content":", tudo bem?"}
data: {"type":"done","content":"Olá, tudo bem?"}
```

### Error Handling
```
POST /api/ai-insights/analyze
  ↓ (500 Internal Server Error)
{
  "error": "Failed to generate insights"
}
```

## Common Issues & Solutions

### Issue: "ANTHROPIC_API_KEY not set"
**Solution**: Adicione a chave no `.env` e reinicie o servidor
```bash
# Verificar
echo $env:ANTHROPIC_API_KEY
```

### Issue: Resposta truncada ou incompleta
**Solution**: Aumente `max_tokens` em `aiInsightsController.js`
```javascript
max_tokens: 2048, // de 1024
```

### Issue: CORS error ao fazer request
**Solution**: Verifique CORS em `src/server.js`
```javascript
app.use(cors({
  origin: '*', // ou especifique seu domínio
  credentials: true,
}));
```

### Issue: Token inválido/expirado
**Solution**: Faça login novamente para obter novo token
```bash
# O token fica em: localStorage.getItem('invaai_token')
```

## Performance Metrics

### Latency
- **Primeira palavra**: ~500ms (cold start)
- **Streaming**: ~50-100ms por chunk
- **Total por pergunta**: 2-5 segundos (média)

### Token Usage
- **Pergunta típica**: ~50-150 tokens
- **Resposta típica**: ~200-500 tokens
- **Custo**: ~$0.005-0.01 por pergunta

### Limits (Anthropic)
- **Max tokens per request**: 4,096 (Opus 4.7)
- **Max message size**: ~100KB
- **Rate limit**: Standard (varia por plano)

## Debug Mode

### Ativar logs detalhados
```javascript
// src/controllers/aiInsightsController.js
console.log('Request:', { message, tenantId });
console.log('Stream started');
stream.on('text', (text) => {
  console.log('Text chunk:', text.length, 'chars');
  // ...
});
```

### Monitorar eventos no frontend
```javascript
// Abra DevTools (F12) → Console
// Faça uma pergunta e veja os logs:
stream.on('text', (text) => {
  console.log('Received:', text);
});
```

## Integration Checklist

- [x] Backend routes criadas (`src/routes/aiInsightsRoutes.js`)
- [x] Controller implementado (`src/controllers/aiInsightsController.js`)
- [x] Frontend page atualizada (`frontend/src/pages/AIInsights.jsx`)
- [x] Autenticação middleware aplicado
- [x] Streaming SSE implementado
- [x] Error handling completo
- [x] UI responsiva
- [ ] TODO: Integração com dados reais do MongoDB
- [ ] TODO: Histórico persistido em DB
- [ ] TODO: Rate limiting por usuário
- [ ] TODO: Exportar respostas
- [ ] TODO: Temas de análise pré-configurados

## Cost Analysis

**Opus 4.7 Pricing:**
- Input: $5 / 1M tokens = $0.000005 / token
- Output: $25 / 1M tokens = $0.000025 / token

**Estimativa por pergunta:**
- Entrada: 100 tokens × $0.000005 = $0.0005
- Saída: 300 tokens × $0.000025 = $0.0075
- **Total: ~$0.008 por pergunta**

**Custos mensais (estimativas):**
- 100 perguntas/mês: ~$0.80
- 500 perguntas/mês: ~$4.00
- 1000 perguntas/mês: ~$8.00

Acompanhe em: https://console.anthropic.com/settings/usage

## Next Steps

1. **Real Data Integration**
   - Buscar dados de MongoDB antes de enviar para Claude
   - Passar vendas, estoque, clientes no contexto do system prompt

2. **Persistent Chat History**
   - Salvar mensagens em collection MongoDB
   - Recuperar histórico ao abrir página

3. **Advanced Features**
   - Exportar respostas em PDF
   - Gráficos com descrição IA
   - Alertas automáticos baseados em thresholds

4. **Analytics**
   - Rastrear perguntas mais comuns
   - Tempo de resposta
   - Taxa de satisfação do usuário

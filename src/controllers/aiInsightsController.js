const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function generateInsights(req, res) {
  const { message, context = {} } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const tenantId = req.tenantId;

  try {
    const systemPrompt = `Você é um assistente de IA especializado em análise de dados de vendas, estoque e negócios. Você trabalha para um sistema multi-tenant de gerenciamento de inventário e PDV.

Contexto do tenant atual:
- Tenant ID: ${tenantId}
- Dados disponíveis: vendas, estoque, clientes, vendedores

Você deve:
1. Fornecer insights práticos e acionáveis baseados em dados reais
2. Fazer recomendações específicas (restoque, promoções, treinamento)
3. Identificar tendências, anomalias e oportunidades
4. Responder em português brasileiro
5. Ser conciso mas informativo (máximo 3-4 parágrafos por resposta)

Se o usuário não especificar dados, SEMPRE pergunte sobre:
- Período de análise (últimos 7 dias, mês, trimestre?)
- Tipo de análise (vendas, estoque, lucro, clientes?)
- Filtros específicos (loja, categoria, vendedor?)`;

    // Streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullContent = '';

    const stream = await client.messages.stream({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    });

    // Usar .on() para eventos de streaming
    stream.on('text', (text) => {
      fullContent += text;
      res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`);
    });

    stream.on('error', (error) => {
      console.error('Claude API error:', error);
      if (!res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: 'error', content: 'Erro ao processar análise' })}\n\n`);
      }
      res.end();
    });

    stream.on('end', () => {
      res.write(`data: ${JSON.stringify({ type: 'done', content: fullContent })}\n\n`);
      res.end();
    });

    // Handle client disconnection
    req.on('close', () => {
      stream.abort();
    });
  } catch (error) {
    console.error('AI Insights error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate insights' });
    } else {
      res.end();
    }
  }
}

module.exports = {
  generateInsights,
};

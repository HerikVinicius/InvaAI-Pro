import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, History, MoreVertical, FileText, TrendingUp, ShieldCheck, AlertTriangle, User, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export default function AIInsights() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Olá, ${user?.name?.split(' ')[0] || 'lá'}! Sou seu assistente de IA especializado em análise de dados. Posso ajudar com:

📊 **Análise de Vendas** — tendências, produtos mais vendidos, sazonalidade
📦 **Gestão de Estoque** — otimização, itens em risco, recomendações de restoque
💰 **Lucratividade** — margens, custos, recomendações de preço
👥 **Comportamento de Clientes** — padrões de compra, clientes-chave

Faça suas perguntas! Se não especificar período ou filtros, vou perguntar.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;

    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    setStreaming(true);

    let fullResponse = '';
    const messageId = Date.now();

    try {
      const response = await fetch('/api/ai-insights/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('invaai_token')}`,
        },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Add empty assistant message
      setMessages((m) => [...m, { id: messageId, role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines[lines.length - 1];

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i];
          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.slice(6));
              if (json.type === 'text') {
                fullResponse += json.content;
                setMessages((m) => {
                  const newMessages = [...m];
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg && lastMsg.id === messageId) {
                    lastMsg.content = fullResponse;
                  }
                  return newMessages;
                });
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
      toast.error('Erro ao processar análise');
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.',
        },
      ]);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-9.5rem)] bg-surface border border-border rounded-lg overflow-hidden animate-fade-in">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-accent/15 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <div>
            <div className="text-sm font-semibold">InvaAI Pro Insights</div>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Análise em tempo real com Claude
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-text-muted">
          <button className="p-1.5 hover:text-text-primary" title="Histórico"><History className="w-4 h-4" /></button>
          <button className="p-1.5 hover:text-text-primary" title="Opções"><MoreVertical className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
        {messages.map((m, i) => <ChatBubble key={i} msg={m} />)}
        {streaming && (
          <div className="flex items-start gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-md bg-accent/15 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <div className="bg-surface-elevated border border-border rounded-lg px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse [animation-delay:200ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse [animation-delay:400ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="px-5 py-3 border-t border-border bg-surface">
        <form onSubmit={handleSend} className="flex items-center gap-3 bg-background border border-border rounded-lg px-3 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={streaming}
            placeholder="Pergunte sobre vendas, estoque, lucratividade…"
            className="flex-1 bg-transparent text-sm placeholder:text-text-muted focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming}
            className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-background text-sm font-medium px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 transition-colors"
          >
            {streaming ? 'Processando...' : 'Enviar'} <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="flex items-center gap-2 mt-3 text-xs text-text-secondary justify-center flex-wrap">
          <SuggestionChip label="📊 Relatório de Estoque" onClick={() => setInput('Gere um relatório completo do meu estoque atual')} />
          <SuggestionChip label="📈 Tendências de Vendas" onClick={() => setInput('Quais foram os produtos mais vendidos este mês?')} />
          <SuggestionChip label="💰 Análise de Lucro" onClick={() => setInput('Qual é a margem de lucro por categoria de produto?')} />
        </div>
      </div>
    </div>
  );
}

function SuggestionChip({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full bg-background hover:bg-surface-elevated border border-border hover:border-accent transition-colors text-xs whitespace-nowrap"
    >
      {label}
    </button>
  );
}

function ChatBubble({ msg }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (msg.role === 'user') {
    return (
      <div className="flex items-start gap-3 justify-end animate-fade-in">
        <div className="bg-accent/10 border border-accent/30 rounded-lg px-4 py-2 max-w-lg">
          <p className="text-sm">{msg.content}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-text-secondary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 animate-fade-in group">
      <div className="w-8 h-8 rounded-md bg-accent/15 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-4 h-4 text-accent" />
      </div>
      <div className="bg-surface-elevated border border-border rounded-lg px-4 py-3 max-w-2xl flex-1 prose prose-sm dark:prose-invert prose-p:text-sm prose-p:leading-relaxed prose-li:text-sm prose-strong:text-accent">
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
        <button
          onClick={handleCopy}
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors opacity-0 group-hover:opacity-100"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" /> Copiado!
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" /> Copiar
            </>
          )}
        </button>
      </div>
    </div>
  );
}

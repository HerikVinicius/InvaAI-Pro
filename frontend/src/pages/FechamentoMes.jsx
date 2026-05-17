import { Plus, Trash2, RefreshCw, TrendingUp, TrendingDown, DollarSign, Wallet, AlertCircle } from 'lucide-react';
import { useFechamentoMes } from '../hooks/useFechamentoMes';
import { format } from '../utils/format';
import Button from '../components/ui/Button';
import { SkeletonCard } from '../components/ui/Skeleton';

function InfoCard({ label, value, sub, tone = 'default', icon: Icon }) {
  const tones = {
    default:  { card: 'border-border',              text: 'text-text-primary',    icon: 'text-text-muted',       bg: 'bg-surface' },
    green:    { card: 'border-emerald-500/30',       text: 'text-emerald-400',     icon: 'text-emerald-400',      bg: 'bg-emerald-500/5' },
    red:      { card: 'border-status-critical/30',   text: 'text-status-critical', icon: 'text-status-critical',  bg: 'bg-status-critical/5' },
    accent:   { card: 'border-accent/30',            text: 'text-accent',          icon: 'text-accent',           bg: 'bg-accent/5' },
    amber:    { card: 'border-amber-500/30',         text: 'text-amber-400',       icon: 'text-amber-400',        bg: 'bg-amber-500/5' },
  };
  const t = tones[tone];
  return (
    <div className={`${t.bg} border ${t.card} rounded-xl p-5`}>
      <div className="flex items-center justify-between mb-3">
        <span className="label-caps">{label}</span>
        {Icon && <Icon className={`w-4 h-4 ${t.icon}`} />}
      </div>
      <div className={`font-mono text-2xl font-bold ${t.text}`}>{value}</div>
      {sub && <div className="text-xs text-text-secondary mt-1">{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider border-b border-border pb-2">
      {children}
    </h2>
  );
}

export default function FechamentoMes() {
  const {
    from, setFrom,
    to, setTo,
    stats,
    caixa,
    resumoCaixa,
    despesas,
    loading,
    totalDespesas,
    faturamentoPeriodo,
    lucroEstimado,
    lucroLiquido,
    margemLiquida,
    addDespesa,
    removeDespesa,
    updateDespesa,
    refetch,
  } = useFechamentoMes();

  const quantidadeVendas = stats?.periodo?.quantidadeVendas ?? stats?.mesAtual?.quantidadeVendas ?? 0;
  const ticketMedio = quantidadeVendas > 0 ? faturamentoPeriodo / quantidadeVendas : 0;
  const lucroLiquidoTone = lucroLiquido == null ? 'default' : lucroLiquido >= 0 ? 'green' : 'red';

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Cabeçalho */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs text-text-muted">Operações › Fechamento de Mês</div>
          <h1 className="text-xl font-semibold mt-1">Fechamento de Mês</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Simulação de lucro líquido após despesas. Nenhuma movimentação é realizada.
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary bg-surface border border-border rounded-md px-3 py-2 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Atualizar
        </button>
      </div>

      {/* Aviso: apenas simulação */}
      <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-300">
          Esta tela é <strong>somente de simulação</strong>. Os valores de despesa inseridos aqui não movimentam o caixa nem alteram nenhum saldo real.
        </p>
      </div>

      {/* Filtro de período */}
      <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
        <SectionTitle>Período de Análise</SectionTitle>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-muted">De</label>
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="bg-background border border-border rounded-md px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-muted">até</label>
            <input
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              className="bg-background border border-border rounded-md px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
      </div>

      {/* Cards de faturamento */}
      <div className="space-y-3">
        <SectionTitle>Faturamento do Período</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoCard
            label="Receita"
            value={format.currency(faturamentoPeriodo)}
            sub={`${quantidadeVendas} venda${quantidadeVendas !== 1 ? 's' : ''}`}
            tone="accent"
            icon={DollarSign}
          />
          <InfoCard
            label="Ticket Médio"
            value={format.currency(ticketMedio)}
            sub="por transação"
            tone="default"
            icon={TrendingUp}
          />
          <InfoCard
            label="Lucro Bruto Est."
            value={lucroEstimado != null ? format.currency(lucroEstimado) : '—'}
            sub={lucroEstimado != null && faturamentoPeriodo > 0
              ? `${Math.round((lucroEstimado / faturamentoPeriodo) * 100)}% de margem bruta`
              : 'Sem preços de custo'}
            tone={lucroEstimado != null && lucroEstimado >= 0 ? 'green' : 'default'}
            icon={TrendingUp}
          />
          <InfoCard
            label="Saldo no Caixa"
            value={resumoCaixa ? format.currency(resumoCaixa.saldoFinal) : '—'}
            sub={caixa ? `Aberto por ${caixa.openedByName}` : 'Nenhum caixa aberto'}
            tone={resumoCaixa ? 'accent' : 'default'}
            icon={Wallet}
          />
        </div>
      </div>

      {/* Despesas / Sangrias simuladas */}
      <div className="space-y-3">
        <SectionTitle>Despesas / Sangrias Simuladas</SectionTitle>
        <div className="bg-surface border border-border rounded-xl divide-y divide-border">
          {despesas.map((d, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <input
                type="text"
                placeholder="Descrição (ex: aluguel, luz...)"
                value={d.descricao}
                onChange={(e) => updateDespesa(i, 'descricao', e.target.value)}
                className="flex-1 bg-background border border-border rounded-md px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <input
                type="number"
                placeholder="R$ 0,00"
                value={d.valor}
                min="0"
                step="0.01"
                onChange={(e) => updateDespesa(i, 'valor', e.target.value)}
                className="w-36 bg-background border border-border rounded-md px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                onClick={() => removeDespesa(i)}
                disabled={despesas.length === 1}
                className="text-text-muted hover:text-status-critical transition-colors disabled:opacity-30"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="px-4 py-3">
            <Button variant="ghost" size="sm" icon={Plus} onClick={addDespesa}>
              Adicionar despesa
            </Button>
          </div>
        </div>

        {/* Total despesas */}
        <div className="flex justify-end">
          <div className="bg-surface border border-border rounded-lg px-5 py-3 flex items-center gap-8">
            <span className="text-xs text-text-muted uppercase tracking-wider">Total de Despesas</span>
            <span className="font-mono text-lg font-bold text-status-critical">
              {format.currency(totalDespesas)}
            </span>
          </div>
        </div>
      </div>

      {/* Resultado — Lucro Líquido */}
      <div className="space-y-3">
        <SectionTitle>Resultado Final</SectionTitle>
        {lucroEstimado == null ? (
          <div className="bg-surface border border-border rounded-xl p-6 text-center text-sm text-text-secondary">
            Cadastre o preço de custo dos produtos no estoque para calcular o lucro estimado.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCard
              label="Lucro Bruto"
              value={format.currency(lucroEstimado)}
              sub="receita − custo dos produtos"
              tone={lucroEstimado >= 0 ? 'green' : 'red'}
              icon={TrendingUp}
            />
            <InfoCard
              label="Total de Despesas"
              value={format.currency(totalDespesas)}
              sub={`${despesas.filter(d => parseFloat(d.valor) > 0).length} item(ns)`}
              tone="red"
              icon={TrendingDown}
            />
            <div className={`rounded-xl p-5 border-2 ${
              lucroLiquido >= 0
                ? 'bg-emerald-500/10 border-emerald-500/40'
                : 'bg-status-critical/10 border-status-critical/40'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="label-caps">Lucro Líquido</span>
                {lucroLiquido >= 0
                  ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                  : <TrendingDown className="w-4 h-4 text-status-critical" />
                }
              </div>
              <div className={`font-mono text-3xl font-bold ${
                lucroLiquido >= 0 ? 'text-emerald-400' : 'text-status-critical'
              }`}>
                {format.currency(lucroLiquido)}
              </div>
              <div className="text-xs text-text-secondary mt-1">
                Margem líquida: {margemLiquida.toFixed(1)}%
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

import { Wallet, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';

const fmt = (n) => `R$ ${(n || 0).toFixed(2)}`;
const fmtDate = (d) => new Date(d).toLocaleString('pt-BR');

function SummaryCard({ label, value, sub, tone, icon: Icon }) {
  const tones = {
    accent: 'text-accent',
    sky: 'text-sky-300',
    critical: 'text-status-critical',
    muted: 'text-text-primary',
  };
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="label-caps">{label}</span>
        {Icon && <Icon className={`w-4 h-4 ${tones[tone]}`} />}
      </div>
      <div className={`font-mono text-2xl font-semibold ${tones[tone]}`}>{value}</div>
      <div className="text-xs text-text-muted mt-1 truncate">{sub}</div>
    </div>
  );
}

export default function CaixaSummary({ caixa, resumo }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <SummaryCard
        label="Saldo Atual"
        value={fmt(resumo.saldoFinal)}
        sub={`Inicial: ${fmt(resumo.initialAmount)}`}
        tone="accent"
        icon={Wallet}
      />
      <SummaryCard
        label="Entradas"
        value={fmt(resumo.entradas.total)}
        sub={`Vendas ${fmt(resumo.entradas.vendas)} · Receb. ${fmt(resumo.entradas.recebimentos)}`}
        tone="sky"
        icon={ArrowUpRight}
      />
      <SummaryCard
        label="Saídas"
        value={fmt(Math.abs(resumo.saidas.total))}
        sub={`Sangrias ${fmt(Math.abs(resumo.saidas.sangrias))} · Estornos ${fmt(Math.abs(resumo.saidas.estornos))}`}
        tone="critical"
        icon={ArrowDownRight}
      />
      <SummaryCard
        label="Aberto desde"
        value={fmtDate(caixa.openedAt)}
        sub={`Por ${caixa.openedByName}`}
        tone="muted"
        icon={Clock}
      />
    </div>
  );
}

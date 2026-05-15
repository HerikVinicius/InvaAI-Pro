import { fmt } from '../../utils/format';

/**
 * Componente Presentacional: Resumo de Clientes
 * Recebe dados via props, renderiza cards
 */
export default function ClientesSummary({
  total = 0,
  comDebito = 0,
  totalDevedor = 0,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <SummaryCard
        label="Total de Clientes"
        value={total}
        sub="cadastrados"
        tone="accent"
      />
      <SummaryCard
        label="Com Débito"
        value={comDebito}
        sub="pendências em aberto"
        tone="amber"
      />
      <SummaryCard
        label="Total Devedor"
        value={fmt(totalDevedor)}
        sub="somatório de saldos"
        tone="critical"
      />
    </div>
  );
}

function SummaryCard({ label, value, sub, tone }) {
  const tones = {
    accent: 'text-accent',
    critical: 'text-status-critical',
    amber: 'text-amber-300',
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="label-caps mb-2">{label}</div>
      <div className={`font-mono text-2xl font-semibold ${tones[tone]}`}>
        {value}
      </div>
      <div className="text-xs text-text-muted mt-1">{sub}</div>
    </div>
  );
}

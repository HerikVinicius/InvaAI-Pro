import { DollarSign, ShoppingCart, TrendingUp, AreaChart as AreaChartIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

const formatBRL = (value) =>
  (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

function MetricCard({ label, value, icon: Icon, variation, subline }) {
  const hasVariation = variation !== null && variation !== undefined;
  const up = (variation || 0) >= 0;
  return (
    <div className="bg-surface border border-border rounded-xl p-5 hover:border-border-hover transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="label-caps">{label}</span>
        <Icon className="w-4 h-4 text-text-muted" />
      </div>
      <div className="font-mono text-2xl font-semibold mb-1">{value}</div>
      {hasVariation ? (
        <div className={`text-xs flex items-center gap-1 ${up ? 'text-accent' : 'text-status-critical'}`}>
          {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {up ? '+' : ''}{variation}% {subline}
        </div>
      ) : (
        <div className="text-xs text-text-secondary">{subline}</div>
      )}
    </div>
  );
}

export default function SalesMetricsCards({
  range = null,
  receitaTotal = 0,
  unidadesTotais = 0,
  quantidadeVendasTotal = 0,
  variacaoReceita = 0,
  variacaoUnidades = 0,
  ticketMedio = 0,
  semDados = false,
  trend = [],
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-accent/15 via-surface to-surface border border-accent/30 rounded-xl p-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-accent" />
              </div>
              <span className="label-caps text-accent">{range ? 'Receita no Período' : 'Receita Total'}</span>
            </div>
            {!semDados && (
              <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                variacaoReceita >= 0 ? 'bg-accent/15 text-accent' : 'bg-status-critical/15 text-status-critical'
              }`}>
                {variacaoReceita >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {variacaoReceita >= 0 ? '+' : ''}{variacaoReceita}%
              </div>
            )}
          </div>
          <div className="font-mono text-4xl font-bold text-text-primary tracking-tight">
            {formatBRL(receitaTotal)}
          </div>
          <div className="text-xs text-text-secondary mt-2">
            {semDados
              ? (range ? 'Nenhuma venda no período selecionado' : 'Aguardando primeira venda')
              : `${quantidadeVendasTotal} venda${quantidadeVendasTotal === 1 ? '' : 's'} ${range ? 'no período' : 'concluídas'} · vs ${range ? 'período anterior' : 'mês anterior'}`
            }
          </div>

          {trend.length > 0 && trend.some((t) => t.revenue > 0) && (
            <div className="h-12 mt-4 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="heroSparkline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={1.5} fill="url(#heroSparkline)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <MetricCard
        label="Unidades Vendidas"
        value={(unidadesTotais || 0).toLocaleString('pt-BR')}
        icon={ShoppingCart}
        variation={!semDados ? variacaoUnidades : null}
        subline="vs mês anterior"
      />
      <MetricCard
        label="Ticket Médio"
        value={formatBRL(ticketMedio)}
        icon={TrendingUp}
        variation={null}
        subline={`Por venda · ${quantidadeVendasTotal} ${quantidadeVendasTotal === 1 ? 'transação' : 'transações'}`}
      />
    </div>
  );
}

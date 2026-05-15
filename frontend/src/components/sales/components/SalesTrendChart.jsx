import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatBRLCompact = (value) => {
  const v = value || 0;
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(1)}k`;
  return `R$ ${v.toFixed(0)}`;
};

const formatBRL = (value) =>
  (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

function EmptyChart() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mb-3">
        <BarChart3 className="w-5 h-5 text-text-muted opacity-50" />
      </div>
      <p className="text-sm text-text-secondary">Nenhuma venda registrada ainda</p>
      <p className="text-xs text-text-muted mt-1">O gráfico aparecerá quando houver dados.</p>
    </div>
  );
}

export default function SalesTrendChart({ trend = [], trendSubtitle = 'Últimos 6 meses' }) {
  return (
    <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold">Volume de Vendas</h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-accent" /> Receita
          </span>
          <span className="text-text-muted">{trendSubtitle}</span>
        </div>
      </div>
      <div className="h-72">
        {trend.some((t) => t.revenue > 0) ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#27272a' }}
              />
              <YAxis
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatBRLCompact}
                width={60}
              />
              <Tooltip
                cursor={{ fill: 'rgba(16, 185, 129, 0.08)', radius: 4 }}
                contentStyle={{
                  background: '#0c0c0e',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  fontSize: '12px',
                  padding: '10px 12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}
                labelStyle={{ color: '#a1a1aa', marginBottom: '4px', fontWeight: 600 }}
                formatter={(v, _name, item) => [
                  <span key="v" style={{ color: '#10b981', fontWeight: 600 }}>
                    {formatBRL(v)}
                  </span>,
                  `${item.payload.units} unidade${item.payload.units === 1 ? '' : 's'}`,
                ]}
              />
              <Bar dataKey="revenue" fill="url(#barGradient)" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>
    </div>
  );
}

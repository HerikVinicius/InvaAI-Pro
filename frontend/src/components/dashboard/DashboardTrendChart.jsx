import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

const formatBRL = (value) =>
  (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

export default function DashboardTrendChart({ salesTrend = [] }) {
  return (
    <div className="lg:col-span-2 bg-surface border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Tendência de Vendas — Últimos 6 Meses</h3>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span className="w-2 h-2 rounded-full bg-accent" />
          Receita
        </div>
      </div>
      <div className="h-64 flex items-center justify-center">
        {salesTrend.some((s) => s.revenue > 0) ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesTrend}>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="#71717a" fontSize={11} />
              <YAxis stroke="#71717a" fontSize={11} tickFormatter={(v) => `R$ ${v}`} />
              <Tooltip
                contentStyle={{ background: '#121214', border: '1px solid #27272a', borderRadius: '6px', fontSize: '12px' }}
                formatter={(v) => [formatBRL(v), 'Receita']}
              />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
            <p className="text-sm text-text-secondary">Nenhuma venda registrada ainda</p>
            <Link to="/nova-venda" className="text-xs text-accent hover:underline mt-2 inline-block">
              Registrar primeira venda →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

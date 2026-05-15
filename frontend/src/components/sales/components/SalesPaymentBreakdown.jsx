import { CreditCard, Smartphone, Banknote, ClipboardSignature } from 'lucide-react';

const PAYMENT_META = {
  PIX: { label: 'PIX', icon: Smartphone, color: '#10b981', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  DINHEIRO: { label: 'Dinheiro', icon: Banknote, color: '#84cc16', bg: 'bg-lime-500/10', text: 'text-lime-400' },
  CREDITO: { label: 'Crédito', icon: CreditCard, color: '#3b82f6', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  DEBITO: { label: 'Débito', icon: CreditCard, color: '#a855f7', bg: 'bg-purple-500/10', text: 'text-purple-400' },
  FIADO: { label: 'Fiado', icon: ClipboardSignature, color: '#f59e0b', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  SPLIT: { label: 'Dividido', icon: CreditCard, color: '#f59e0b', bg: 'bg-amber-500/10', text: 'text-amber-400' },
};

const formatBRL = (value) =>
  (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

export default function SalesPaymentBreakdown({ paymentBreakdown = [] }) {
  const totalPayments = paymentBreakdown.reduce((s, p) => s + p.receita, 0);

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <CreditCard className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold">Métodos de Pagamento</h3>
      </div>
      {paymentBreakdown.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CreditCard className="w-8 h-8 text-text-muted opacity-30 mb-2" />
          <p className="text-xs text-text-secondary">Sem dados ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paymentBreakdown.map((p) => {
            const meta = PAYMENT_META[p._id] || PAYMENT_META.PIX;
            const Icon = meta.icon;
            const pct = totalPayments > 0 ? (p.receita / totalPayments) * 100 : 0;
            return (
              <div key={p._id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-md ${meta.bg} flex items-center justify-center`}>
                      <Icon className={`w-3.5 h-3.5 ${meta.text}`} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">{meta.label}</div>
                      <div className="text-[10px] text-text-muted">
                        {p.quantidade} venda{p.quantidade === 1 ? '' : 's'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="data-mono text-xs font-semibold">{formatBRL(p.receita)}</div>
                    <div className="text-[10px] text-text-muted">{pct.toFixed(0)}%</div>
                  </div>
                </div>
                <div className="h-1 bg-surface-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: meta.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

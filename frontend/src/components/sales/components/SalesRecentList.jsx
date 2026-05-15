import { Receipt, Package, UserCircle, XCircle } from 'lucide-react';

const PAYMENT_META = {
  PIX: { label: 'PIX', icon: 'Smartphone' },
  DINHEIRO: { label: 'Dinheiro', icon: 'Banknote' },
  CREDITO: { label: 'Crédito', icon: 'CreditCard' },
  DEBITO: { label: 'Débito', icon: 'CreditCard' },
  FIADO: { label: 'Fiado', icon: 'ClipboardSignature' },
  SPLIT: { label: 'Dividido', icon: 'CreditCard' },
};

const formatBRL = (value) =>
  (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

const formatDate = (date) => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return `Hoje, ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return `Ontem, ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

export default function SalesRecentList({ vendas = [] }) {
  return (
    <div className="lg:col-span-2 bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold">Vendas Recentes</h3>
        </div>
        <span className="text-xs text-text-muted">{vendas.length} mais recentes</span>
      </div>
      {vendas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mb-3">
            <Receipt className="w-5 h-5 text-text-muted opacity-50" />
          </div>
          <p className="text-sm text-text-secondary">Nenhuma venda registrada ainda</p>
          <p className="text-xs text-text-muted mt-1">As vendas aparecerão aqui assim que forem concluídas.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {vendas.map((v) => {
            const meta = PAYMENT_META[v.paymentMethod] || PAYMENT_META.PIX;
            const itemsCount = v.items?.reduce((s, i) => s + i.quantity, 0) || 0;
            const initials = v.vendorName?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
            const isCancelled = v.status === 'CANCELADA';
            return (
              <div
                key={v._id}
                className={`px-5 py-3.5 hover:bg-surface-hover transition-colors ${isCancelled ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                    isCancelled ? 'bg-status-critical/15 text-status-critical' : 'bg-accent/15 text-accent'
                  }`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-sm font-medium truncate">{v.vendorName}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 inline-flex items-center gap-1">
                        {meta.label}{v.paymentMethod === 'CREDITO' && v.installments > 1 ? ` ${v.installments}x` : ''}
                      </span>
                      {isCancelled && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-status-critical/15 text-status-critical inline-flex items-center gap-1">
                          <XCircle className="w-2.5 h-2.5" /> Cancelada
                        </span>
                      )}
                      {v.clienteName && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface-elevated text-text-secondary border border-border inline-flex items-center gap-1">
                          <UserCircle className="w-2.5 h-2.5" />
                          {v.clienteName}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-text-muted flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {itemsCount} {itemsCount === 1 ? 'item' : 'itens'}
                      </span>
                      <span>·</span>
                      <span>{formatDate(v.createdAt)}</span>
                    </div>
                    {isCancelled && v.cancelReason && (
                      <div className="text-[11px] italic text-status-critical mt-1 truncate" title={v.cancelReason}>
                        Motivo: {v.cancelReason}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`data-mono text-sm font-semibold ${
                      isCancelled ? 'line-through text-text-muted' : 'text-accent'
                    }`}>
                      {formatBRL(v.totalAmount)}
                    </div>
                    {v.paymentMethod === 'CREDITO' && v.installments > 1 && (
                      <div className="text-[10px] text-text-muted">
                        {v.installments}x de {formatBRL(v.totalAmount / v.installments)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

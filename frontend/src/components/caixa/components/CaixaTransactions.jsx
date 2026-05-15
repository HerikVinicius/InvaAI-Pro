import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fmt = (n) => `R$ ${(n || 0).toFixed(2)}`;
const fmtDate = (d) => new Date(d).toLocaleString('pt-BR');

const TYPE_BADGE = {
  VENDA: { label: 'Venda', bg: 'bg-accent/15', text: 'text-accent' },
  RECEBIMENTO: { label: 'Recebimento', bg: 'bg-sky-500/15', text: 'text-sky-300' },
  SANGRIA: { label: 'Sangria', bg: 'bg-amber-500/15', text: 'text-amber-300' },
  ESTORNO: { label: 'Estorno', bg: 'bg-status-critical/15', text: 'text-status-critical' },
};

function TransactionRow({ tx }) {
  const badge = TYPE_BADGE[tx.type] || TYPE_BADGE.VENDA;
  const isNegative = tx.amount < 0;

  return (
    <div className="px-4 py-3 flex items-center gap-3 hover:bg-surface-hover transition-colors">
      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
      <div className="flex-1 min-w-0">
        {isNegative && tx.description && (
          <div className="text-xs italic text-text-secondary truncate" title={tx.description}>
            {tx.description}
          </div>
        )}
        {!isNegative && tx.description && (
          <div className="text-xs text-text-secondary truncate">{tx.description}</div>
        )}
        {!tx.description && (
          <div className="text-xs text-text-muted">
            {tx.paymentMethod ? `Pagamento: ${tx.paymentMethod}` : '—'}
          </div>
        )}
        <div className="text-[10px] text-text-muted mt-0.5">
          {fmtDate(tx.createdAt)} · {tx.createdByName || 'sistema'}
        </div>
      </div>
      <div
        className={`font-mono text-sm font-bold whitespace-nowrap ${
          isNegative ? 'text-status-critical' : 'text-accent'
        }`}
      >
        {isNegative ? '−' : '+'} {fmt(Math.abs(tx.amount))}
      </div>
    </div>
  );
}

export default function CaixaTransactions({ transactions }) {
  const navigate = useNavigate();

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-text-muted" />
          <h3 className="text-sm font-semibold">Movimentações Recentes</h3>
        </div>
        <button
          onClick={() => navigate('/historico-caixa')}
          className="text-xs text-accent hover:text-accent-hover"
        >
          Ver histórico completo →
        </button>
      </div>
      <div className="divide-y divide-border">
        {transactions.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-text-secondary">
            Nenhuma movimentação ainda.
          </div>
        ) : (
          transactions.map((t) => <TransactionRow key={t._id} tx={t} />)
        )}
      </div>
    </div>
  );
}

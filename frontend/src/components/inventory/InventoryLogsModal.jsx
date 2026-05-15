import { useEffect, useState } from 'react';
import { History, ArrowUp, ArrowDown, Plus, Trash2, Pencil, ShoppingCart, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import { inventoryService } from '../../services/inventoryService';

const fmtDate = (d) => new Date(d).toLocaleString('pt-BR');

const ACTION_META = {
  CREATE:         { label: 'Criado',         icon: Plus,         color: 'text-accent',          bg: 'bg-accent/15' },
  UPDATE:         { label: 'Editado',        icon: Pencil,       color: 'text-sky-300',         bg: 'bg-sky-500/15' },
  DELETE:         { label: 'Excluído',       icon: Trash2,       color: 'text-status-critical', bg: 'bg-status-critical/15' },
  SALE:           { label: 'Venda',          icon: ShoppingCart, color: 'text-amber-300',       bg: 'bg-amber-500/15' },
  CANCEL_RESTORE: { label: 'Estorno',        icon: RotateCcw,    color: 'text-purple-300',      bg: 'bg-purple-500/15' },
};

/**
 * Drilldown audit log for a single product. Shows who, when, what changed,
 * and the resulting before/after quantities — exactly what the spec asked
 * for under "Manter o log de alterações de estoque".
 */
export default function InventoryLogsModal({ open, product, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !product?._id) return;
    setLoading(true);
    inventoryService.productLogs(product._id)
      .then((res) => setLogs(res.data.logs || []))
      .catch((err) => toast.error(err.message || 'Falha ao carregar histórico.'))
      .finally(() => setLoading(false));
  }, [open, product?._id]);

  if (!product) return null;

  return (
    <Modal open={open} onClose={onClose} title="Histórico de Movimentações" size="lg">
      <div className="space-y-3">
        <div className="bg-surface-elevated border border-border rounded-md p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-accent/15 text-accent flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{product.name}</div>
            <div className="text-xs text-text-muted data-mono">{product.sku}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="label-caps">Estoque Atual</div>
            <div className="font-mono text-base font-semibold text-accent">{product.quantity}</div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-md max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-text-secondary">Carregando…</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-sm text-text-secondary">
              Nenhuma movimentação registrada ainda.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {logs.map((log) => {
                const meta = ACTION_META[log.action] || ACTION_META.UPDATE;
                const Icon = meta.icon;
                const positive = log.delta > 0;
                const neutral = log.delta === 0;

                return (
                  <li key={log._id} className="p-3 flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${meta.bg} ${meta.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${meta.bg} ${meta.color}`}>
                          {meta.label}
                        </span>
                        <span className="text-xs text-text-muted">{fmtDate(log.createdAt)}</span>
                      </div>

                      <div className="text-sm mt-1">
                        Por <strong>{log.changedByName || `@${log.changedByUsername}`}</strong>
                        {log.changedByUsername && log.changedByUsername !== log.changedByName && (
                          <span className="text-text-muted data-mono"> (@{log.changedByUsername})</span>
                        )}
                      </div>

                      {/* Changes diff (UPDATE) */}
                      {log.action === 'UPDATE' && log.changes && Object.keys(log.changes).length > 0 && (
                        <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                          {Object.entries(log.changes).map(([field, { from, to }]) => (
                            <div key={field} className="bg-surface-elevated border border-border rounded px-2 py-1">
                              <span className="text-text-muted">{field}:</span>{' '}
                              <span className="data-mono text-status-critical line-through">{String(from)}</span>{' '}
                              →{' '}
                              <span className="data-mono text-accent">{String(to)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reason (manual update/delete or cancel) */}
                      {log.reason && (
                        <div className="mt-1.5 text-xs italic text-text-secondary border-l-2 border-amber-500/30 pl-2">
                          Motivo: {log.reason}
                        </div>
                      )}

                      {/* Sale reference */}
                      {log.saleId && (
                        <div className="mt-1 text-[11px] text-text-muted">
                          Venda <span className="data-mono">#{String(log.saleId).slice(-8)}</span>
                        </div>
                      )}
                    </div>

                    {/* Delta on the right */}
                    <div className="text-right flex-shrink-0">
                      <div
                        className={`font-mono text-sm font-bold ${
                          neutral
                            ? 'text-text-muted'
                            : positive
                              ? 'text-accent'
                              : 'text-status-critical'
                        }`}
                      >
                        {positive && '+'}
                        {neutral ? '0' : log.delta}
                      </div>
                      <div className="text-[10px] text-text-muted">
                        {log.quantityBefore} → {log.quantityAfter}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="text-[11px] text-text-muted">
          Total: {logs.length} {logs.length === 1 ? 'movimentação' : 'movimentações'} registrada(s).
        </div>
      </div>
    </Modal>
  );
}

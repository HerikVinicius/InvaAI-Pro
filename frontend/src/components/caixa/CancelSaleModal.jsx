import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { vendasService } from '../../services/salesService';

/**
 * Modal that forces the operator to type a justification before a sale is
 * cancelled. Backend will reject empty reasons (defense in depth), but we
 * also block the submit button until something is typed.
 */
export default function CancelSaleModal({ open, onClose, sale, onCancelled }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  if (!sale) return null;

  const trimmedReason = reason.trim();
  const canSubmit = trimmedReason.length >= 3 && !submitting;

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      await vendasService.cancel(sale._id, trimmedReason);
      toast.success('Venda cancelada. Estoque devolvido e estorno registrado.');
      onCancelled?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Falha ao cancelar venda.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Cancelar Venda" size="sm">
      <form onSubmit={handleConfirm} className="space-y-4">
        <div className="flex gap-3 p-3 bg-status-critical/10 border border-status-critical/30 rounded-md">
          <AlertTriangle className="w-5 h-5 text-status-critical flex-shrink-0 mt-0.5" />
          <div className="text-xs text-text-secondary">
            Esta ação <strong className="text-status-critical">não pode ser desfeita</strong>.
            O estoque será devolvido, o saldo do cliente revertido (se houver fiado),
            e um estorno será lançado no caixa.
          </div>
        </div>

        <div className="bg-surface-elevated border border-border rounded-md p-3 space-y-1">
          <div className="text-xs text-text-muted">Venda</div>
          <div className="font-mono text-sm">#{sale._id?.slice(-8)}</div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xs text-text-muted">Total</span>
            <span className="font-mono text-base font-semibold text-status-critical">
              R$ {sale.totalAmount?.toFixed(2)}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-text-muted">Vendedor</span>
            <span className="text-sm">{sale.vendorName}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="label-caps">
            Motivo do Cancelamento <span className="text-status-critical">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex.: Cliente desistiu da compra, produto avariado, erro no registro..."
            rows={3}
            maxLength={500}
            autoFocus
            className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
          />
          <div className="flex justify-between text-xs">
            <span className={trimmedReason.length < 3 ? 'text-status-critical' : 'text-text-muted'}>
              Mínimo 3 caracteres
            </span>
            <span className="text-text-muted">{reason.length}/500</span>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Voltar
          </Button>
          <Button
            type="submit"
            variant="danger"
            loading={submitting}
            disabled={!canSubmit}
          >
            Confirmar Cancelamento
          </Button>
        </div>
      </form>
    </Modal>
  );
}

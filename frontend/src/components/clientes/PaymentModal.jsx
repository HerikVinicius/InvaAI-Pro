import { useEffect, useState } from 'react';
import { clientesService } from '../../services/clientesService';
import { useFormSubmit } from '../../hooks/useFormSubmit';
import { fmt } from '../../utils/format';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

export default function PaymentModal({ open, onClose, cliente, onPaid }) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('DINHEIRO');
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (open && cliente) {
      setAmount(cliente.saldoDevedor?.toFixed(2) || '');
      setPaymentMethod('DINHEIRO');
      setObservacao('');
    }
  }, [open, cliente]);

  const value = parseFloat(amount) || 0;
  const isOverpay = value > (cliente?.saldoDevedor ?? 0);

  const { submitting, handleSubmit } = useFormSubmit(
    async () => {
      if (value <= 0) throw new Error('Valor deve ser maior que zero.');
      if (isOverpay) throw new Error(`Valor excede o saldo devedor (${fmt(cliente.saldoDevedor)}).`);

      await clientesService.pagamento(cliente._id, {
        amount: value,
        paymentMethod,
        observacao: observacao.trim() || undefined,
      });
    },
    { successMessage: 'Recebimento registrado no caixa.', onSuccess: onPaid }
  );

  if (!cliente) return null;

  return (
    <Modal open={open} onClose={onClose} title="Receber Pagamento" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-surface-elevated border border-border rounded-md p-3 space-y-1">
          <div className="text-sm font-semibold">{cliente.name}</div>
          {cliente.phone && <div className="text-xs text-text-muted">{cliente.phone}</div>}
          <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-border">
            <span className="text-xs text-text-muted">Saldo Devedor</span>
            <span className="font-mono text-base font-bold text-status-critical">{fmt(cliente.saldoDevedor)}</span>
          </div>
        </div>

        <Input
          label="Valor Recebido"
          type="number"
          step="0.01"
          min="0.01"
          max={cliente.saldoDevedor}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />
        {isOverpay && (
          <div className="text-xs text-status-critical -mt-2">
            Valor excede o saldo devedor ({fmt(cliente.saldoDevedor)}).
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="label-caps">Forma de Pagamento</label>
          <div className="grid grid-cols-4 gap-2">
            {['DINHEIRO', 'PIX', 'CREDITO', 'DEBITO'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPaymentMethod(m)}
                className={`text-xs px-2 py-2 rounded border transition-colors ${
                  paymentMethod === m
                    ? 'bg-accent/15 text-accent border-accent/30'
                    : 'border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="label-caps">Observação (Opcional)</label>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Ex.: Recebido na entrega, troca parcial, etc."
            className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
          />
          <div className="text-xs text-text-muted">Será exibida no Histórico de Caixa junto com este recebimento.</div>
        </div>

        {value > 0 && !isOverpay && (
          <div className="bg-accent/5 border border-accent/20 rounded-md p-3 text-xs">
            <div className="flex justify-between text-text-secondary">
              <span>Novo saldo devedor</span>
              <span className="font-mono font-semibold text-accent">{fmt(Math.max(0, cliente.saldoDevedor - value))}</span>
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={submitting} disabled={value <= 0 || isOverpay || submitting}>Confirmar Recebimento</Button>
        </div>
      </form>
    </Modal>
  );
}

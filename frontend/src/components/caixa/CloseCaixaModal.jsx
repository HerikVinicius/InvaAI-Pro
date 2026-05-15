import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { caixaService } from '../../services/caixaService';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

const fmt = (n) => `R$ ${(n || 0).toFixed(2)}`;

function Row({ label, value, positive, negative, bold }) {
  const color = positive ? 'text-accent' : negative ? 'text-status-critical' : 'text-text-primary';
  return (
    <div className={`flex justify-between ${bold ? 'font-semibold' : ''}`}>
      <span className="text-text-secondary">{label}</span>
      <span className={`font-mono ${color}`}>{value}</span>
    </div>
  );
}

export default function CloseCaixaModal({ open, onClose, caixa, resumo, onClosed }) {
  const [countedAmount, setCountedAmount] = useState('');
  const [observacao, setObservacao] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) { setCountedAmount(''); setObservacao(''); }
  }, [open]);

  const saldoEsperado = resumo?.saldoFinal || 0;
  const counted = parseFloat(countedAmount) || 0;
  const diferenca = counted - saldoEsperado;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await caixaService.fechar(caixa._id, { countedAmount: counted, observacao });
      toast.success('Caixa fechado.');
      onClosed();
    } catch (err) {
      toast.error(err.message || 'Falha ao fechar caixa.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Fechar Caixa" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-surface-elevated border border-border rounded-md p-3 space-y-1 text-xs">
          <Row label="Saldo Inicial" value={fmt(resumo?.initialAmount)} />
          <Row label="+ Entradas" value={fmt(resumo?.entradas.total)} positive />
          <Row label="− Saídas" value={fmt(Math.abs(resumo?.saidas.total || 0))} negative />
          <div className="border-t border-border pt-1.5 mt-1">
            <Row label="Saldo Esperado" value={fmt(saldoEsperado)} bold />
          </div>
        </div>

        <Input
          label="Valor Contado em Caixa"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={countedAmount}
          onChange={(e) => setCountedAmount(e.target.value)}
        />

        {countedAmount !== '' && (
          <div
            className={`text-sm flex justify-between p-3 rounded-md ${
              Math.abs(diferenca) < 0.01
                ? 'bg-accent/10 text-accent'
                : 'bg-status-critical/10 text-status-critical'
            }`}
          >
            <span className="font-medium">Diferença</span>
            <span className="font-mono font-semibold">
              {diferenca >= 0 ? '+' : ''}{fmt(diferenca)}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="label-caps">Observação (Opcional)</label>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={2}
            maxLength={500}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
          />
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="danger" loading={submitting}>Fechar Caixa</Button>
        </div>
      </form>
    </Modal>
  );
}

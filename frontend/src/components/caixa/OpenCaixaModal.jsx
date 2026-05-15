import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { caixaService } from '../../services/caixaService';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

export default function OpenCaixaModal({ open, onClose, onOpened, onExpired }) {
  const [initialAmount, setInitialAmount] = useState('');
  const [observacao, setObservacao] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) { setInitialAmount(''); setObservacao(''); }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = parseFloat(initialAmount) || 0;
    if (value < 0) { toast.error('Valor inicial inválido.'); return; }

    setSubmitting(true);
    try {
      await caixaService.abrir({ initialAmount: value, observacao });
      toast.success('Caixa aberto.');
      onOpened();
    } catch (err) {
      if (onExpired && onExpired(err)) return;
      toast.error(err.message || 'Falha ao abrir caixa.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Abrir Caixa" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Valor Inicial (Fundo de Troco)"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={initialAmount}
          onChange={(e) => setInitialAmount(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label className="label-caps">Observação (Opcional)</label>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Ex.: Início do turno da manhã"
            className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
          />
        </div>
        <div className="flex gap-2 justify-end pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={submitting}>Abrir Caixa</Button>
        </div>
      </form>
    </Modal>
  );
}

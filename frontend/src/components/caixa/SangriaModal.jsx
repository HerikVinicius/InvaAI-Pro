import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { caixaService } from '../../services/caixaService';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

export default function SangriaModal({ open, onClose, caixa, onRegistered }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) { setAmount(''); setDescription(''); }
  }, [open]);

  const trimmed = description.trim();
  const canSubmit = parseFloat(amount) > 0 && trimmed.length >= 3 && !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      await caixaService.sangria(caixa._id, {
        amount: parseFloat(amount),
        description: trimmed,
      });
      toast.success('Sangria registrada.');
      onRegistered();
    } catch (err) {
      toast.error(err.message || 'Falha ao registrar sangria.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Registrar Sangria" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Valor"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />
        <div className="flex flex-col gap-1.5">
          <label className="label-caps">
            Justificativa <span className="text-status-critical">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Ex.: Pagamento de fornecedor, retirada para troco..."
            className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
          />
          <div className="text-xs text-text-muted">Mínimo 3 caracteres — campo obrigatório.</div>
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="danger" loading={submitting} disabled={!canSubmit}>
            Registrar Sangria
          </Button>
        </div>
      </form>
    </Modal>
  );
}

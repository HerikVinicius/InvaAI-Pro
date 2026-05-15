import { useState } from 'react';
import { Phone, User } from 'lucide-react';
import { clientesService } from '../../services/clientesService';
import { useFormSubmit } from '../../hooks/useFormSubmit';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

export default function CreateClienteModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', phone: '', observacao: '' });

  const { submitting, handleSubmit } = useFormSubmit(
    async () => {
      if (!form.name.trim()) throw new Error('Nome é obrigatório.');
      await clientesService.create({
        name: form.name.trim(),
        phone: form.phone.trim(),
        observacao: form.observacao.trim(),
      });
      setForm({ name: '', phone: '', observacao: '' });
    },
    { successMessage: 'Cliente cadastrado.', onSuccess: onCreated }
  );

  // Reset form quando modal abre
  const handleOpen = (isOpen) => {
    if (!isOpen) {
      setForm({ name: '', phone: '', observacao: '' });
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={handleOpen} title="Novo Cliente" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome *"
          icon={User}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          autoFocus
        />
        <Input
          label="Telefone"
          icon={Phone}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="(00) 00000-0000"
        />
        <div className="flex flex-col gap-1.5">
          <label className="label-caps">Observação (Opcional)</label>
          <textarea
            value={form.observacao}
            onChange={(e) => setForm({ ...form, observacao: e.target.value })}
            rows={2}
            maxLength={500}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
          />
        </div>
        <div className="flex gap-2 justify-end pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={submitting}>Criar Cliente</Button>
        </div>
      </form>
    </Modal>
  );
}

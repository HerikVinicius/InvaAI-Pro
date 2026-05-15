import { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import api from '../../services/api';
import { useFormSubmit } from '../../hooks/useFormSubmit';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function EditUserModal({ open, onClose, user, onSaved }) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open && user) setName(user.name || '');
  }, [open, user]);

  const { submitting, handleSubmit } = useFormSubmit(
    async () => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error('Nome é obrigatório.');
      if (trimmed === user.name) {
        onClose();
        return;
      }
      await api.patch(`/users/${user._id}`, { name: trimmed });
      onSaved?.();
    },
    { successMessage: 'Usuário atualizado.', onSuccess: onClose }
  );

  if (!user) return null;

  return (
    <Modal open={open} onClose={onClose} title="Editar Usuário" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-surface-elevated border border-border rounded-md p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-semibold">
            {user.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-xs text-text-muted">Username (imutável)</div>
            <div className="data-mono text-sm">@{user.username}</div>
          </div>
        </div>

        <Input
          label="Nome"
          icon={User}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <p className="text-xs text-text-muted">
          O username não pode ser alterado para preservar o histórico de auditoria
          (vendas, sangrias e estornos antigos continuam fazendo referência ao mesmo handle).
        </p>

        <div className="flex gap-2 justify-end pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

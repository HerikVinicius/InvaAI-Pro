import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useFormSubmit } from '../../hooks/useFormSubmit';
import { validateUsername, validatePassword, PIN_ROLES } from '../../constants/validation';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

export default function CreateUserModal({ open, onClose, onSaved, tenants, isMaster, isLojista, userTenantId }) {
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'vendedor', tenantId: '' });

  useEffect(() => {
    if (open) {
      const initialTenantId = isLojista ? userTenantId : '';
      setForm({ name: '', username: '', password: '', role: 'vendedor', tenantId: initialTenantId });
    }
  }, [open, isLojista, userTenantId]);

  const { submitting, handleSubmit } = useFormSubmit(
    async () => {
      if (!form.name || !form.username || !form.password) throw new Error('Nome, username e senha são obrigatórios.');

      const usernameError = validateUsername(form.username);
      if (usernameError) throw new Error(usernameError);

      const passwordError = validatePassword(form.password, PIN_ROLES.includes(form.role));
      if (passwordError) throw new Error(passwordError);

      if (!form.tenantId.trim()) throw new Error('Tenant é obrigatório.');

      await api.post('/users', { ...form, username: form.username.toLowerCase() });
    },
    { successMessage: 'Usuário criado com sucesso.', onSuccess: onSaved }
  );

  const roleOptions = isMaster
    ? [
        { value: 'vendedor', label: 'Vendedor' },
        { value: 'gerente',  label: 'Gerente'  },
        { value: 'lojista',  label: 'Lojista'  },
        { value: 'admin',    label: 'Admin'    },
        { value: 'master',   label: 'Master'   },
      ]
    : [
        { value: 'vendedor', label: 'Vendedor' },
        { value: 'gerente',  label: 'Gerente'  },
        { value: 'lojista',  label: 'Lojista'  },
      ];

  return (
    <Modal open={open} onClose={onClose} title="Adicionar Usuário">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nome *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input
            label="Username *"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
            placeholder="joao.silva"
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>

        <Input
          label={PIN_ROLES.includes(form.role) ? 'PIN * (4 dígitos numéricos)' : 'Senha * (mínimo 8 caracteres)'}
          type={PIN_ROLES.includes(form.role) ? 'text' : 'password'}
          inputMode={PIN_ROLES.includes(form.role) ? 'numeric' : undefined}
          maxLength={PIN_ROLES.includes(form.role) ? 4 : undefined}
          value={form.password}
          onChange={(e) => {
            const v = PIN_ROLES.includes(form.role) ? e.target.value.replace(/\D/g, '').slice(0, 4) : e.target.value;
            setForm({ ...form, password: v });
          }}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="label-caps">Função *</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
            >
              {roleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="label-caps">Tenant *</label>
            <input
              list="tenants-list"
              value={form.tenantId}
              onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
              placeholder="Existente ou novo"
              className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
            <datalist id="tenants-list">
              {tenants.map(t => <option key={t} value={t} />)}
            </datalist>
          </div>
        </div>

        <p className="text-xs text-text-muted">
          ℹ Selecione um tenant existente ou digite um novo — um banco isolado será criado automaticamente.
          {isMaster && ' Como master, você pode criar usuários de qualquer tipo.'}
          {!isMaster && !isLojista && ' Como admin, você só pode criar lojistas, gerentes e vendedores.'}
          {isLojista && ' Como lojista, você só pode criar vendedores e gerentes no seu tenant.'}
        </p>

        <div className="flex gap-2 justify-end pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={submitting}>Criar Usuário</Button>
        </div>
      </form>
    </Modal>
  );
}

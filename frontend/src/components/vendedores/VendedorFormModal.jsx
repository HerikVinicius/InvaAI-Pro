import { useEffect, useState } from 'react';
import { User, AtSign, Lock } from 'lucide-react';
import api from '../../services/api';
import { vendedoresService } from '../../services/vendedoresService';
import { useFormSubmit } from '../../hooks/useFormSubmit';
import { validateUsername, validatePassword } from '../../constants/validation';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

const JOBTITLE_OPTIONS = [
  { value: 'Vendedor', label: 'Vendedor' },
  { value: 'Gerente',  label: 'Gerente'  },
];

export default function VendedorFormModal({ open, onClose, vendedor, onSaved }) {
  const isEdit = !!vendedor;

  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'vendedor', jobTitle: 'Vendedor', warehouseUnit: '', salesTarget: '' });

  useEffect(() => {
    if (open) {
      if (vendedor) {
        setForm({
          name: vendedor.name || '',
          username: '',
          password: '',
          role: 'vendedor',
          jobTitle: vendedor.jobTitle && JOBTITLE_OPTIONS.some(o => o.value === vendedor.jobTitle) ? vendedor.jobTitle : 'Vendedor',
          warehouseUnit: vendedor.warehouseUnit || '',
          salesTarget: vendedor.salesTarget ?? '',
        });
      } else {
        setForm({ name: '', username: '', password: '', role: 'vendedor', jobTitle: 'Vendedor', warehouseUnit: '', salesTarget: '' });
      }
    }
  }, [open, vendedor]);

  const usernameValid = !form.username || /^(?![._])(?!.*[._]$)[a-z0-9._]{3,30}$/.test(form.username);
  const pinValid = /^\d{4}$/.test(form.password);

  const { submitting, handleSubmit } = useFormSubmit(
    async () => {
      if (!form.name?.trim()) throw new Error('Nome completo é obrigatório.');

      if (isEdit) {
        if (!form.jobTitle) throw new Error('Cargo é obrigatório.');
        if (!form.warehouseUnit?.trim()) throw new Error('Unidade/Armazém é obrigatório.');
        if (form.salesTarget === '' || form.salesTarget === null || Number.isNaN(Number(form.salesTarget))) {
          throw new Error('Meta de Vendas é obrigatória.');
        }

        await vendedoresService.update(vendedor._id, {
          name: form.name.trim(),
          jobTitle: form.jobTitle,
          warehouseUnit: form.warehouseUnit.trim(),
          salesTarget: Number(form.salesTarget),
        });
      } else {
        if (!form.username?.trim()) throw new Error('Username é obrigatório.');

        const usernameError = validateUsername(form.username);
        if (usernameError) throw new Error(usernameError);

        const passwordError = validatePassword(form.password, true);
        if (passwordError) throw new Error(passwordError);

        await api.post('/users', {
          name: form.name.trim(),
          username: form.username.toLowerCase(),
          password: form.password,
          role: form.role,
        });
      }
    },
    {
      successMessage: isEdit
        ? 'Vendedor atualizado.'
        : `${form.role === 'gerente' ? 'Gerente' : 'Vendedor'} @${form.username.toLowerCase()} criado.`,
      onSuccess: onSaved
    }
  );

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar Colaborador' : 'Adicionar Colaborador'} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome Completo *"
          icon={User}
          placeholder="Ex.: João da Silva"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          autoFocus
        />

        {!isEdit && (
          <>
            <div>
              <Input
                label="Username *"
                icon={AtSign}
                placeholder="joao.silva"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
                autoCapitalize="none"
                autoCorrect="off"
              />
              <div className={`mt-1 text-xs ${form.username && !usernameValid ? 'text-status-critical' : 'text-text-muted'}`}>
                {form.username && !usernameValid ? 'Use 3-30 letras, números, "." ou "_".' : 'Login do colaborador no sistema.'}
              </div>
            </div>

            <div>
              <Input
                label="PIN de 4 dígitos *"
                icon={Lock}
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="0000"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value.replace(/\D/g, '').slice(0, 4) })}
              />
              <div className={`mt-1 text-xs ${form.password && !pinValid ? 'text-status-critical' : 'text-text-muted'}`}>
                {form.password && !pinValid ? 'PIN deve ter exatamente 4 dígitos numéricos.' : 'Senha curta de uso rápido no PDV. Você pode redefinir depois.'}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="label-caps">Função *</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
              >
                <option value="vendedor">Vendedor</option>
                <option value="gerente">Gerente (acesso ao Ranking)</option>
              </select>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/30 rounded-md p-3 text-xs text-text-secondary">
              <span className="font-semibold text-amber-200">ℹ Informe o PIN ao colaborador.</span>
              {' '}Não existe recuperação por email — só você (lojista) pode redefini-lo depois.
            </div>
          </>
        )}

        {isEdit && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="label-caps">Cargo *</label>
              <select
                value={form.jobTitle}
                onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
              >
                {JOBTITLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <Input
              label="Unidade / Armazém *"
              placeholder="Ex.: Delta-9"
              value={form.warehouseUnit}
              onChange={(e) => setForm({ ...form, warehouseUnit: e.target.value })}
            />
            <Input
              label="Meta de Vendas (R$) *"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={form.salesTarget}
              onChange={(e) => setForm({ ...form, salesTarget: e.target.value })}
            />
          </>
        )}

        <div className="flex gap-2 justify-end pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={submitting}
            disabled={
              !form.name ||
              (!isEdit && (!form.username || !pinValid || !usernameValid)) ||
              (isEdit && (!form.jobTitle || !form.warehouseUnit?.trim() || form.salesTarget === ''))
            }
          >
            {isEdit ? 'Salvar Alterações' : 'Adicionar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

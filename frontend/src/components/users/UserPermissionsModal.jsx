import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../ui/Modal';
import Switch from '../ui/Switch';
import Button from '../ui/Button';
import { SkeletonRow } from '../ui/Skeleton';

// Padrões por role (espelha permissionHelper.js do backend).
const ROLE_DEFAULTS = {
  permitir_abrir_caixa:      { master: true, admin: true, lojista: true, gerente: true, vendedor: false },
  permitir_cadastrar_produto: { master: true, admin: true, lojista: true, gerente: true, vendedor: false },
};

/**
 * Modal de gestão de permissões por override.
 *
 * Aceita dois modos:
 *   - user   (object) — objeto User já carregado (usado em Users.jsx)
 *   - userId (string) — busca o User via GET /users/:userId ao abrir (usado em Vendedores.jsx)
 *
 * null nos campos = usa padrão da role | true/false = override explícito.
 */
export default function UserPermissionsModal({ open, onClose, user: userProp, userId, onSaved }) {
  const [user, setUser]                   = useState(userProp || null);
  const [loadingUser, setLoadingUser]     = useState(false);
  const [abrirCaixa, setAbrirCaixa]       = useState(null);
  const [cadastrarProduto, setCadastrarProduto] = useState(null);
  const [submitting, setSubmitting]       = useState(false);

  // Quando abre via userId, busca o User no backend.
  useEffect(() => {
    if (!open) return;
    if (userProp) {
      setUser(userProp);
      setAbrirCaixa(userProp.permitir_abrir_caixa ?? null);
      setCadastrarProduto(userProp.permitir_cadastrar_produto ?? null);
      return;
    }
    if (userId) {
      setLoadingUser(true);
      api.get(`/users/${userId}`)
        .then((res) => {
          const u = res.data.user;
          setUser(u);
          setAbrirCaixa(u.permitir_abrir_caixa ?? null);
          setCadastrarProduto(u.permitir_cadastrar_produto ?? null);
        })
        .catch(() => toast.error('Falha ao carregar dados do usuário.'))
        .finally(() => setLoadingUser(false));
    }
  }, [open, userProp, userId]);

  // Limpa ao fechar.
  useEffect(() => {
    if (!open) { setUser(userProp || null); }
  }, [open]);

  if (!open) return null;

  const defaultCaixa   = ROLE_DEFAULTS.permitir_abrir_caixa[user?.role]      ?? false;
  const defaultProduto = ROLE_DEFAULTS.permitir_cadastrar_produto[user?.role] ?? false;

  const effectiveCaixa   = abrirCaixa       !== null ? abrirCaixa       : defaultCaixa;
  const effectiveProduto = cadastrarProduto  !== null ? cadastrarProduto : defaultProduto;

  const hasOverrideCaixa   = abrirCaixa       !== null && abrirCaixa       !== defaultCaixa;
  const hasOverrideProduto = cadastrarProduto  !== null && cadastrarProduto !== defaultProduto;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      await api.patch(`/users/${user._id}`, {
        permitir_abrir_caixa:      abrirCaixa,
        permitir_cadastrar_produto: cadastrarProduto,
      });
      toast.success(`Permissões de ${user.name} atualizadas.`);
      onSaved?.({ ...user, permitir_abrir_caixa: abrirCaixa, permitir_cadastrar_produto: cadastrarProduto });
      onClose();
    } catch (err) {
      toast.error(err.message || 'Falha ao atualizar permissões.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={user ? `Permissões — ${user.name}` : 'Permissões'} size="sm">
      {loadingUser ? (
        <div className="space-y-3 py-2">
          <SkeletonRow columns={1} />
          <SkeletonRow columns={1} />
        </div>
      ) : !user ? (
        <p className="text-sm text-text-secondary py-4 text-center">Usuário não encontrado.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Cabeçalho do usuário */}
          <div className="flex items-start gap-3 p-3 bg-background rounded-md border border-border">
            <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {user.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs text-text-muted mt-0.5">
                @{user.username} · <span className="capitalize">{user.role}</span>
                {user.tenantId && <> · {user.tenantId}</>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <PermissionRow
              icon={<span className="text-base">🔒</span>}
              label="Abrir / Fechar Caixa"
              description="Permite abrir e fechar turnos de caixa, e registrar sangrias."
              checked={effectiveCaixa}
              isOverride={hasOverrideCaixa}
              defaultValue={defaultCaixa}
              onChange={(val) => setAbrirCaixa(val === defaultCaixa ? null : val)}
            />
            <PermissionRow
              icon={<span className="text-base">📦</span>}
              label="Cadastrar / Editar Produtos"
              description="Permite adicionar e atualizar produtos no estoque."
              checked={effectiveProduto}
              isOverride={hasOverrideProduto}
              defaultValue={defaultProduto}
              onChange={(val) => setCadastrarProduto(val === defaultProduto ? null : val)}
            />
          </div>

          {(hasOverrideCaixa || hasOverrideProduto) && (
            <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">
              ⚠ Este usuário tem overrides ativos que diferem do padrão da role <strong>{user.role}</strong>.
            </p>
          )}

          <div className="text-xs text-text-muted border-t border-border pt-3">
            Switches em <strong className="text-text-secondary">cinza</strong> usam o padrão da role.{' '}
            <button
              type="button"
              onClick={() => { setAbrirCaixa(null); setCadastrarProduto(null); }}
              className="text-accent hover:underline"
            >
              Restaurar padrões
            </button>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={submitting} icon={ShieldCheck}>Salvar Permissões</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function PermissionRow({ icon, label, description, checked, isOverride, defaultValue, onChange }) {
  return (
    <div className={`flex items-start justify-between gap-4 p-3 rounded-md border transition-colors ${
      isOverride ? 'border-accent/40 bg-accent/5' : 'border-border bg-surface'
    }`}>
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <span className="mt-0.5 flex-shrink-0">{icon}</span>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{label}</span>
            {isOverride && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-accent/15 text-accent uppercase tracking-wide">
                Override
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-0.5">{description}</p>
          {!isOverride && (
            <p className="text-[10px] text-text-muted mt-1 italic">
              Padrão da role: {defaultValue ? 'permitido' : 'negado'}
            </p>
          )}
        </div>
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}

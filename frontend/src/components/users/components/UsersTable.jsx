import { MessageSquare, Building2, CheckCircle2, Ban, Pencil, Key, Zap } from 'lucide-react';
import { SkeletonRow } from '../../ui/Skeleton';

const ROLE_BADGE = {
  admin:    { label: 'Admin',    bg: 'bg-purple-500/15', text: 'text-purple-300' },
  master:   { label: 'Master',   bg: 'bg-accent/15',     text: 'text-accent'      },
  lojista:  { label: 'Lojista',  bg: 'bg-sky-500/15',    text: 'text-sky-300'     },
  vendedor: { label: 'Vendedor', bg: 'bg-amber-500/15',  text: 'text-amber-300'   },
  gerente:  { label: 'Gerente',  bg: 'bg-green-500/15',  text: 'text-green-300'   },
};

export default function UsersTable({
  usersFiltrados,
  users,
  loading,
  isMaster,
  isAdmin,
  isLojista,
  onEditClick,
  onResetClick,
  onToggleChat,
  onChangeRole,
  onToggleActive,
}) {
  const roleOptions = isMaster
    ? [
        { value: 'master',   label: 'Master'   },
        { value: 'admin',    label: 'Admin'    },
        { value: 'lojista',  label: 'Lojista'  },
        { value: 'gerente',  label: 'Gerente'  },
        { value: 'vendedor', label: 'Vendedor' },
      ]
    : [
        { value: 'lojista',  label: 'Lojista'  },
        { value: 'gerente',  label: 'Gerente'  },
        { value: 'vendedor', label: 'Vendedor' },
      ];

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-surface-elevated border-b border-border">
            <th className="text-left px-4 py-3 label-caps">Nome</th>
            <th className="text-left px-4 py-3 label-caps">Username</th>
            <th className="text-left px-4 py-3 label-caps">Tenant</th>
            <th className="text-left px-4 py-3 label-caps">Função</th>
            <th className="text-center px-4 py-3 label-caps">Status</th>
            <th className="text-center px-4 py-3 label-caps">Chat IA</th>
            <th className="text-right px-4 py-3 label-caps">Ações</th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} columns={7} />)
            : usersFiltrados.length === 0
              ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-text-secondary text-sm">
                    {users.length === 0
                      ? 'Nenhum usuário encontrado.'
                      : 'Nenhum usuário corresponde aos filtros aplicados.'}
                  </td>
                </tr>
              )
              : usersFiltrados.map((u) => {
                const initials = u.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <tr key={u._id} className="border-b border-border hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-semibold">
                          {initials}
                        </div>
                        <span className="text-sm font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="data-mono text-xs text-text-secondary">@{u.username}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 bg-surface-elevated border border-border rounded inline-flex items-center gap-1.5 data-mono">
                        <Building2 className="w-3 h-3 text-text-muted" />
                        {u.tenantId}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {isAdmin && ['master', 'admin'].includes(u.role) ? (
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded border ${ROLE_BADGE[u.role]?.bg} ${ROLE_BADGE[u.role]?.text}`}>
                            {ROLE_BADGE[u.role]?.label}
                          </span>
                        ) : isLojista ? (
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded border ${ROLE_BADGE[u.role]?.bg} ${ROLE_BADGE[u.role]?.text}`}>
                            {ROLE_BADGE[u.role]?.label}
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => onChangeRole(u._id, e.target.value)}
                            className={`bg-background border border-border rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:border-accent ${ROLE_BADGE[u.role]?.text}`}
                          >
                            {roleOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        )}
                        {(u.permitir_abrir_caixa !== null && u.permitir_abrir_caixa !== undefined) ||
                         (u.permitir_cadastrar_produto !== null && u.permitir_cadastrar_produto !== undefined) ? (
                          <span
                            title="Tem permissões com override ativo"
                            className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20"
                          >
                            <Zap className="w-2.5 h-2.5" />
                            OVR
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs text-accent">
                          <CheckCircle2 className="w-3 h-3" /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-status-critical">
                          <Ban className="w-3 h-3" /> Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onToggleChat(u._id, u.aiChatEnabled)}
                        disabled={isAdmin && ['master', 'admin'].includes(u.role)}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded disabled:opacity-40 disabled:cursor-not-allowed ${
                          u.aiChatEnabled ? 'bg-accent/15 text-accent' : 'bg-status-critical/15 text-status-critical'
                        }`}
                      >
                        <MessageSquare className="w-3 h-3" />
                        {u.aiChatEnabled ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isAdmin && ['master', 'admin'].includes(u.role) ? (
                        <span className="text-xs text-text-muted">—</span>
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => onEditClick(u)}
                            className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                            title="Editar nome"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onResetClick(u)}
                            className="p-1.5 rounded text-text-muted hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                            title="Redefinir senha"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onToggleActive(u._id, u.isActive)}
                            className={`ml-1 text-xs font-medium hover:underline ${u.isActive ? 'text-status-critical' : 'text-accent'}`}
                          >
                            {u.isActive ? 'Desativar' : 'Ativar'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}

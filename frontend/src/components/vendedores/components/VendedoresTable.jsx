import { Edit2, Ban, UserX, SlidersHorizontal } from 'lucide-react';
import { SkeletonRow } from '../../ui/Skeleton';

export default function VendedoresTable({
  vendedoresFiltrados = [],
  vendedores = [],
  pagination = {},
  loading = false,
  canManage = false,
  onOpenModal = () => {},
  onLoadPage = () => {},
  onToggleActive = () => {},
  onPermissionsOpen = () => {},
}) {
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-surface-elevated border-b border-border">
            <th className="text-left px-4 py-3 label-caps">Colaborador</th>
            <th className="text-left px-4 py-3 label-caps">Unidade/Armazém</th>
            <th className="text-left px-4 py-3 label-caps">Meta (Realizado vs Alvo)</th>
            <th className="text-right px-4 py-3 label-caps">Ações</th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} columns={4} />)
            : vendedoresFiltrados.length === 0
            ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-text-secondary text-sm">
                  {vendedores.length === 0
                    ? <>{`Nenhum vendedor ainda.`} {canManage && 'Clique em "Adicionar Novo Vendedor" para adicionar um.'}</>
                    : 'Nenhum vendedor encontrado com os filtros aplicados.'}
                </td>
              </tr>
            )
            : vendedoresFiltrados.map((v) => {
              const initials = v.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
              const pct = v.achievementPercentage || 0;
              const tone = pct >= 100 ? 'bg-accent' : pct >= 80 ? 'bg-accent/70' : 'bg-status-critical/70';
              return (
                <tr key={v._id} className="border-b border-border hover:bg-surface-hover transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-semibold">
                        {initials}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{v.name}</div>
                        <div className="text-xs text-text-muted">{v.jobTitle || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 bg-surface-elevated border border-border rounded inline-flex items-center gap-1">
                      🏛 {v.warehouseUnit || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 w-72">
                    <div className="flex items-baseline justify-between text-xs mb-1">
                      <span className="data-mono">R$ {(v.salesRealized || 0).toLocaleString('pt-BR')} ({pct}%)</span>
                      <span className="text-text-muted">Alvo: R$ {((v.salesTarget || 0) / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                      <div className={`h-full ${tone} transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => onOpenModal(v)}
                        className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                        title="Editar vendedor"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {canManage && v.userId && (
                        <button
                          onClick={() => onPermissionsOpen(v.userId)}
                          className="p-1.5 rounded text-text-muted hover:text-sky-300 hover:bg-sky-500/10 transition-colors"
                          title="Gerenciar permissões"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onToggleActive(v)}
                        className={`p-1.5 rounded transition-colors ${
                          v.isActive
                            ? 'text-text-muted hover:text-status-critical hover:bg-status-critical/10'
                            : 'text-accent hover:text-accent/70 hover:bg-accent/10'
                        }`}
                        title={v.isActive ? 'Desativar vendedor' : 'Reativar vendedor'}
                      >
                        {v.isActive ? <Ban className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>

      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <span className="text-xs text-text-secondary">
          Exibindo {vendedoresFiltrados.length} de {vendedores.length} vendedores
        </span>
        <div className="flex gap-1">
          {Array.from({ length: Math.min(pagination.pages, 5) }).map((_, i) => (
            <button
              key={i}
              onClick={() => onLoadPage(i + 1)}
              className={`w-7 h-7 rounded text-xs font-medium ${
                pagination.page === i + 1
                  ? 'bg-accent text-background'
                  : 'border border-border text-text-secondary hover:bg-surface-hover'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

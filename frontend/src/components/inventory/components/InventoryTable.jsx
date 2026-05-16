import { Edit2, History } from 'lucide-react';
import { SkeletonRow } from '../../ui/Skeleton';
import Badge from '../../ui/Badge';

export default function InventoryTable({
  products,
  pagination,
  loading,
  canWrite,
  lowStock,
  noCostPrice,
  onEditClick,
  onLogsClick,
  onPageChange,
}) {
  const emptyMessage = noCostPrice
    ? 'Todos os produtos já possuem preço de custo cadastrado.'
    : lowStock
    ? 'Nenhum produto com estoque abaixo do limite de aviso.'
    : canWrite
    ? 'Nenhum produto ainda. Clique em "Adicionar Produto" para começar.'
    : 'Nenhum produto cadastrado.';

  return (
    <div id="print-inventory-table" className="bg-surface border border-border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-surface-elevated border-b border-border">
            <th className="text-left px-4 py-3 label-caps">Nome do Produto</th>
            <th className="text-left px-4 py-3 label-caps">Código</th>
            <th className="text-left px-4 py-3 label-caps">Categoria</th>
            <th className="text-right px-4 py-3 label-caps">Quantidade</th>
            <th className="text-left px-4 py-3 label-caps">Status</th>
            <th className="text-right px-4 py-3 label-caps">Preço</th>
            <th className="text-right px-4 py-3 label-caps print:hidden">Ações</th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} columns={7} />)
            : products.length === 0
            ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-text-secondary text-sm">
                  {emptyMessage}
                </td>
              </tr>
            )
            : products.map((p) => (
              <tr key={p._id} className="border-b border-border hover:bg-surface-hover transition-colors">
                <td className="px-4 py-3 text-sm">{p.name}</td>
                <td className="px-4 py-3"><span className="data-mono text-text-secondary">{p.sku}</span></td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 bg-surface-elevated border border-border rounded">
                    {p.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-right data-mono">{p.quantity}</td>
                <td className="px-4 py-3"><Badge variant={p.status} /></td>
                <td className="px-4 py-3 text-right data-mono">R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-right print:hidden">
                  <div className="inline-flex items-center gap-1">
                    <button
                      onClick={() => onLogsClick(p)}
                      className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                      aria-label="Ver histórico"
                      title="Histórico de movimentações"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                    {canWrite && (
                      <button
                        onClick={() => onEditClick(p)}
                        className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                        aria-label="Editar"
                        title="Editar produto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      <div className="flex items-center justify-between px-4 py-3 border-t border-border print:hidden">
        <span className="text-xs text-text-secondary">
          Mostrando {products.length} de {pagination.total} produtos
        </span>
        <div className="flex gap-1">
          {Array.from({ length: Math.min(pagination.pages, 5) }).map((_, i) => (
            <button
              key={i}
              onClick={() => onPageChange(i + 1)}
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

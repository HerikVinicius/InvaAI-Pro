import { Plus, Upload, AlertTriangle, Printer, Tag, Search, Warehouse, X } from 'lucide-react';
import Button from '../../ui/Button';
import InventorySummary from '../components/InventorySummary';
import InventoryTable from '../components/InventoryTable';

export default function InventoryPage({
  products,
  pagination,
  loading,
  canWrite,
  isLojista,
  criticalCount,
  lowStock,
  noCostPrice,
  search,
  warehouse,
  warehouses,
  onLowStockToggle,
  onNoCostPriceToggle,
  onSearchChange,
  onWarehouseChange,
  onClearFilters,
  onPrint,
  onCreateClick,
  onEditClick,
  onLogsClick,
  onImportClick,
  onPageChange,
}) {
  const hasActiveFilter = lowStock || noCostPrice || search || warehouse;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-semibold">Gerenciamento de Estoque</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Monitoramento de estoque em tempo real para Warehouse Delta-9
          </p>
        </div>
        <div className="flex gap-2">
          {canWrite && (
            <>
              <Button variant="secondary" icon={Upload} onClick={onImportClick}>
                Importar
              </Button>
              <Button icon={Plus} onClick={onCreateClick}>
                Adicionar Produto
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="print:hidden">
        <InventorySummary
          total={pagination.total}
          criticalCount={criticalCount}
          warehouse={warehouse}
        />
      </div>

      {/* Barra de pesquisa + armazém */}
      <div className="flex items-center gap-3 flex-wrap print:hidden">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome ou código..."
            className="w-full bg-surface border border-border rounded-md pl-9 pr-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filtro de armazém */}
        <div className="relative">
          <Warehouse className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
          <select
            value={warehouse}
            onChange={(e) => onWarehouseChange(e.target.value)}
            className={`appearance-none bg-surface border rounded-md pl-9 pr-7 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-colors ${
              warehouse
                ? 'border-accent/50 text-text-primary'
                : 'border-border text-text-secondary'
            }`}
          >
            <option value="">Todos os armazéns</option>
            {warehouses.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtros de toggle + ações */}
      <div className="flex items-center gap-3 flex-wrap print:hidden">
        <button
          onClick={onLowStockToggle}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
            lowStock
              ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
              : 'bg-surface border-border text-text-secondary hover:border-amber-500/40 hover:text-amber-300'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Produtos esgotando
          {lowStock && (
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 font-semibold">
              {pagination.total}
            </span>
          )}
        </button>

        {isLojista && (
          <button
            onClick={onNoCostPriceToggle}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
              noCostPrice
                ? 'bg-violet-500/15 border-violet-500/50 text-violet-300'
                : 'bg-surface border-border text-text-secondary hover:border-violet-500/40 hover:text-violet-300'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Sem preço de custo
            {noCostPrice && (
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 font-semibold">
                {pagination.total}
              </span>
            )}
          </button>
        )}

        {hasActiveFilter && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-3 h-3" />
            Limpar filtros
          </button>
        )}

        <button
          onClick={onPrint}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-surface text-text-secondary hover:text-accent hover:border-accent/40 text-sm font-medium transition-colors ml-auto"
        >
          <Printer className="w-3.5 h-3.5" />
          Imprimir
        </button>
      </div>

      {/* Cabeçalho visível apenas na impressão */}
      <div className="hidden print:block mb-4">
        <h1 className="text-lg font-bold">
          Relatório de Estoque
          {lowStock ? ' — Produtos Esgotando' : noCostPrice ? ' — Sem Preço de Custo' : ''}
          {warehouse ? ` — Armazém: ${warehouse}` : ''}
        </h1>
        <p className="text-xs text-gray-500">
          Gerado em {new Date().toLocaleString('pt-BR')} · {pagination.total} produto(s)
        </p>
      </div>

      <InventoryTable
        products={products}
        pagination={pagination}
        loading={loading}
        canWrite={canWrite}
        lowStock={lowStock}
        noCostPrice={noCostPrice}
        onEditClick={onEditClick}
        onLogsClick={onLogsClick}
        onPageChange={onPageChange}
      />
    </div>
  );
}

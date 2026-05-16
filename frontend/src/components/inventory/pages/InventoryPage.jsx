import { Plus, Upload, AlertTriangle, Printer } from 'lucide-react';
import Button from '../../ui/Button';
import InventorySummary from '../components/InventorySummary';
import InventoryTable from '../components/InventoryTable';

export default function InventoryPage({
  products,
  pagination,
  loading,
  canWrite,
  criticalCount,
  lowStock,
  onLowStockToggle,
  onPrint,
  onCreateClick,
  onEditClick,
  onLogsClick,
  onImportClick,
  onPageChange,
}) {
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
        />
      </div>

      {/* Barra de filtros e ações */}
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
          Relatório de Estoque{lowStock ? ' — Produtos Esgotando' : ''}
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
        onEditClick={onEditClick}
        onLogsClick={onLogsClick}
        onPageChange={onPageChange}
      />
    </div>
  );
}

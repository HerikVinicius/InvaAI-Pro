import { Plus, Upload, Boxes, AlertTriangle } from 'lucide-react';
import Button from '../../ui/Button';
import InventorySummary from '../components/InventorySummary';
import InventoryTable from '../components/InventoryTable';

export default function InventoryPage({
  products,
  pagination,
  loading,
  canWrite,
  criticalCount,
  onCreateClick,
  onEditClick,
  onLogsClick,
  onImportClick,
  onPageChange,
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Gerenciamento de Estoque</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Monitoramento de estoque em tempo real para Warehouse Delta-9
          </p>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <Button variant="secondary" icon={Upload} onClick={onImportClick}>
              Importar
            </Button>
            <Button icon={Plus} onClick={onCreateClick}>
              Adicionar Produto
            </Button>
          </div>
        )}
      </div>

      <InventorySummary
        total={pagination.total}
        criticalCount={criticalCount}
      />

      <InventoryTable
        products={products}
        pagination={pagination}
        loading={loading}
        canWrite={canWrite}
        onEditClick={onEditClick}
        onLogsClick={onLogsClick}
        onPageChange={onPageChange}
      />
    </div>
  );
}

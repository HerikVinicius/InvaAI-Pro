import { useState } from 'react';
import { useInventoryData } from '../../../hooks/useInventoryData';
import InventoryPage from '../pages/InventoryPage';
import ProductFormModal from '../ProductFormModal';
import InventoryLogsModal from '../InventoryLogsModal';
import ImportModal from '../ImportModal';

export default function InventoryContainer() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [logsTarget, setLogsTarget] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  const {
    products, pagination, loading,
    canWrite, isLojista, criticalCount,
    lowStock, setLowStock,
    noCostPrice, setNoCostPrice,
    search, setSearch,
    warehouse, setWarehouse, warehouses,
    clearFilters,
    reload,
  } = useInventoryData();

  const handlePrint = () => window.print();

  const handleSaved = () => {
    setModalOpen(false);
    setEditing(null);
    reload(pagination.page);
  };

  const handleImported = () => {
    setImportOpen(false);
    reload(1);
  };

  const pageProps = {
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
    onLowStockToggle: () => setLowStock((v) => !v),
    onNoCostPriceToggle: () => setNoCostPrice((v) => !v),
    onSearchChange: setSearch,
    onWarehouseChange: setWarehouse,
    onClearFilters: clearFilters,
    onPrint: handlePrint,
    onCreateClick: () => { setEditing(null); setModalOpen(true); },
    onEditClick: (product) => { setEditing(product); setModalOpen(true); },
    onLogsClick: setLogsTarget,
    onImportClick: () => setImportOpen(true),
    onPageChange: reload,
  };

  return (
    <>
      <InventoryPage {...pageProps} />

      <ProductFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        product={editing}
        onSaved={handleSaved}
      />

      <InventoryLogsModal
        open={!!logsTarget}
        product={logsTarget}
        onClose={() => setLogsTarget(null)}
      />

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={handleImported}
      />
    </>
  );
}

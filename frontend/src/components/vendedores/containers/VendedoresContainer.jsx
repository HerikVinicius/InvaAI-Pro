import { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useVendedoresData } from '../../../hooks/useVendedoresData';
import VendedoresPage from '../pages/VendedoresPage';
import VendedorFormModal from '../VendedorFormModal';
import UserPermissionsModal from '../../users/UserPermissionsModal';

export default function VendedoresContainer() {
  const { user } = useAuthStore();
  const { vendedores, pagination, loading, load, toggleActive } = useVendedoresData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState(null);
  const [permissionsTarget, setPermissionsTarget] = useState(null);

  const canManage = ['master', 'admin', 'lojista'].includes(user?.role);

  const handleOpenModal = (vendedor = null) => {
    setEditingVendedor(vendedor);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingVendedor(null);
  };

  const handleVendedorSaved = () => {
    handleCloseModal();
    load(pagination.page);
  };

  const handleToggleActive = async (vendedor) => {
    const success = await toggleActive(vendedor);
    if (success) {
      load(pagination.page);
    }
  };

  return (
    <>
      <VendedoresPage
        vendedores={vendedores}
        pagination={pagination}
        loading={loading}
        canManage={canManage}
        onOpenModal={handleOpenModal}
        onLoadPage={load}
        onToggleActive={handleToggleActive}
        onPermissionsOpen={setPermissionsTarget}
      />

      <VendedorFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        vendedor={editingVendedor}
        onSaved={handleVendedorSaved}
      />

      <UserPermissionsModal
        open={!!permissionsTarget}
        userId={permissionsTarget}
        onClose={() => setPermissionsTarget(null)}
        onSaved={() => setPermissionsTarget(null)}
      />
    </>
  );
}

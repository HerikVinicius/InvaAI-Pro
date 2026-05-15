import { useState } from 'react';
import { useUsersData } from '../../../hooks/useUsersData';
import UsersPage from '../pages/UsersPage';
import CreateUserModal from '../CreateUserModal';
import EditUserModal from '../EditUserModal';
import ResetPasswordModal from '../ResetPasswordModal';

export default function UsersContainer() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);

  const usersData = useUsersData();
  const {
    users,
    usersFiltrados,
    loading,
    search,
    setSearch,
    filtroTenant,
    setFiltroTenant,
    filtroRole,
    setFiltroRole,
    tenants,
    summary,
    isMaster,
    isAdmin,
    isLojista,
    canAccess,
    reload,
    toggleChat,
    changeRole,
    toggleActive,
  } = usersData;

  const handleCreated = () => {
    setModalOpen(false);
    reload();
  };

  const handleEditSaved = () => {
    setEditTarget(null);
    reload();
  };

  const pageProps = {
    usersFiltrados,
    users,
    loading,
    search,
    onSearchChange: setSearch,
    filtroTenant,
    onFilterTenantChange: setFiltroTenant,
    filtroRole,
    onFilterRoleChange: setFiltroRole,
    tenants,
    summary,
    isMaster,
    isAdmin,
    isLojista,
    canAccess,
    onCreateClick: () => setModalOpen(true),
    onEditClick: setEditTarget,
    onResetClick: setResetTarget,
    onToggleChat: toggleChat,
    onChangeRole: changeRole,
    onToggleActive: toggleActive,
  };

  return (
    <>
      <UsersPage {...pageProps} />

      <CreateUserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleCreated}
        tenants={tenants.filter(t => t !== 'todos')}
        isMaster={isMaster}
        isLojista={isLojista}
        userTenantId={isLojista ? usersData.user?.tenantId : ''}
      />

      <EditUserModal
        open={!!editTarget}
        user={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={handleEditSaved}
      />

      <ResetPasswordModal
        open={!!resetTarget}
        user={resetTarget}
        onClose={() => setResetTarget(null)}
      />
    </>
  );
}

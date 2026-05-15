import { Shield, Plus } from 'lucide-react';
import Button from '../../ui/Button';
import UsersSummary from '../components/UsersSummary';
import UsersFilters from '../components/UsersFilters';
import UsersTable from '../components/UsersTable';

export default function UsersPage({
  usersFiltrados,
  users,
  loading,
  search,
  onSearchChange,
  filtroTenant,
  onFilterTenantChange,
  filtroRole,
  onFilterRoleChange,
  tenants,
  summary,
  isMaster,
  isAdmin,
  isLojista,
  canAccess,
  onCreateClick,
  onEditClick,
  onResetClick,
  onToggleChat,
  onChangeRole,
  onToggleActive,
}) {
  if (!canAccess) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
        <p className="text-sm text-text-secondary">Acesso negado. Apenas Master, Admin e Lojista podem gerenciar usuários.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-text-muted">Home › Administração › Usuários</div>
          <h1 className="text-xl font-semibold mt-1">
            {isMaster ? 'Gerenciamento Global de Usuários' : 'Gerenciamento de Lojistas e Vendedores'}
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {isMaster
              ? 'Visão completa de todos os usuários do sistema (banco main + tenants).'
              : 'Visualize e gerencie todos os lojistas e vendedores cadastrados no sistema.'}
          </p>
        </div>
        <Button icon={Plus} onClick={onCreateClick}>
          Adicionar Usuário
        </Button>
      </div>

      <UsersSummary
        summary={summary}
        isMaster={isMaster}
      />

      <UsersFilters
        search={search}
        onSearchChange={onSearchChange}
        filtroTenant={filtroTenant}
        onFilterTenantChange={onFilterTenantChange}
        filtroRole={filtroRole}
        onFilterRoleChange={onFilterRoleChange}
        tenants={tenants}
        isMaster={isMaster}
        onClearFilters={() => {
          onSearchChange('');
          onFilterTenantChange('todos');
          onFilterRoleChange('todos');
        }}
      />

      <UsersTable
        usersFiltrados={usersFiltrados}
        users={users}
        loading={loading}
        isMaster={isMaster}
        isAdmin={isAdmin}
        isLojista={isLojista}
        onEditClick={onEditClick}
        onResetClick={onResetClick}
        onToggleChat={onToggleChat}
        onChangeRole={onChangeRole}
        onToggleActive={onToggleActive}
      />
    </div>
  );
}

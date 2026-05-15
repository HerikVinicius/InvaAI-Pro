import { useMemo } from 'react';

/**
 * Hook para centralizar lógica de permissões baseada em role do usuário.
 * Elimina lógica condicional espalhada pelos componentes.
 *
 * @param {Object} user - Objeto do usuário com propriedade 'role'
 * @returns {Object} Objeto com flags de permissão e funções helper
 *
 * @example
 * const perms = useUserPermissions(user);
 * {perms.canCreateProduct && <Button>Adicionar Produto</Button>}
 */
export function useUserPermissions(user) {
  return useMemo(() => {
    const role = user?.role || null;

    // Flags por role
    const isMaster = role === 'master';
    const isAdmin = role === 'admin';
    const isLojista = role === 'lojista';
    const isVendedor = role === 'vendedor';
    const isGerente = role === 'gerente';

    // Composição de permissões
    return {
      // Role checks
      isMaster,
      isAdmin,
      isLojista,
      isVendedor,
      isGerente,

      // Access levels
      canAccessUsers: isMaster || isAdmin || isLojista,
      canAccessInventory: isMaster || isAdmin || isLojista || isGerente,
      canAccessClientes: isMaster || isAdmin || isLojista || isVendedor,
      canAccessCaixa: isMaster || isAdmin || isLojista || isVendedor,

      // Create permissions
      canCreateUser: isMaster || isAdmin || isLojista,
      canCreateProduct: isMaster || isAdmin || isLojista,
      canCreateCliente: isMaster || isAdmin || isLojista || isVendedor,

      // Edit/Delete permissions
      canEditUser: isMaster || isAdmin || isLojista,
      canDeleteUser: isMaster || isAdmin,
      canEditProduct: isMaster || isAdmin || isLojista,
      canDeleteProduct: isMaster || isAdmin,

      // Role-specific permissions
      canChangeRole: isMaster || isAdmin,
      canResetPassword: isMaster || isAdmin || isLojista,
      canToggleAiChat: isMaster || isAdmin,
      canToggleUserActive: isMaster || isAdmin,

      // Vendedor/Gerente specific
      canMakeSale: isVendedor || isGerente,
      canAccessPDV: isVendedor || isGerente,
      canViewRanking: isGerente,
      canManageSalesTarget: isLojista || isGerente,

      // Admin specific
      canAccessSettings: isMaster || isAdmin,
      canAccessAIInsights: isMaster || isAdmin || isLojista,

      // Helper: pode fazer qualquer coisa
      isSuperUser: isMaster || isAdmin,

      // Helper: pode acessar área restrita
      hasAccess: isMaster || isAdmin || isLojista,
    };
  }, [user?.role]);
}

/**
 * Hook para obter label/badge de role de forma centralizada.
 * Elimina duplicação de ROLE_BADGE em múltiplos arquivos.
 *
 * @param {string} role - Nome do role (ex: 'vendedor', 'admin')
 * @returns {Object} { label, color, bg } para exibição
 *
 * @example
 * const badge = useRoleBadge('vendedor');
 * <span className={badge.bg}>{badge.label}</span>
 */
export function useRoleBadge(role) {
  return useMemo(() => {
    const badges = {
      master: {
        label: 'Master',
        bg: 'bg-accent/15',
        text: 'text-accent',
        color: 'accent',
      },
      admin: {
        label: 'Admin',
        bg: 'bg-purple-500/15',
        text: 'text-purple-300',
        color: 'purple',
      },
      lojista: {
        label: 'Lojista',
        bg: 'bg-sky-500/15',
        text: 'text-sky-300',
        color: 'sky',
      },
      gerente: {
        label: 'Gerente',
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-300',
        color: 'emerald',
      },
      vendedor: {
        label: 'Vendedor',
        bg: 'bg-amber-500/15',
        text: 'text-amber-300',
        color: 'amber',
      },
    };

    return badges[role] || { label: 'Desconhecido', bg: 'bg-gray-500/15', text: 'text-gray-300' };
  }, [role]);
}

/**
 * Hook para obter status de cliente (Quite/Em Aberto).
 * Centraliza lógica de status usado em múltiplos componentes.
 *
 * @param {number} saldoDevedor - Saldo devedor do cliente
 * @returns {Object} { status, label, color, icon }
 *
 * @example
 * const status = useClienteStatus(cliente.saldoDevedor);
 * <Badge color={status.color}>{status.label}</Badge>
 */
export function useClienteStatus(saldoDevedor = 0) {
  return useMemo(() => {
    if (saldoDevedor > 0) {
      return {
        status: 'ABERTO',
        label: 'Em aberto',
        color: 'amber',
        bg: 'bg-amber-500/15',
        text: 'text-amber-300',
        icon: 'AlertCircle',
      };
    }
    return {
      status: 'QUITE',
      label: 'Quite',
      color: 'accent',
      bg: 'bg-accent/15',
      text: 'text-accent',
      icon: 'CheckCircle2',
    };
  }, [saldoDevedor]);
}

/**
 * Hook para obter status de estoque.
 * Elimina lógica inline de verificação de estoque baixo.
 *
 * @param {number} quantity - Quantidade atual
 * @param {number} threshold - Limite crítico
 * @returns {Object} { status, label, color, isCritical }
 *
 * @example
 * const stock = useProductStatus(product.quantity, product.lowStockThreshold);
 * {stock.isCritical && <AlertIcon />}
 */
export function useProductStatus(quantity = 0, threshold = 0) {
  return useMemo(() => {
    if (quantity <= threshold) {
      return {
        status: 'CRITICO',
        label: 'CRÍTICO',
        color: 'critical',
        bg: 'bg-status-critical/15',
        text: 'text-status-critical',
        isCritical: true,
      };
    }
    if (quantity <= threshold * 1.5) {
      return {
        status: 'BAIXO',
        label: 'BAIXO',
        color: 'amber',
        bg: 'bg-amber-500/15',
        text: 'text-amber-300',
        isCritical: false,
      };
    }
    return {
      status: 'OK',
      label: 'OK',
      color: 'accent',
      bg: 'bg-accent/15',
      text: 'text-accent',
      isCritical: false,
    };
  }, [quantity, threshold]);
}

/**
 * Hook para obter status de transação/venda.
 * Centraliza cores e labels de tipo de transação.
 *
 * @param {string} type - Tipo de transação (VENDA, RECEBIMENTO, SANGRIA, ESTORNO)
 * @returns {Object} { label, bg, text, color }
 *
 * @example
 * const txType = useTransactionType('VENDA');
 * <Badge className={txType.bg}>{txType.label}</Badge>
 */
export function useTransactionType(type) {
  return useMemo(() => {
    const types = {
      VENDA: {
        label: 'Venda',
        bg: 'bg-accent/15',
        text: 'text-accent',
        color: 'accent',
      },
      RECEBIMENTO: {
        label: 'Recebimento',
        bg: 'bg-sky-500/15',
        text: 'text-sky-300',
        color: 'sky',
      },
      SANGRIA: {
        label: 'Sangria',
        bg: 'bg-amber-500/15',
        text: 'text-amber-300',
        color: 'amber',
      },
      ESTORNO: {
        label: 'Estorno',
        bg: 'bg-status-critical/15',
        text: 'text-status-critical',
        color: 'critical',
      },
    };

    return types[type] || { label: type, bg: 'bg-gray-500/15', text: 'text-gray-300' };
  }, [type]);
}

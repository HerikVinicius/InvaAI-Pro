/**
 * Funções puras de lógica de negócio
 * Sem efeitos colaterais, sem estado, sem deps externas
 * Fáceis de testar, reutilizar e migrar para backend
 */

// ─────────────────────────────────────────────────────────────
// CLIENTES
// ─────────────────────────────────────────────────────────────

/**
 * Calcula resumo de clientes (total devedor, quantidade com débito)
 * @param {Array} clientes - Lista de clientes
 * @returns {Object} { totalDevedor, comDebito, totalClientes }
 */
export function calculateClientesSummary(clientes = []) {
  return {
    totalDevedor: clientes.reduce((sum, c) => sum + (c.saldoDevedor || 0), 0),
    comDebito: clientes.filter(c => c.saldoDevedor > 0).length,
    totalClientes: clientes.length,
  };
}

/**
 * Determina se cliente está em aberto ou quite
 * @param {number} saldoDevedor - Saldo devedor
 * @returns {string} 'ABERTO' | 'QUITE'
 */
export function getClienteStatus(saldoDevedor = 0) {
  return saldoDevedor > 0 ? 'ABERTO' : 'QUITE';
}

/**
 * Filtra clientes por critérios
 * @param {Array} clientes
 * @param {Object} criteria - { search, onlyWithDebt, phone }
 * @returns {Array} Clientes filtrados
 */
export function filterClientes(clientes = [], criteria = {}) {
  let result = [...clientes];

  if (criteria.onlyWithDebt) {
    result = result.filter(c => c.saldoDevedor > 0);
  }

  if (criteria.search) {
    const q = criteria.search.toLowerCase();
    result = result.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    );
  }

  return result;
}

// ─────────────────────────────────────────────────────────────
// ESTOQUE / INVENTORY
// ─────────────────────────────────────────────────────────────

/**
 * Calcula status de estoque baseado em quantidade e threshold
 * @param {number} quantity - Quantidade atual
 * @param {number} threshold - Limite crítico
 * @returns {string} 'CRITICO' | 'BAIXO' | 'OK'
 */
export function calculateProductStatus(quantity = 0, threshold = 0) {
  if (quantity <= threshold) return 'CRITICO';
  if (quantity <= threshold * 1.5) return 'BAIXO';
  return 'OK';
}

/**
 * Calcula equivalente em unidades baseado em percentual
 * @param {number} quantity - Quantidade total
 * @param {number} percentage - Percentual (0-100)
 * @returns {number} Unidades equivalentes
 */
export function calculateLowStockThreshold(quantity = 0, percentage = 0) {
  return Math.round(quantity * (percentage / 100));
}

/**
 * Agrupa produtos por status
 * @param {Array} products
 * @returns {Object} { critico: [...], baixo: [...], ok: [...] }
 */
export function groupProductsByStatus(products = []) {
  return {
    critico: products.filter(p => calculateProductStatus(p.quantity, p.lowStockThreshold) === 'CRITICO'),
    baixo: products.filter(p => calculateProductStatus(p.quantity, p.lowStockThreshold) === 'BAIXO'),
    ok: products.filter(p => calculateProductStatus(p.quantity, p.lowStockThreshold) === 'OK'),
  };
}

/**
 * Calcula estatísticas de estoque
 * @param {Array} products
 * @returns {Object} { totalSKU, critico, alertas }
 */
export function calculateInventorySummary(products = []) {
  const grouped = groupProductsByStatus(products);
  return {
    totalSKU: products.length,
    critico: grouped.critico.length,
    alertas: grouped.critico.length + grouped.baixo.length,
    emAlerta: grouped.critico.concat(grouped.baixo),
  };
}

// ─────────────────────────────────────────────────────────────
// DESCONTO
// ─────────────────────────────────────────────────────────────

/**
 * Calcula valor do desconto
 * @param {number} original - Valor original
 * @param {number} discount - Valor/percentual de desconto
 * @param {string} type - 'percentage' | 'fixed'
 * @returns {number} Valor do desconto
 */
export function calculateDiscountAmount(original = 0, discount = 0, type = 'fixed') {
  if (discount <= 0) return 0;

  if (type === 'percentage') {
    return Math.min((original * discount) / 100, original);
  }

  return Math.min(discount, original);
}

/**
 * Calcula preço final com desconto
 * @param {number} original - Valor original
 * @param {number} discount - Valor/percentual de desconto
 * @param {string} type - 'percentage' | 'fixed'
 * @returns {number} Preço final
 */
export function calculateFinalPrice(original = 0, discount = 0, type = 'fixed') {
  const discountAmount = calculateDiscountAmount(original, discount, type);
  return Math.max(0, original - discountAmount);
}

/**
 * Aplica desconto a item de venda
 * @param {Object} item - { quantity, unitPrice, ... }
 * @param {number} discountValue - Valor/percentual
 * @param {string} discountType - 'percentage' | 'fixed'
 * @returns {Object} Item com desconto aplicado
 */
export function applyDiscountToItem(item = {}, discountValue = 0, discountType = 'fixed') {
  const unitTotal = item.quantity * item.unitPrice;
  const discountAmount = calculateDiscountAmount(unitTotal, discountValue, discountType);

  return {
    ...item,
    discountAmount,
    discountPercent: discountAmount > 0 ? (discountAmount / unitTotal) * 100 : 0,
    total: Math.max(0, unitTotal - discountAmount),
  };
}

// ─────────────────────────────────────────────────────────────
// VENDA / CARRINHO
// ─────────────────────────────────────────────────────────────

/**
 * Calcula subtotal de items
 * @param {Array} items - Itens do carrinho
 * @returns {number} Subtotal
 */
export function calculateSubtotal(items = []) {
  return items.reduce((sum, item) => sum + (item.total || 0), 0);
}

/**
 * Calcula resumo total da venda
 * @param {Array} items - Itens do carrinho
 * @param {Object} discount - { value, type: 'fixed'|'percentage' }
 * @param {Object} payment - { method, amount }
 * @returns {Object} { subtotal, discountAmount, total, troco }
 */
export function calculateSaleTotal(items = [], discount = {}, payment = {}) {
  const subtotal = calculateSubtotal(items);
  const discountAmount = calculateDiscountAmount(subtotal, discount.value || 0, discount.type || 'fixed');
  const total = Math.max(0, subtotal - discountAmount);
  const troco = Math.max(0, (payment.amount || 0) - total);

  return {
    subtotal,
    discountAmount,
    discountPercent: discountAmount > 0 ? (discountAmount / subtotal) * 100 : 0,
    total,
    troco,
  };
}

/**
 * Valida desconto global
 * @param {number} discount - Valor/percentual
 * @param {string} type - 'percentage' | 'fixed'
 * @param {number} subtotal - Subtotal
 * @returns {Object} { valid, error }
 */
export function validateGlobalDiscount(discount = 0, type = 'percentage', subtotal = 0) {
  if (discount < 0) {
    return { valid: false, error: 'Desconto não pode ser negativo.' };
  }

  if (type === 'percentage' && discount > 100) {
    return { valid: false, error: 'Percentual não pode exceder 100%.' };
  }

  if (type === 'fixed' && discount > subtotal) {
    return { valid: false, error: 'Desconto não pode ser maior que o subtotal.' };
  }

  return { valid: true, error: null };
}

// ─────────────────────────────────────────────────────────────
// CAIXA
// ─────────────────────────────────────────────────────────────

/**
 * Calcula resumo de transações
 * @param {Array} transactions - Transações
 * @returns {Object} { total, vendas, recebimentos, sangrias, estornos }
 */
export function calculateTransactionSummary(transactions = []) {
  return {
    total: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
    vendas: transactions
      .filter(t => t.type === 'VENDA')
      .reduce((sum, t) => sum + t.amount, 0),
    recebimentos: transactions
      .filter(t => t.type === 'RECEBIMENTO')
      .reduce((sum, t) => sum + t.amount, 0),
    sangrias: transactions
      .filter(t => t.type === 'SANGRIA')
      .reduce((sum, t) => sum + t.amount, 0),
    estornos: transactions
      .filter(t => t.type === 'ESTORNO')
      .reduce((sum, t) => sum + t.amount, 0),
  };
}

/**
 * Verifica se caixa está aberto
 * @param {Object} caixa
 * @returns {boolean}
 */
export function isCaixaAberto(caixa = null) {
  return caixa && caixa.status === 'ABERTO';
}

/**
 * Verifica se caixa expirou (>24h)
 * @param {Object} caixa
 * @returns {boolean}
 */
export function isCaixaExpired(caixa = null) {
  if (!caixa || !caixa.createdAt) return false;

  const created = new Date(caixa.createdAt).getTime();
  const now = new Date().getTime();
  const hours = (now - created) / (1000 * 60 * 60);

  return hours > 24;
}

// ─────────────────────────────────────────────────────────────
// PERMISSÕES E VISIBILIDADE
// ─────────────────────────────────────────────────────────────

/**
 * Determina se usuário pode fazer uma ação
 * @param {Object} user - Usuário
 * @param {string} permission - Nome da permissão
 * @returns {boolean}
 */
export function hasPermission(user = null, permission = '') {
  if (!user) return false;

  const permissionMap = {
    'permitir_cadastrar_produto': ['master', 'admin', 'lojista'],
    'permitir_editar_usuario': ['master', 'admin'],
    'permitir_resetar_senha': ['master', 'admin', 'lojista'],
    'permitir_acessar_caixa': ['master', 'admin', 'lojista', 'vendedor', 'gerente'],
    'permitir_fazer_venda': ['vendedor', 'gerente'],
  };

  const allowedRoles = permissionMap[permission] || [];
  return allowedRoles.includes(user.role);
}

/**
 * Determina visibilidade de coluna em tabelas baseado em role
 * @param {Object} user
 * @param {string} column - Nome da coluna
 * @returns {boolean}
 */
export function shouldShowColumn(user = null, column = '') {
  const visibility = {
    'salary': ['master', 'admin'],
    'commission': ['master', 'admin', 'gerente'],
    'apiKey': ['master'],
    'auditLog': ['master', 'admin'],
  };

  const allowedRoles = visibility[column] || [];
  return allowedRoles.length === 0 || allowedRoles.includes(user?.role);
}

// ─────────────────────────────────────────────────────────────
// UTILIDADES GERAIS
// ─────────────────────────────────────────────────────────────

/**
 * Ordena array por campo
 * @param {Array} items
 * @param {string} field - Campo para ordenar
 * @param {string} order - 'asc' | 'desc'
 * @returns {Array} Ordenado
 */
export function sortBy(items = [], field = '', order = 'asc') {
  const sorted = [...items].sort((a, b) => {
    const aVal = a[field] || '';
    const bVal = b[field] || '';

    if (typeof aVal === 'string') {
      return order === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    return order === 'asc' ? aVal - bVal : bVal - aVal;
  });

  return sorted;
}

/**
 * Agrupa items por campo
 * @param {Array} items
 * @param {string} field - Campo para agrupar
 * @returns {Object} { [groupKey]: [...items] }
 */
export function groupBy(items = [], field = '') {
  return items.reduce((acc, item) => {
    const key = item[field] || 'undefined';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

/**
 * Busca em array de items (fuzzy search)
 * @param {Array} items
 * @param {string} query - Termo de busca
 * @param {Array} fields - Campos para buscar
 * @returns {Array} Resultados
 */
export function searchItems(items = [], query = '', fields = []) {
  if (!query) return items;

  const q = query.toLowerCase();
  return items.filter(item =>
    fields.some(field =>
      String(item[field] || '')
        .toLowerCase()
        .includes(q)
    )
  );
}

// ─────────────────────────────────────────────────────────────
// USUÁRIOS
// ─────────────────────────────────────────────────────────────

/**
 * Calcula resumo de usuários por role
 * @param {Array} users - Lista de usuários
 * @returns {Object} { totalAdmins, totalMasters, totalLojistas, totalVendedores, tenantsCount }
 */
export function calculateUsersSummary(users = []) {
  return {
    totalAdmins: users.filter(u => u.role === 'admin').length,
    totalMasters: users.filter(u => u.role === 'master').length,
    totalLojistas: users.filter(u => u.role === 'lojista').length,
    totalVendedores: users.filter(u => u.role === 'vendedor').length,
    tenantsCount: new Set(users.map(u => u.tenantId).filter(Boolean)).size,
  };
}

// ─────────────────────────────────────────────────────────────
// VENDEDORES
// ─────────────────────────────────────────────────────────────

/**
 * Calcula resumo de vendedores
 * @param {Array} vendedores - Lista de vendedores
 * @returns {Object} { totalVendas, activeCount, inactiveCount, topPerformer }
 */
export function calculateVendedoresSummary(vendedores = []) {
  const totalSales = vendedores.reduce((sum, v) => sum + (v.salesRealized || 0), 0);
  const activeCount = vendedores.filter((v) => v.isActive).length;
  const inactiveCount = vendedores.length - activeCount;
  const topPerformer = [...vendedores].sort((a, b) => (b.salesRealized || 0) - (a.salesRealized || 0))[0];

  return {
    totalSales,
    activeCount,
    inactiveCount,
    topPerformer,
  };
}

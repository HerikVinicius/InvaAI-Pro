import api from './api';

/**
 * Factory para criar serviços CRUD padrão
 * Elimina boilerplate em serviços similares
 *
 * @param {string} endpoint - ex: '/users', '/inventory', '/clientes'
 * @param {Object} overrides - métodos customizados que sobrescrevem os padrão
 * @returns {Object} serviço com list, create, get, update, delete
 *
 * @example
 * // Uso básico
 * export const userService = createCrudService('/users');
 *
 * // Com métodos customizados
 * export const clienteService = createCrudService('/clientes', {
 *   pagamento: (id, payload) => api.post(`/clientes/${id}/pagamento`, payload),
 *   search: (query) => api.get('/clientes/search', { params: { query } }),
 * });
 */
export function createCrudService(endpoint, overrides = {}) {
  const service = {
    /**
     * Lista todos os recursos
     * @param {Object} params - query params (search, filter, page, limit, etc)
     * @returns {Promise}
     */
    list: (params = {}) => api.get(endpoint, { params }),

    /**
     * Cria um novo recurso
     * @param {Object} payload - dados do recurso
     * @returns {Promise}
     */
    create: (payload) => api.post(endpoint, payload),

    /**
     * Obtém um recurso por ID
     * @param {string} id - ID do recurso
     * @returns {Promise}
     */
    get: (id) => api.get(`${endpoint}/${id}`),

    /**
     * Atualiza um recurso
     * @param {string} id - ID do recurso
     * @param {Object} payload - dados a atualizar
     * @returns {Promise}
     */
    update: (id, payload) => api.put(`${endpoint}/${id}`, payload),

    /**
     * Deleta um recurso
     * @param {string} id - ID do recurso
     * @param {Object} payload - dados adicionais (motivo, observacao, etc)
     * @returns {Promise}
     */
    delete: (id, payload = {}) =>
      api.delete(`${endpoint}/${id}`, { data: Object.keys(payload).length > 0 ? payload : undefined }),

    /**
     * Atualização parcial (PATCH)
     * @param {string} id - ID do recurso
     * @param {Object} payload - dados parciais a atualizar
     * @returns {Promise}
     */
    patch: (id, payload) => api.patch(`${endpoint}/${id}`, payload),
  };

  // Sobrescreve métodos padrão com customizações
  return { ...service, ...overrides };
}

/**
 * Factory com suporte a soft delete
 * Útil quando há timestamp de deletar em vez de remover de verdade
 */
export function createSoftDeleteService(endpoint, overrides = {}) {
  return createCrudService(endpoint, {
    softDelete: (id, payload = {}) =>
      api.patch(`${endpoint}/${id}`, { ...payload, isActive: false }),
    restore: (id) => api.patch(`${endpoint}/${id}`, { isActive: true }),
    ...overrides,
  });
}

/**
 * Factory com suporte a paginação
 * Útil para recursos com muitos itens
 */
export function createPaginatedService(endpoint, pageParam = 'page', limitParam = 'limit', overrides = {}) {
  return createCrudService(endpoint, {
    paginated: (page = 1, limit = 10, filters = {}) =>
      api.get(endpoint, {
        params: {
          [pageParam]: page,
          [limitParam]: limit,
          ...filters,
        },
      }),
    ...overrides,
  });
}

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Hook genérico para carregar dados paginados de um serviço.
 * Centraliza a lógica de fetch, loading, erros e paginação.
 *
 * @param {Object} service - Serviço com método list(params)
 * @param {Object} params - Parâmetros de busca/filtro
 * @param {Object} options - Opções adicionais
 * @returns {Object} { data, loading, error, pagination, reload }
 *
 * @example
 * const { data: clientes, loading } = useListData(clientesService, { search });
 * const { data: produtos, pagination } = useListData(inventoryService, { page: 1 }, { debounce: 300 });
 */
export function useListData(service, params = {}, options = {}) {
  const { debounce = 300, onError = null } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await service.list(params);
      setData(response.data?.data || response.data || []);

      // Se há informação de paginação na resposta
      if (response.data?.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (err) {
      const message = err.message || 'Falha ao carregar dados.';
      setError(message);
      toast.error(message);

      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, onError, JSON.stringify(params)]);

  useEffect(() => {
    if (debounce > 0) {
      const handler = setTimeout(reload, debounce);
      return () => clearTimeout(handler);
    } else {
      reload();
    }
  }, [reload, debounce]);

  return {
    data,
    loading,
    error,
    pagination,
    reload,
    setData, // Para permitir updates otimistas
  };
}

/**
 * Hook para filtros com debounce automático.
 * Útil para componentes com search, múltiplos filtros, etc.
 *
 * @example
 * const [filters, setFilters] = useFilters({ search: '', role: 'todos' });
 * const { data } = useListData(service, filters.values);
 */
export function useFilters(initialValues = {}) {
  const [values, setValues] = useState(initialValues);
  const [debouncedValues, setDebouncedValues] = useState(initialValues);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValues(values);
    }, 300);

    return () => clearTimeout(handler);
  }, [values]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setDebouncedValues(initialValues);
  }, [initialValues]);

  return {
    values,
    debouncedValues,
    setValues,
    updateFilter: (key, value) => setValues(prev => ({ ...prev, [key]: value })),
    reset,
  };
}

/**
 * Hook para paginação.
 * Gerencia o estado de página atual e forward/backward.
 *
 * @example
 * const { page, goToPage, nextPage, prevPage } = usePagination(pagination.pages);
 * const { data } = useListData(service, { page });
 */
export function usePagination(totalPages = 1) {
  const [page, setPage] = useState(1);

  const goToPage = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(page + 1);
  }, [page, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(page - 1);
  }, [page, goToPage]);

  return {
    page,
    goToPage,
    nextPage,
    prevPage,
    canGoNext: page < totalPages,
    canGoPrev: page > 1,
  };
}

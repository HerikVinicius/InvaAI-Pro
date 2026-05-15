import { useCallback, useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { clientesService } from '../services/clientesService';

/**
 * Hook customizado que encapsula toda a lógica de dados para Clientes
 * - Fetch de dados
 * - Filtros e busca
 * - Paginação
 * - Loading/erro
 *
 * Separa a lógica de dados da apresentação
 *
 * @param {Object} options - { debounce, onError }
 * @returns {Object} { data, loading, error, filters, actions }
 */
export function useClientesData(options = {}) {
  const { debounce = 300 } = options;

  // Estado de dados
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado de filtros
  const [search, setSearch] = useState('');
  const [onlyWithDebt, setOnlyWithDebt] = useState(false);

  // Fetch com debounce
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await clientesService.list({
        search: search || undefined,
        onlyWithDebt: onlyWithDebt ? 'true' : undefined,
      });
      setClientes(res.data.clientes || []);
    } catch (err) {
      const message = err.message || 'Falha ao carregar clientes.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [search, onlyWithDebt]);

  // Debounced effect
  useEffect(() => {
    const handler = setTimeout(reload, debounce);
    return () => clearTimeout(handler);
  }, [reload, debounce]);

  // Cálculos de resumo (memoizados)
  const summary = useMemo(() => ({
    total: clientes.length,
    comDebito: clientes.filter(c => c.saldoDevedor > 0).length,
    totalDevedor: clientes.reduce((s, c) => s + (c.saldoDevedor || 0), 0),
  }), [clientes]);

  return {
    // Dados
    clientes,
    loading,
    error,

    // Filtros
    filters: {
      search,
      onlyWithDebt,
    },

    // Actions
    setSearch,
    setOnlyWithDebt,
    reload,

    // Cálculos (memoizados)
    summary,

    // Para atualizar estado de forma otimista
    setClientes,
  };
}

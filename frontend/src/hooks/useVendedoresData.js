import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { vendedoresService } from '../services/vendedoresService';

export function useVendedoresData() {
  const [vendedores, setVendedores] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await vendedoresService.list({ page, limit: 100 });
      setVendedores(res.data.vendedores);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.message || 'Failed to load salespeople.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = useCallback(async (vendedor) => {
    if (!vendedor.userId) {
      toast.error('Este vendedor não tem conta de login vinculada.');
      return false;
    }
    const acao = vendedor.isActive ? 'desativar' : 'ativar';
    if (!window.confirm(`Deseja ${acao} o vendedor ${vendedor.name}?`)) return false;
    try {
      await vendedoresService.toggleActive(vendedor.userId, !vendedor.isActive);
      toast.success(`Vendedor ${vendedor.isActive ? 'desativado' : 'ativado'}.`);
      load(pagination.page);
      return true;
    } catch (err) {
      toast.error(err.message || `Falha ao ${acao} vendedor.`);
      return false;
    }
  }, [load, pagination.page]);

  return {
    vendedores,
    pagination,
    loading,
    load,
    toggleActive,
  };
}

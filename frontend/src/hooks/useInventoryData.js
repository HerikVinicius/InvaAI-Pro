import { useEffect, useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { inventoryService } from '../services/inventoryService';
import { useAuthStore, can } from '../store/authStore';

export function useInventoryData(options = {}) {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const canWrite = can(user, 'permitir_cadastrar_produto');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await inventoryService.list({ page, limit: 20 });
      setProducts(res.data.products);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.message || 'Falha ao carregar estoque.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const criticalCount = useMemo(() => {
    return products.filter(p => p.status === 'CRITICAL').length;
  }, [products]);

  return {
    products,
    pagination,
    loading,
    canWrite,
    criticalCount,
    reload: load,
  };
}

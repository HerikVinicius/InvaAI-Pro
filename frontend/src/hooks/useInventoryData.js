import { useEffect, useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { inventoryService } from '../services/inventoryService';
import { useAuthStore, can } from '../store/authStore';

export function useInventoryData(options = {}) {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [lowStock, setLowStock] = useState(false);
  const [noCostPrice, setNoCostPrice] = useState(false);

  const canWrite = can(user, 'permitir_cadastrar_produto');
  const isLojista = user?.role === 'lojista';

  const load = useCallback(async (page = 1, currentLowStock = false, currentNoCostPrice = false) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (currentLowStock) params.lowStock = 'true';
      if (currentNoCostPrice) params.noCostPrice = 'true';
      const res = await inventoryService.list(params);
      setProducts(res.data.products);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.message || 'Falha ao carregar estoque.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1, lowStock, noCostPrice);
  }, [load, lowStock, noCostPrice]);

  const criticalCount = useMemo(() => {
    return products.filter(p => p.status === 'CRITICAL').length;
  }, [products]);

  const reload = useCallback((page = 1) => load(page, lowStock, noCostPrice), [load, lowStock, noCostPrice]);

  return {
    products,
    pagination,
    loading,
    canWrite,
    isLojista,
    criticalCount,
    lowStock,
    setLowStock,
    noCostPrice,
    setNoCostPrice,
    reload,
  };
}

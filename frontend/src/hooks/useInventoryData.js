import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { inventoryService } from '../services/inventoryService';
import { useAuthStore, can } from '../store/authStore';

const DEBOUNCE_MS = 350;

export function useInventoryData(options = {}) {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [lowStock, setLowStock] = useState(false);
  const [noCostPrice, setNoCostPrice] = useState(false);
  const [search, setSearch] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [warehouses, setWarehouses] = useState([]);

  // Debounced search value — só dispara fetch após o usuário parar de digitar.
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef(null);

  const canWrite = can(user, 'permitir_cadastrar_produto');
  const isLojista = user?.role === 'lojista';

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(value), DEBOUNCE_MS);
  }, []);

  // Busca armazéns disponíveis uma vez ao montar.
  useEffect(() => {
    inventoryService.warehouses()
      .then((res) => setWarehouses(res.data.warehouses || []))
      .catch(() => {});
  }, []);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (lowStock) params.lowStock = 'true';
      if (noCostPrice) params.noCostPrice = 'true';
      if (debouncedSearch) params.search = debouncedSearch;
      if (warehouse) params.warehouse = warehouse;
      const res = await inventoryService.list(params);
      setProducts(res.data.products);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.message || 'Falha ao carregar estoque.');
    } finally {
      setLoading(false);
    }
  }, [lowStock, noCostPrice, debouncedSearch, warehouse]);

  useEffect(() => {
    load(1);
  }, [load]);

  const criticalCount = useMemo(() => {
    return products.filter(p => p.status === 'CRITICAL').length;
  }, [products]);

  const reload = useCallback((page = 1) => load(page), [load]);

  const clearFilters = useCallback(() => {
    setLowStock(false);
    setNoCostPrice(false);
    setWarehouse('');
    handleSearchChange('');
  }, [handleSearchChange]);

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
    search,
    setSearch: handleSearchChange,
    warehouse,
    setWarehouse,
    warehouses,
    clearFilters,
    reload,
  };
}

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { caixaService } from '../services/caixaService';

export function useCaixaData(options = {}) {
  const [loading, setLoading] = useState(true);
  const [caixa, setCaixa] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [expiredCaixa, setExpiredCaixa] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await caixaService.atual();
      const c = res.data.caixa;
      setCaixa(c);
      if (c) {
        const [txRes, resumoRes] = await Promise.all([
          caixaService.transactions(c._id, { limit: 50 }),
          caixaService.resumo(c._id),
        ]);
        setTransactions(txRes.data.transactions || []);
        setResumo(resumoRes.data.resumo);
      } else {
        setTransactions([]);
        setResumo(null);
      }
    } catch (err) {
      toast.error(err.message || 'Falha ao carregar caixa.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleExpiredCaixa = (err) => {
    if (err?.code === 'CAIXA_EXPIRED' && err.pendingCaixa) {
      setExpiredCaixa(err.pendingCaixa);
      return true;
    }
    return false;
  };

  const clearExpiredCaixa = () => setExpiredCaixa(null);

  return {
    loading,
    caixa,
    transactions,
    resumo,
    expiredCaixa,
    reload: loadAll,
    handleExpiredCaixa,
    clearExpiredCaixa,
  };
}

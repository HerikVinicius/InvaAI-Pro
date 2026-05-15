import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { vendasService } from '../services/salesService';

const MAX_RANGE_DAYS = 30;

const toInputDate = (d) => {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${day}`;
};

export function useVendedorSalesData() {
  const today = new Date();
  const defaultFrom = (() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 6);
    return d;
  })();

  const [from, setFrom] = useState(toInputDate(defaultFrom));
  const [to, setTo] = useState(toInputDate(today));
  const [vendas, setVendas] = useState([]);
  const [myRanking, setMyRanking] = useState({ position: null, totalVendedores: 0, quantidadeVendas: 0 });
  const [warning, setWarning] = useState(null);
  const [loading, setLoading] = useState(true);

  const rangeDays = useMemo(() => {
    if (!from || !to) return 0;
    const ms = new Date(to).getTime() - new Date(from).getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
  }, [from, to]);

  const exceedsLimit = rangeDays > MAX_RANGE_DAYS;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (from) params.from = `${from}T00:00:00.000Z`;
      if (to) params.to = `${to}T23:59:59.999Z`;

      const [vendasRes, topRes] = await Promise.all([
        vendasService.list(params),
        vendasService.getTopVendedores(),
      ]);

      setVendas(vendasRes.data.vendas || []);
      setWarning(vendasRes.data.warning || null);

      const top = topRes.data;
      const me = top.ranking?.[0];
      setMyRanking({
        position: top.position || null,
        totalVendedores: top.totalVendedores || 0,
        quantidadeVendas: me?.quantidadeVendas || 0,
        vendorName: me?.vendorName || null,
      });
    } catch (err) {
      console.error('[VendedorSales] fetchData error:', err);
      toast.error('Falha ao carregar suas vendas.');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    if (!exceedsLimit) fetchData();
  }, [fetchData, exceedsLimit]);

  return {
    from,
    setFrom,
    to,
    setTo,
    vendas,
    myRanking,
    warning,
    loading,
    rangeDays,
    exceedsLimit,
    today,
    toInputDate,
  };
}

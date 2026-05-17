import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { vendasService } from '../services/salesService';
import { caixaService } from '../services/caixaService';

const hoje = new Date();
const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

const toISO = (d) => d.toISOString().slice(0, 10);

export function useFechamentoMes() {
  const [from, setFrom] = useState(toISO(primeiroDiaMes));
  const [to, setTo] = useState(toISO(hoje));
  const [stats, setStats] = useState(null);
  const [caixa, setCaixa] = useState(null);
  const [resumoCaixa, setResumoCaixa] = useState(null);
  const [despesas, setDespesas] = useState([{ descricao: '', valor: '' }]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, caixaRes] = await Promise.all([
        vendasService.getStats({ from: `${from}T00:00:00.000Z`, to: `${to}T23:59:59.999Z` }),
        caixaService.atual(),
      ]);

      setStats(statsRes.data);

      const caixaAtual = caixaRes.data?.caixa || null;
      setCaixa(caixaAtual);

      if (caixaAtual?._id) {
        const resumoRes = await caixaService.resumo(caixaAtual._id);
        setResumoCaixa(resumoRes.data?.resumo || null);
      } else {
        setResumoCaixa(null);
      }
    } catch (err) {
      console.error('[FechamentoMes] fetchData error:', err);
      toast.error('Falha ao carregar dados de fechamento.');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalDespesas = useMemo(() =>
    despesas.reduce((acc, d) => acc + (parseFloat(d.valor) || 0), 0),
  [despesas]);

  const faturamentoPeriodo = stats?.periodo?.receita ?? stats?.mesAtual?.receita ?? 0;
  const lucroEstimado = stats?.lucroEstimado ?? null;
  const lucroLiquido = lucroEstimado != null ? lucroEstimado - totalDespesas : null;
  const margemLiquida = faturamentoPeriodo > 0 && lucroLiquido != null
    ? (lucroLiquido / faturamentoPeriodo) * 100
    : 0;

  const addDespesa = () => setDespesas((prev) => [...prev, { descricao: '', valor: '' }]);
  const removeDespesa = (i) => setDespesas((prev) => prev.filter((_, idx) => idx !== i));
  const updateDespesa = (i, field, value) =>
    setDespesas((prev) => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d));

  return {
    from, setFrom,
    to, setTo,
    stats,
    caixa,
    resumoCaixa,
    despesas,
    loading,
    totalDespesas,
    faturamentoPeriodo,
    lucroEstimado,
    lucroLiquido,
    margemLiquida,
    addDespesa,
    removeDespesa,
    updateDespesa,
    refetch: fetchData,
  };
}

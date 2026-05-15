import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { caixaService } from '../services/caixaService';

export function useNovaVendaData() {
  const [query, setQuery] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [itens, setItens] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [sugestoes, setSugestoes] = useState([]);
  const [sugestoesVisiveis, setSugestoesVisiveis] = useState(false);
  const [vendedores, setVendedores] = useState([]);
  const [vendedorSelecionado, setVendedorSelecionado] = useState('');
  const [caixaAtual, setCaixaAtual] = useState(null);
  const [caixaChecking, setCaixaChecking] = useState(true);
  const [caixaExpirado, setCaixaExpirado] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [globalDiscountType, setGlobalDiscountType] = useState('percentage');
  const searchTimerRef = useRef(null);

  useEffect(() => {
    caixaService
      .atual()
      .then((res) => {
        const caixa = res.data.caixa;
        setCaixaAtual(caixa);
        if (caixa) {
          const horas = (Date.now() - new Date(caixa.openedAt).getTime()) / 3600000;
          if (horas >= 24) setCaixaExpirado(true);
        }
      })
      .catch(() => setCaixaAtual(null))
      .finally(() => setCaixaChecking(false));

    api.get('/vendedores')
      .then(res => setVendedores(res.data.vendedores || []))
      .catch(() => toast.error('Falha ao carregar vendedores.'));
  }, []);

  const buscarSugestoes = useCallback(async (q) => {
    if (!q.trim()) {
      setSugestoes([]);
      return;
    }
    setBuscando(true);
    try {
      const res = await api.get(`/inventory/search?q=${encodeURIComponent(q.trim())}`);
      const products = res.data.products || [];
      setSugestoes(products);
      setSugestoesVisiveis(products.length > 0);
    } catch (err) {
      // Log the error for debugging but don't show toast to user
      // (they'll see if there are no results instead)
      console.error('[PDV Search] Erro ao buscar produtos:', err);
      setSugestoes([]);
      setSugestoesVisiveis(false);
    } finally {
      setBuscando(false);
    }
  }, []);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => buscarSugestoes(val), 250);
  };

  const adicionarProduto = (produto) => {
    setSugestoesVisiveis(false);
    setSugestoes([]);
    if (itens.find(i => i.sku === produto.sku)) {
      toast.error('Produto já adicionado na lista.');
      setQuery('');
      return;
    }
    if (produto.quantity <= 0) {
      toast.error(`${produto.name} está sem estoque.`);
      return;
    }
    setItens(prev => [...prev, {
      productId: produto._id,
      sku: produto.sku,
      nome: produto.name,
      quantidade,
      precoUnitario: produto.price,
      discount: produto.defaultDiscount || 0,
      discountType: produto.defaultDiscountType || 'percentage',
    }]);
    setQuery('');
    setQuantidade(1);
  };

  const removerItem = (sku) => setItens(prev => prev.filter(i => i.sku !== sku));

  const atualizarItem = (sku, field, value) => {
    setItens(prev => prev.map(i => {
      if (i.sku !== sku) return i;
      return { ...i, [field]: value };
    }));
  };

  const clearAll = () => setItens([]);

  const verificarCaixaExpirado = () => {
    if (caixaAtual) {
      const horas = (Date.now() - new Date(caixaAtual.openedAt).getTime()) / 3600000;
      return horas >= 24;
    }
    return false;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (sugestoes.length === 1) {
        adicionarProduto(sugestoes[0]);
      } else if (sugestoes.length === 0 && query.trim()) {
        toast.error('Produto não encontrado.');
      }
    }
    if (e.key === 'Escape') setSugestoesVisiveis(false);
  };

  return {
    query,
    quantidade,
    setQuantidade,
    itens,
    setItens,
    buscando,
    sugestoes,
    sugestoesVisiveis,
    setSugestoesVisiveis,
    vendedores,
    vendedorSelecionado,
    setVendedorSelecionado,
    caixaAtual,
    caixaChecking,
    caixaExpirado,
    globalDiscount,
    setGlobalDiscount,
    globalDiscountType,
    setGlobalDiscountType,
    handleQueryChange,
    handleKeyDown,
    adicionarProduto,
    removerItem,
    atualizarItem,
    clearAll,
    verificarCaixaExpirado,
  };
}

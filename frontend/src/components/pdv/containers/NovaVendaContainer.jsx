import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useNovaVendaData } from '../../../hooks/useNovaVendaData';
import NovaVendaPage from '../pages/NovaVendaPage';
import { calculateSaleTotal } from '../../../utils/business-logic';

export default function NovaVendaContainer() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);

  const {
    query,
    setQuery,
    quantidade,
    setQuantidade,
    itens,
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
  } = useNovaVendaData();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && e.target !== inputRef.current) {
        setSugestoesVisiveis(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [setSugestoesVisiveis]);

  // F9 → open global discount modal
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F9') {
        e.preventDefault();
        setDiscountModalOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const calculateItemTotal = (item) => {
    const gross = item.precoUnitario * item.quantidade;
    if (!item.discount || item.discount <= 0) return gross;
    const d = item.discountType === 'fixed'
      ? Math.min(item.discount, gross)
      : gross * (Math.min(item.discount, 100) / 100);
    return Math.max(0, gross - d);
  };

  const summary = calculateSaleTotal(
    itens.map(i => ({ total: calculateItemTotal(i) })),
    { value: globalDiscount, type: globalDiscountType }
  );

  const avancarParaPagamento = () => {
    if (!vendedorSelecionado) {
      toast.error('Selecione um vendedor antes de avançar.');
      return;
    }

    if (verificarCaixaExpirado()) {
      toast.error('O caixa expirou. Realize a Batida de Caixa antes de continuar.', { duration: 6000 });
      return;
    }

    const vendedor = vendedores.find(v => v._id === vendedorSelecionado);

    const dadosVenda = {
      vendorId: vendedor._id,
      vendorName: vendedor.name,
      items: itens.map(i => ({
        productId: i.productId,
        sku: i.sku,
        name: i.nome,
        quantity: i.quantidade,
        unitPrice: i.precoUnitario,
        discount: i.discount || 0,
        discountType: i.discountType || 'percentage',
        total: calculateItemTotal(i),
      })),
      subtotal: summary.subtotal,
      globalDiscount,
      globalDiscountType,
      totalAmount: summary.total,
    };

    sessionStorage.setItem('vendaPendente', JSON.stringify(dadosVenda));
    navigate('/pagamento');
  };

  return (
    <NovaVendaPage
      query={query}
      quantidade={quantidade}
      setQuantidade={setQuantidade}
      itens={itens}
      buscando={buscando}
      sugestoes={sugestoes}
      sugestoesVisiveis={sugestoesVisiveis}
      setSugestoesVisiveis={setSugestoesVisiveis}
      vendedores={vendedores}
      vendedorSelecionado={vendedorSelecionado}
      setVendedorSelecionado={setVendedorSelecionado}
      caixaAtual={caixaAtual}
      caixaChecking={caixaChecking}
      caixaExpirado={caixaExpirado}
      globalDiscount={globalDiscount}
      globalDiscountType={globalDiscountType}
      setGlobalDiscount={setGlobalDiscount}
      setGlobalDiscountType={setGlobalDiscountType}
      discountModalOpen={discountModalOpen}
      setDiscountModalOpen={setDiscountModalOpen}
      inputRef={inputRef}
      dropdownRef={dropdownRef}
      handleQueryChange={handleQueryChange}
      handleKeyDown={handleKeyDown}
      onAddProduct={adicionarProduto}
      onRemoveItem={removerItem}
      onUpdateItem={atualizarItem}
      onClearAll={clearAll}
      onNavigateToPayment={avancarParaPagamento}
      subtotal={summary.subtotal}
      totalGeral={summary.total}
    />
  );
}

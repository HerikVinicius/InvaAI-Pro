import { Wallet, Lock, Clock } from 'lucide-react';
import Button from '../../ui/Button';
import PdvSearch from '../components/PdvSearch';
import PdvCart from '../components/PdvCart';
import PdvVendedor from '../components/PdvVendedor';
import GlobalDiscountModal from '../GlobalDiscountModal';

export default function NovaVendaPage({
  query = '',
  quantidade = 1,
  setQuantidade = () => {},
  itens = [],
  buscando = false,
  sugestoes = [],
  sugestoesVisiveis = false,
  setSugestoesVisiveis = () => {},
  vendedores = [],
  vendedorSelecionado = '',
  setVendedorSelecionado = () => {},
  caixaAtual = null,
  caixaChecking = false,
  caixaExpirado = false,
  globalDiscount = 0,
  globalDiscountType = 'percentage',
  setGlobalDiscount = () => {},
  setGlobalDiscountType = () => {},
  discountModalOpen = false,
  setDiscountModalOpen = () => {},
  inputRef = null,
  dropdownRef = null,
  handleQueryChange = () => {},
  handleKeyDown = () => {},
  onAddProduct = () => {},
  onRemoveItem = () => {},
  onUpdateItem = () => {},
  onClearAll = () => {},
  onNavigateToPayment = () => {},
  subtotal = 0,
  totalGeral = 0,
}) {
  if (!caixaChecking && !caixaAtual) {
    return (
      <div className="max-w-lg mx-auto animate-fade-in mt-10">
        <div className="bg-surface border border-status-critical/30 rounded-lg p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-status-critical/15 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-status-critical" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Caixa fechado</h2>
          <p className="text-sm text-text-secondary mb-6">
            Para registrar uma venda você precisa primeiro abrir o caixa.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="secondary" onClick={() => window.location.href = '/dashboard'}>
              Voltar
            </Button>
            <Button icon={Wallet} onClick={() => window.location.href = '/caixa'}>
              Abrir Caixa
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!caixaChecking && caixaExpirado) {
    const horasAberto = caixaAtual ? Math.floor((Date.now() - new Date(caixaAtual.openedAt).getTime()) / 3600000) : 0;
    return (
      <div className="max-w-lg mx-auto animate-fade-in mt-10">
        <div className="bg-surface border border-amber-500/40 rounded-lg p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-amber-300" />
          </div>
          <h2 className="text-lg font-semibold mb-1 text-amber-200">Batida de Caixa Necessária</h2>
          <p className="text-sm text-text-secondary mb-2">
            O caixa está aberto há <strong className="text-amber-300">{horasAberto} horas</strong> sem fechamento.
          </p>
          <p className="text-sm text-text-secondary mb-6">
            Por segurança, novas vendas estão bloqueadas. Realize o fechamento antes de continuar.
          </p>
          {caixaAtual && (
            <div className="text-xs text-text-muted bg-background border border-border rounded-md px-3 py-2 mb-6 text-left">
              <div>Aberto por: <span className="text-text-secondary font-medium">{caixaAtual.openedByName}</span></div>
              <div>Desde: <span className="text-text-secondary font-medium">{new Date(caixaAtual.openedAt).toLocaleString('pt-BR')}</span></div>
            </div>
          )}
          <div className="flex gap-2 justify-center">
            <Button variant="secondary" onClick={() => window.location.href = '/dashboard'}>
              Voltar
            </Button>
            <Button icon={Wallet} onClick={() => window.location.href = '/caixa'}>
              Fechar Caixa Agora
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="text-xs text-text-muted">Vendas › Etapa 1 de 2</div>
        <h1 className="text-xl font-semibold mt-1">Nova Venda</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Digite o nome ou código do produto para adicionar à venda
        </p>
        {caixaAtual && (() => {
          const hoursOpen = (Date.now() - new Date(caixaAtual.openedAt).getTime()) / 3600000;
          const nearLimit = hoursOpen >= 20;
          return (
            <div className={`mt-3 inline-flex items-center gap-2 text-xs border rounded-md px-2 py-1 ${
              nearLimit ? 'bg-amber-500/10 text-amber-200 border-amber-500/40' : 'bg-accent/10 text-accent border-accent/30'
            }`}>
              {nearLimit ? <Clock className="w-3 h-3" /> : <Wallet className="w-3 h-3" />}
              {nearLimit
                ? <span><strong>Caixa próximo de 24h ({Math.floor(hoursOpen)}h aberto)</strong> — feche antes do prazo.</span>
                : <>Caixa aberto desde {new Date(caixaAtual.openedAt).toLocaleString('pt-BR')}<span className="text-text-muted">·</span><span>{caixaAtual.openedByName}</span></>
              }
            </div>
          );
        })()}
      </div>

      <PdvSearch
        query={query}
        quantidade={quantidade}
        setQuantidade={setQuantidade}
        buscando={buscando}
        sugestoes={sugestoes}
        sugestoesVisiveis={sugestoesVisiveis}
        inputRef={inputRef}
        dropdownRef={dropdownRef}
        handleQueryChange={handleQueryChange}
        handleKeyDown={handleKeyDown}
        onAddProduct={onAddProduct}
      />

      <PdvCart
        itens={itens}
        globalDiscount={globalDiscount}
        globalDiscountType={globalDiscountType}
        subtotal={subtotal}
        totalGeral={totalGeral}
        onRemoveItem={onRemoveItem}
        onUpdateItem={onUpdateItem}
        onOpenDiscount={() => setDiscountModalOpen(true)}
      />

      <GlobalDiscountModal
        open={discountModalOpen}
        onClose={() => setDiscountModalOpen(false)}
        subtotal={subtotal}
        initialDiscount={globalDiscount}
        initialDiscountType={globalDiscountType}
        onApply={(val, typ) => {
          setGlobalDiscount(val);
          setGlobalDiscountType(typ);
        }}
      />

      {itens.length > 0 && (
        <PdvVendedor
          vendedores={vendedores}
          vendedorSelecionado={vendedorSelecionado}
          onVendedorChange={setVendedorSelecionado}
          onClearAll={onClearAll}
          onNavigateToPayment={onNavigateToPayment}
        />
      )}
    </div>
  );
}

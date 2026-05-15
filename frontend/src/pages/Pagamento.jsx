import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Banknote, Smartphone, ArrowLeft, CheckCircle, UserCircle, ClipboardSignature } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Button from '../components/ui/Button';
import ClientePicker from '../components/caixa/ClientePicker';
import ReceiptPrint from '../components/pdv/ReceiptPrint';

const METODOS = [
  { id: 'PIX',      label: 'PIX',      descricao: 'Transferência instantânea', icon: Smartphone },
  { id: 'DINHEIRO', label: 'Dinheiro', descricao: 'Pagamento em espécie',      icon: Banknote   },
  { id: 'CREDITO',  label: 'Crédito',  descricao: 'Parcelamento disponível',   icon: CreditCard },
  { id: 'DEBITO',   label: 'Débito',   descricao: 'Débito à vista',            icon: CreditCard },
  { id: 'FIADO',    label: 'Fiado',    descricao: 'Saldo devedor do cliente',  icon: ClipboardSignature },
];

const PARCELAS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 24];
const MAX_METODOS = 4;

const formatBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Distribui `total` entre N métodos de forma igual, ajustando o último
// para que a soma fique exata (sem perda de centavos por arredondamento).
const splitEqual = (total, n) => {
  if (n <= 0) return {};
  const base = Math.floor((total / n) * 100) / 100;
  const result = Array(n).fill(base);
  const soma = base * n;
  result[n - 1] = Number((result[n - 1] + (total - soma)).toFixed(2));
  return result;
};

export default function Pagamento() {
  const navigate = useNavigate();
  const [dadosVenda, setDadosVenda] = useState(null);
  const [finalizando, setFinalizando] = useState(false);
  const [vendaConcluida, setVendaConcluida] = useState(false);
  const [vendaId, setVendaId] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  // Métodos selecionados (em ordem de seleção). Quando há 1, é venda simples.
  // Quando há 2+, é venda fragmentada (split) e cada um carrega seu próprio valor.
  const [selectedMethods, setSelectedMethods] = useState([]);
  const [valores, setValores] = useState({});     // { PIX: 50.00, DINHEIRO: 50.00 }
  const [parcelas, setParcelas] = useState({});   // { CREDITO: 3 }

  // Cliente para fiado (qualquer fatia FIADO exige cliente).
  const [cliente, setCliente] = useState(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('vendaPendente');
    if (!raw) { toast.error('Nenhuma venda em andamento.'); navigate('/nova-venda'); return; }
    try {
      setDadosVenda(JSON.parse(raw));
    } catch { navigate('/nova-venda'); }
  }, [navigate]);

  const total = dadosVenda?.totalAmount || 0;
  const isSplit = selectedMethods.length > 1;
  const temFiado = selectedMethods.includes('FIADO');

  const somaValores = selectedMethods.reduce((s, m) => s + (Number(valores[m]) || 0), 0);
  const delta = total - somaValores;
  const somaOk = Math.abs(delta) < 0.01;

  // Toggle de método: ao adicionar/remover, redistribui valores igualmente
  // entre os métodos selecionados (sem perder o ajuste do usuário se possível).
  const toggleMethod = (id) => {
    let next;
    if (selectedMethods.includes(id)) {
      next = selectedMethods.filter((m) => m !== id);
    } else {
      if (selectedMethods.length >= MAX_METODOS) {
        toast.error(`Máximo de ${MAX_METODOS} métodos por venda.`);
        return;
      }
      next = [...selectedMethods, id];
    }

    if (next.length === 0) {
      setSelectedMethods([]);
      setValores({});
      setParcelas({});
      setCliente(null);
      return;
    }

    if (next.length === 1) {
      // Volta para modo simples: 100% no único método.
      setValores({ [next[0]]: Number(total.toFixed(2)) });
    } else {
      // Distribui igualmente.
      const parts = splitEqual(total, next.length);
      const novosValores = Object.fromEntries(next.map((m, i) => [m, parts[i]]));
      setValores(novosValores);
    }

    // Limpa parcelas para métodos que saíram da seleção.
    setParcelas((prev) => {
      const novo = { ...prev };
      Object.keys(novo).forEach((k) => { if (!next.includes(k)) delete novo[k]; });
      return novo;
    });

    // Se removeu FIADO, limpa cliente.
    if (!next.includes('FIADO')) setCliente(null);

    setSelectedMethods(next);
  };

  const setValor = (method, raw) => {
    const v = raw === '' ? '' : Number(raw);
    setValores((prev) => ({ ...prev, [method]: v }));
  };

  const finalizarVenda = async () => {
    if (selectedMethods.length === 0) {
      toast.error('Selecione pelo menos uma forma de pagamento.');
      return;
    }
    if (isSplit) {
      if (!somaOk) {
        toast.error(`Soma das formas (${formatBRL(somaValores)}) difere do total (${formatBRL(total)}).`);
        return;
      }
      if (selectedMethods.some((m) => !(Number(valores[m]) > 0))) {
        toast.error('Cada forma deve ter valor maior que zero.');
        return;
      }
    }
    if (temFiado && !cliente) {
      toast.error('Selecione o cliente para registrar o fiado.');
      return;
    }

    setFinalizando(true);
    try {
      const body = { ...dadosVenda };
      if (cliente) {
        body.clienteId = cliente._id;
        body.clienteName = cliente.name;
      }

      if (isSplit) {
        body.payments = selectedMethods.map((m) => ({
          method: m,
          amount: Number(Number(valores[m]).toFixed(2)),
          installments: m === 'CREDITO' ? (parcelas[m] || 1) : 1,
        }));
      } else {
        const m = selectedMethods[0];
        body.paymentMethod = m;
        body.installments = m === 'CREDITO' ? (parcelas[m] || 1) : 1;
      }

      const res = await api.post('/vendas', body);
      const newVendaId = res.data.venda._id;
      setVendaId(newVendaId);
      sessionStorage.removeItem('vendaPendente');

      // Carregar dados do recibo
      setLoadingReceipt(true);
      try {
        const receiptRes = await api.get(`/vendas/${newVendaId}/receipt-data`);
        setReceiptData(receiptRes.data.receiptData);
      } catch (receiptErr) {
        console.warn('[Pagamento] Erro ao carregar recibo:', receiptErr);
        // Mesmo se falhar, a venda foi criada. Permite continuar
        setReceiptData(null);
      } finally {
        setLoadingReceipt(false);
      }

      setVendaConcluida(true);
    } catch (err) {
      console.error('[Pagamento] erro:', err);
      toast.error(err.message || 'Falha ao registrar venda.');
    } finally {
      setFinalizando(false);
    }
  };

  // ── Tela de sucesso ──
  if (vendaConcluida) {
    const handleCloseReceipt = () => {
      navigate('/nova-venda');
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        {receiptData && (
          <ReceiptPrint
            receiptData={receiptData}
            onClose={handleCloseReceipt}
          />
        )}

        {!receiptData && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-semibold mb-1">Venda Concluída!</h2>
            <p className="text-sm text-text-secondary mb-2">
              Vendedor: <span className="font-medium text-text-primary">{dadosVenda?.vendorName}</span>
            </p>
            <p className="text-2xl font-bold text-accent mb-1">{formatBRL(total)}</p>
            {cliente && (
              <p className="text-xs text-amber-300 mb-6">
                Fiado registrado para <span className="font-semibold">{cliente.name}</span>
              </p>
            )}
            {loadingReceipt && (
              <p className="text-xs text-text-muted mb-6">Carregando recibo...</p>
            )}
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" onClick={() => navigate('/sales')}>Ver Relatório</Button>
              <Button onClick={() => navigate('/nova-venda')}>Nova Venda</Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!dadosVenda) return null;

  const podeAvancar =
    selectedMethods.length > 0 &&
    (!isSplit || somaOk) &&
    (!temFiado || !!cliente);

  return (
    <div className="max-w-lg mx-auto space-y-5 animate-fade-in">
      {/* Cabeçalho */}
      <div>
        <div className="text-xs text-text-muted">Vendas › Etapa 2 de 2</div>
        <h1 className="text-xl font-semibold mt-1">Forma de Pagamento</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {dadosVenda.vendorName} —{' '}
          <span className="font-bold text-accent">{formatBRL(total)}</span>
        </p>
      </div>

      {/* Resumo */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <p className="label-caps mb-3">Resumo</p>
        <div className="space-y-1.5">
          {dadosVenda.items.map((item) => (
            <div key={item.sku} className="flex justify-between text-sm">
              <span className="text-text-secondary">
                {item.name} <span className="text-text-muted text-xs">x{item.quantity}</span>
              </span>
              <span className="data-mono text-text-primary">{formatBRL(item.total)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border mt-3 pt-3 flex justify-between text-sm font-semibold">
          <span>Total</span>
          <span className="data-mono text-accent">{formatBRL(total)}</span>
        </div>
      </div>

      {/* Seleção de método(s) */}
      <div className="space-y-2">
        <p className="label-caps">Forma(s) de Pagamento</p>
        <p className="text-xs text-text-muted">
          Toque em uma forma para usar 100%. Selecione mais de uma para fragmentar o valor.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {METODOS.map((m) => {
            const Icon = m.icon;
            const ativo = selectedMethods.includes(m.id);
            const isFiado = m.id === 'FIADO';
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMethod(m.id)}
                className={`flex items-center gap-2.5 p-3 rounded-lg border transition-all text-left ${
                  ativo
                    ? isFiado
                      ? 'border-amber-500/50 bg-amber-500/10'
                      : 'border-accent bg-accent/10'
                    : 'border-border bg-surface hover:border-accent/40 hover:bg-surface-hover'
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${
                    ativo ? (isFiado ? 'text-amber-300' : 'text-accent') : 'text-text-muted'
                  }`}
                />
                <div className="min-w-0">
                  <div
                    className={`text-xs font-semibold leading-tight ${
                      ativo ? (isFiado ? 'text-amber-300' : 'text-accent') : 'text-text-primary'
                    }`}
                  >
                    {m.label}
                  </div>
                  <div className="text-[10px] text-text-muted leading-tight truncate">{m.descricao}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Campos de valor por método (apenas quando split) + parcelas para CREDITO */}
      {selectedMethods.length > 0 && (
        <div className="space-y-2">
          {isSplit && (
            <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Valor por forma</p>
                <span
                  className={`text-xs font-mono ${
                    somaOk ? 'text-accent' : 'text-status-critical'
                  }`}
                >
                  Soma: {formatBRL(somaValores)} {somaOk ? '✓' : `(falta ${formatBRL(delta)})`}
                </span>
              </div>
              {selectedMethods.map((m) => (
                <div key={m} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-text-secondary w-20">{m}</span>
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-text-muted">R$</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={valores[m] ?? ''}
                      onChange={(e) => setValor(m, e.target.value)}
                      className="w-full bg-background border border-border rounded pl-7 pr-2 py-1.5 text-xs font-mono text-right focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedMethods.includes('CREDITO') && (
            <div className="bg-surface border border-border rounded-lg p-4">
              <p className="label-caps mb-2">Parcelas (Crédito)</p>
              <div className="grid grid-cols-4 gap-1.5">
                {PARCELAS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setParcelas((prev) => ({ ...prev, CREDITO: n }))}
                    className={`py-1.5 rounded text-xs font-semibold border transition-all ${
                      (parcelas.CREDITO || 1) === n
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border bg-background text-text-secondary hover:border-accent/40'
                    }`}
                  >
                    {n === 1 ? 'À vista' : `${n}x`}
                  </button>
                ))}
              </div>
              {(parcelas.CREDITO || 1) > 1 && (
                <p className="text-xs text-text-muted mt-2">
                  {parcelas.CREDITO}x de{' '}
                  <span className="font-semibold text-accent">
                    {formatBRL((Number(valores.CREDITO) || 0) / parcelas.CREDITO)}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cliente picker — aparece sempre que FIADO está selecionado */}
      {temFiado && (
        <div className="bg-amber-500/5 border border-amber-500/30 rounded-lg p-4 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <UserCircle className="w-4 h-4 text-amber-300" />
            <p className="text-sm font-semibold text-amber-200">Cliente do Fiado</p>
          </div>
          <p className="text-xs text-text-muted">
            O valor do fiado será adicionado ao saldo devedor do cliente selecionado.
          </p>
          <ClientePicker
            selected={cliente}
            onSelect={setCliente}
            onClear={() => setCliente(null)}
          />
        </div>
      )}

      {/* Ações */}
      <div className="flex justify-between items-center pt-1">
        <button
          onClick={() => navigate('/nova-venda')}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <Button onClick={finalizarVenda} loading={finalizando} disabled={!podeAvancar}>
          Finalizar Venda
        </Button>
      </div>
    </div>
  );
}

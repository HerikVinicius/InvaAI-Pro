import { useEffect, useState } from 'react';
import { Calendar, ChevronRight, Lock, Unlock, XCircle, AlertTriangle, ArrowUpRight, ArrowDownRight, Wallet, Receipt, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { caixaService } from '../services/caixaService';
import { vendasService } from '../services/salesService';
import Button from '../components/ui/Button';
import CancelSaleModal from '../components/caixa/CancelSaleModal';

const fmt = (n) => `R$ ${(n || 0).toFixed(2)}`;
const fmtDate = (d) => new Date(d).toLocaleString('pt-BR');

const TYPE_BADGE = {
  VENDA: { label: 'Venda', bg: 'bg-accent/15', text: 'text-accent' },
  RECEBIMENTO: { label: 'Recebimento', bg: 'bg-sky-500/15', text: 'text-sky-300' },
  SANGRIA: { label: 'Sangria', bg: 'bg-amber-500/15', text: 'text-amber-300' },
  ESTORNO: { label: 'Estorno', bg: 'bg-status-critical/15', text: 'text-status-critical' },
};

export default function HistoricoCaixa() {
  const [caixas, setCaixas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('todos');
  const [selectedCaixa, setSelectedCaixa] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sales, setSales] = useState([]);
  const [cancelTarget, setCancelTarget] = useState(null);

  const loadCaixas = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus !== 'todos') params.status = filterStatus;
      const res = await caixaService.list(params);
      setCaixas(res.data.caixas || []);
    } catch (err) {
      toast.error(err.message || 'Falha ao carregar caixas.');
    } finally {
      setLoading(false);
    }
  };

  const loadCaixaDetail = async (caixa) => {
    setSelectedCaixa(caixa);
    setDetailLoading(true);
    try {
      const [resumoRes, salesRes] = await Promise.all([
        caixaService.resumo(caixa._id),
        vendasService.list({ caixaId: caixa._id, limit: 100 }),
      ]);
      setDetail(resumoRes.data);
      setSales(salesRes.data.vendas || []);
    } catch (err) {
      toast.error(err.message || 'Falha ao carregar detalhes do caixa.');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadCaixas();
  }, [filterStatus]);

  const reloadDetail = () => {
    if (selectedCaixa) loadCaixaDetail(selectedCaixa);
    loadCaixas();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-text-muted">Home › Caixa › Histórico</div>
          <h1 className="text-xl font-semibold mt-1">Histórico de Caixa</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Cada turno aberto/fechado, com entradas, saídas e justificativas.
          </p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4 flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Filter className="w-3.5 h-3.5" />
          <span>Filtrar por status:</span>
        </div>
        {['todos', 'ABERTO', 'FECHADO'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`text-xs px-3 py-1.5 rounded transition-colors ${
              filterStatus === s
                ? 'bg-accent/15 text-accent border border-accent/30'
                : 'border border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {s === 'todos' ? 'Todos' : s === 'ABERTO' ? 'Abertos' : 'Fechados'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* List of caixas */}
        <div className="col-span-12 lg:col-span-5 bg-surface border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Turnos ({caixas.length})</h3>
          </div>
          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-12 text-center text-sm text-text-secondary">Carregando…</div>
            ) : caixas.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-text-secondary">
                Nenhum caixa encontrado.
              </div>
            ) : (
              caixas.map((c) => (
                <button
                  key={c._id}
                  onClick={() => loadCaixaDetail(c)}
                  className={`w-full text-left px-4 py-3 hover:bg-surface-hover transition-colors flex items-center gap-3 ${
                    selectedCaixa?._id === c._id ? 'bg-surface-hover border-l-2 border-accent' : ''
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${
                      c.status === 'ABERTO'
                        ? 'bg-accent/15 text-accent'
                        : 'bg-text-muted/10 text-text-muted'
                    }`}
                  >
                    {c.status === 'ABERTO' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{fmtDate(c.openedAt)}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="text-xs text-text-muted truncate">
                      {c.openedByName}
                      {c.summary?.entradas > 0 && (
                        <> · Entradas {fmt(c.summary.entradas)}</>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="col-span-12 lg:col-span-7">
          {!selectedCaixa && (
            <div className="bg-surface border border-border rounded-lg p-12 text-center">
              <Receipt className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
              <p className="text-sm text-text-secondary">Selecione um turno à esquerda para ver o detalhamento.</p>
            </div>
          )}

          {selectedCaixa && detailLoading && (
            <div className="bg-surface border border-border rounded-lg p-12 text-center text-sm text-text-secondary">
              Carregando…
            </div>
          )}

          {selectedCaixa && detail && !detailLoading && (
            <CaixaDetail
              caixa={selectedCaixa}
              detail={detail}
              sales={sales}
              onCancelSale={(sale) => setCancelTarget(sale)}
            />
          )}
        </div>
      </div>

      <CancelSaleModal
        open={!!cancelTarget}
        sale={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onCancelled={() => { setCancelTarget(null); reloadDetail(); }}
      />
    </div>
  );
}

function CaixaDetail({ caixa, detail, sales, onCancelSale }) {
  const { resumo, justificativasSaidas, transactions } = detail;
  const caixaAberto = caixa.status === 'ABERTO';

  return (
    <div className="space-y-4">
      {/* Resumo header */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-text-muted">Turno</div>
            <div className="font-mono text-sm font-medium">{caixa._id?.slice(-8)}</div>
          </div>
          <StatusBadge status={caixa.status} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Saldo Inicial" value={fmt(resumo.initialAmount)} tone="muted" icon={Wallet} />
          <Stat label="Entradas Totais" value={fmt(resumo.entradas.total)} tone="accent" icon={ArrowUpRight} />
          <Stat label="Saídas Totais" value={fmt(Math.abs(resumo.saidas.total))} tone="critical" icon={ArrowDownRight} />
          <Stat label="Saldo Final" value={fmt(resumo.saldoFinal)} tone="primary" icon={Wallet} bold />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="bg-surface-elevated border border-border rounded-md p-3 space-y-1">
            <div className="label-caps mb-1">Entradas</div>
            <Row label="Vendas" value={fmt(resumo.entradas.vendas)} positive />
            <Row label="Recebimentos" value={fmt(resumo.entradas.recebimentos)} positive />
          </div>
          <div className="bg-surface-elevated border border-border rounded-md p-3 space-y-1">
            <div className="label-caps mb-1">Saídas</div>
            <Row label="Sangrias" value={fmt(Math.abs(resumo.saidas.sangrias))} negative />
            <Row label="Estornos" value={fmt(Math.abs(resumo.saidas.estornos))} negative />
          </div>
        </div>

        {caixa.status === 'FECHADO' && caixa.summary && (
          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Contado em caixa</span>
              <span className="font-mono">{fmt(caixa.countedAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-text-secondary">Diferença</span>
              <span
                className={`font-mono font-semibold ${
                  Math.abs(caixa.summary.diferenca) < 0.01
                    ? 'text-accent'
                    : 'text-status-critical'
                }`}
              >
                {caixa.summary.diferenca >= 0 ? '+' : ''}{fmt(caixa.summary.diferenca)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Justificativas de Saídas (Sangrias + Estornos) — for quick audit per spec */}
      {justificativasSaidas?.length > 0 && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold">Justificativas de Saídas</h3>
            <span className="text-xs text-text-muted ml-auto">{justificativasSaidas.length}</span>
          </div>
          <div className="divide-y divide-border">
            {justificativasSaidas.map((j) => {
              const badge = TYPE_BADGE[j.type];
              return (
                <div key={j._id} className="px-4 py-3 flex items-start gap-3">
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${badge.bg} ${badge.text} flex-shrink-0 mt-0.5`}>
                    {badge.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    {/* Description in italic right below the amount for clarity (per spec) */}
                    <div className="text-sm font-bold text-status-critical">
                      − {fmt(Math.abs(j.amount))}
                    </div>
                    <div className="text-xs italic text-text-secondary mt-0.5">
                      {j.description}
                    </div>
                    <div className="text-[10px] text-text-muted mt-1">
                      {fmtDate(j.createdAt)} · {j.createdByName || 'sistema'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sales of this caixa with cancel buttons */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold">Vendas deste Turno</h3>
          <span className="text-xs text-text-muted">{sales.length}</span>
        </div>
        <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
          {sales.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-text-secondary">
              Nenhuma venda neste turno.
            </div>
          ) : (
            sales.map((s) => (
              <SaleRow
                key={s._id}
                sale={s}
                caixaAberto={caixaAberto}
                onCancel={() => onCancelSale(s)}
              />
            ))
          )}
        </div>
      </div>

      {/* Full transaction log */}
      <details className="bg-surface border border-border rounded-lg overflow-hidden">
        <summary className="px-4 py-3 cursor-pointer hover:bg-surface-hover transition-colors">
          <span className="text-sm font-semibold">Movimentações completas ({transactions.length})</span>
        </summary>
        <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
          {transactions.map((t) => {
            const badge = TYPE_BADGE[t.type];
            const isNegative = t.amount < 0;
            return (
              <div key={t._id} className="px-4 py-3 flex items-center gap-3">
                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </span>
                <div className="flex-1 min-w-0">
                  {isNegative && t.description && (
                    <div className="text-xs italic text-text-secondary truncate">{t.description}</div>
                  )}
                  {!isNegative && t.description && (
                    <div className="text-xs text-text-secondary truncate">{t.description}</div>
                  )}
                  <div className="text-[10px] text-text-muted">
                    {fmtDate(t.createdAt)} · {t.createdByName}
                  </div>
                </div>
                <div className={`font-mono text-sm font-bold ${isNegative ? 'text-status-critical' : 'text-accent'}`}>
                  {isNegative ? '−' : '+'} {fmt(Math.abs(t.amount))}
                </div>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}

function SaleRow({ sale, caixaAberto, onCancel }) {
  const isCancelled = sale.status === 'CANCELADA';
  return (
    <div className="px-4 py-3 flex items-center gap-3 hover:bg-surface-hover transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs">#{sale._id?.slice(-8)}</span>
          {isCancelled ? (
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-status-critical/15 text-status-critical">
              Cancelada
            </span>
          ) : (
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-accent/15 text-accent">
              Concluída
            </span>
          )}
          {sale.paymentMethod === 'FIADO' && (
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-300">
              Fiado
            </span>
          )}
        </div>
        <div className="text-xs text-text-secondary mt-0.5">
          {sale.vendorName} · {sale.items?.length || 0} item(s)
          {sale.clienteName && ` · ${sale.clienteName}`}
        </div>
        {isCancelled && sale.cancelReason && (
          <div className="text-[11px] italic text-status-critical mt-1">
            Motivo: {sale.cancelReason}
          </div>
        )}
      </div>
      <div className="text-right">
        <div className={`font-mono text-sm font-semibold ${isCancelled ? 'line-through text-text-muted' : 'text-text-primary'}`}>
          {fmt(sale.totalAmount)}
        </div>
        <button
          onClick={onCancel}
          disabled={isCancelled || !caixaAberto}
          title={
            isCancelled
              ? 'Venda já cancelada'
              : !caixaAberto
                ? 'Caixa deste turno já está fechado — cancelamento bloqueado'
                : 'Cancelar venda'
          }
          className="mt-1 inline-flex items-center gap-1 text-[11px] text-status-critical hover:underline disabled:text-text-muted disabled:no-underline disabled:cursor-not-allowed"
        >
          <XCircle className="w-3 h-3" /> Cancelar
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = 'primary', icon: Icon, bold }) {
  const tones = {
    accent: 'text-accent',
    critical: 'text-status-critical',
    muted: 'text-text-muted',
    primary: 'text-text-primary',
  };
  return (
    <div className="bg-surface-elevated border border-border rounded-md p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="label-caps">{label}</span>
        {Icon && <Icon className={`w-3.5 h-3.5 ${tones[tone]}`} />}
      </div>
      <div className={`font-mono ${bold ? 'text-lg font-bold' : 'text-base font-semibold'} ${tones[tone]}`}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    ABERTO: 'bg-accent/15 text-accent',
    FECHADO: 'bg-text-muted/15 text-text-muted',
  };
  return (
    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${map[status] || map.FECHADO}`}>
      {status}
    </span>
  );
}

function Row({ label, value, positive, negative }) {
  const color = positive ? 'text-accent' : negative ? 'text-status-critical' : 'text-text-primary';
  return (
    <div className="flex justify-between">
      <span className="text-text-secondary">{label}</span>
      <span className={`font-mono ${color}`}>{value}</span>
    </div>
  );
}

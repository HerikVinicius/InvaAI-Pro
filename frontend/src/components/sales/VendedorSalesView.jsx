import { Calendar, Shield, Info, ShoppingCart, Package, Trophy, XCircle, Receipt } from 'lucide-react';
import { useVendedorSalesData } from '../../hooks/useVendedorSalesData';

const formatDate = (date) => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return `Hoje, ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return `Ontem, ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

function VendorStatCard({ label, value, sub, tone, icon: Icon }) {
  const tones = {
    accent: 'text-accent',
    sky: 'text-sky-300',
    amber: 'text-amber-300',
    critical: 'text-status-critical',
  };
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="label-caps">{label}</span>
        {Icon && <Icon className={`w-4 h-4 ${tones[tone]}`} />}
      </div>
      <div className={`font-mono text-2xl font-semibold ${tones[tone]}`}>{value}</div>
      <div className="text-xs text-text-muted mt-1 truncate">{sub}</div>
    </div>
  );
}

export default function VendedorSalesView() {
  const {
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
  } = useVendedorSalesData();

  const totalVendas = vendas.filter((v) => v.status === 'CONCLUIDA').length;
  const totalItens = vendas
    .filter((v) => v.status === 'CONCLUIDA')
    .reduce((s, v) => s + (v.items?.reduce((a, i) => a + (i.quantity || 0), 0) || 0), 0);
  const totalCanceladas = vendas.filter((v) => v.status === 'CANCELADA').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-text-muted">Minhas Vendas</div>
          <h1 className="text-xl font-semibold mt-1">Suas Vendas Recentes</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Histórico individual com filtro por período (máximo 30 dias).
          </p>
        </div>
      </div>

      {warning && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex gap-3 text-sm">
          <Info className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
          <span className="text-text-secondary">{warning}</span>
        </div>
      )}

      <div className="bg-surface border border-border rounded-lg p-4 flex items-end gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Calendar className="w-3.5 h-3.5" />
          <span>Período</span>
        </div>
        <div className="flex flex-col gap-1">
          <label className="label-caps">De</label>
          <input
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="label-caps">Até</label>
          <input
            type="date"
            value={to}
            min={from}
            max={toInputDate(today)}
            onChange={(e) => setTo(e.target.value)}
            className="bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <div
          className={`text-xs px-2 py-1 rounded ${
            exceedsLimit
              ? 'bg-status-critical/10 text-status-critical'
              : 'bg-accent/10 text-accent'
          }`}
        >
          {rangeDays} {rangeDays === 1 ? 'dia' : 'dias'} / máx 30
        </div>
        <div className="ml-auto inline-flex items-center gap-1.5 text-[10px] text-text-muted">
          <Shield className="w-3 h-3" />
          Limite de privacidade aplicado
        </div>
      </div>

      {exceedsLimit && (
        <div className="bg-status-critical/10 border border-status-critical/30 rounded-lg p-3 flex gap-3 text-sm">
          <Shield className="w-4 h-4 text-status-critical flex-shrink-0 mt-0.5" />
          <div className="text-text-secondary">
            Período excede o limite de <strong className="text-status-critical">30 dias</strong>.
            Ajuste as datas para visualizar.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <VendorStatCard label="Vendas Concluídas" value={totalVendas} sub="no período" tone="accent" icon={ShoppingCart} />
        <VendorStatCard label="Unidades Vendidas" value={totalItens} sub="produtos saídos" tone="sky" icon={Package} />
        <VendorStatCard
          label="Sua Posição"
          value={myRanking.position ? `#${myRanking.position}` : '—'}
          sub={`de ${myRanking.totalVendedores || 0} vendedores`}
          tone="amber"
          icon={Trophy}
        />
        <VendorStatCard label="Canceladas" value={totalCanceladas} sub="no período" tone="critical" icon={XCircle} />
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Receipt className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold">Minhas Vendas no Período</h3>
          <span className="ml-auto text-xs text-text-muted">{vendas.length} registros</span>
        </div>

        {loading ? (
          <div className="px-5 py-12 text-center text-sm text-text-secondary">Carregando…</div>
        ) : vendas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mb-3">
              <Receipt className="w-5 h-5 text-text-muted opacity-50" />
            </div>
            <p className="text-sm text-text-secondary">Nenhuma venda no período.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {vendas.map((v) => {
              const itemsCount = v.items?.reduce((s, i) => s + i.quantity, 0) || 0;
              const isCancelled = v.status === 'CANCELADA';
              return (
                <div
                  key={v._id}
                  className={`px-5 py-3.5 hover:bg-surface-hover transition-colors ${
                    isCancelled ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-semibold">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-mono text-xs">#{v._id?.slice(-8)}</span>
                        {isCancelled && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-status-critical/15 text-status-critical inline-flex items-center gap-1">
                            <XCircle className="w-2.5 h-2.5" /> Cancelada
                          </span>
                        )}
                        {v.paymentMethod === 'FIADO' && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">
                            Fiado
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-text-muted flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {itemsCount} {itemsCount === 1 ? 'item' : 'itens'}
                        </span>
                        <span>·</span>
                        <span>{formatDate(v.createdAt)}</span>
                      </div>
                      {isCancelled && v.cancelReason && (
                        <div className="text-[11px] italic text-status-critical mt-1 truncate">
                          Motivo: {v.cancelReason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-surface border border-border rounded-lg p-4 text-xs text-text-muted flex gap-3">
        <Shield className="w-4 h-4 text-accent flex-shrink-0" />
        <div>
          Esta tela exibe <strong className="text-text-primary">apenas suas próprias vendas</strong>. Valores monetários, ranking de colegas e relatórios financeiros são restritos ao lojista.
        </div>
      </div>
    </div>
  );
}

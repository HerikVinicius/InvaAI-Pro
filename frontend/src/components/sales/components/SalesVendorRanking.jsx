import { Trophy } from 'lucide-react';

const formatBRLCompact = (value) => {
  const v = value || 0;
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(1)}k`;
  return `R$ ${v.toFixed(0)}`;
};

export default function SalesVendorRanking({ topVendedores = [] }) {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <Trophy className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold">Ranking de Vendedores</h3>
      </div>
      {topVendedores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Trophy className="w-8 h-8 text-text-muted opacity-30 mb-2" />
          <p className="text-xs text-text-secondary">Sem dados ainda</p>
        </div>
      ) : (
        <div className="p-2">
          {topVendedores.map((v, i) => {
            const isFirst = i === 0;
            const isPodium = i < 3;
            const pctOfTop = topVendedores[0].totalVendido > 0
              ? (v.totalVendido / topVendedores[0].totalVendido) * 100
              : 0;
            const initials = v.vendorName?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
            return (
              <div
                key={v._id}
                className={`px-3 py-3 rounded-lg ${isFirst ? 'bg-gradient-to-r from-accent/10 to-transparent' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isFirst ? 'bg-accent text-background' :
                      isPodium ? 'bg-accent/20 text-accent' :
                      'bg-surface-elevated text-text-secondary'
                    }`}>
                      {initials}
                    </div>
                    {isPodium && (
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-surface ${
                        isFirst ? 'bg-yellow-500 text-yellow-900' :
                        i === 1 ? 'bg-zinc-300 text-zinc-800' :
                        'bg-amber-700 text-amber-100'
                      }`}>
                        {i + 1}
                      </div>
                    )}
                    {!isPodium && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-surface bg-surface-elevated text-text-secondary">
                        {i + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{v.vendorName}</div>
                    <div className="text-[10px] text-text-muted">
                      {v.quantidadeVendas} venda{v.quantidadeVendas === 1 ? '' : 's'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="data-mono text-xs font-semibold text-accent">
                      {formatBRLCompact(v.totalVendido)}
                    </div>
                  </div>
                </div>
                {!isFirst && pctOfTop > 0 && (
                  <div className="mt-2 ml-12 h-1 bg-surface-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent/40 transition-all"
                      style={{ width: `${pctOfTop}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

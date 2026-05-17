import { DollarSign, Package, Boxes } from 'lucide-react';
import Badge from '../ui/Badge';

const formatBRL = (value) =>
  (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

export default function DashboardMetrics({ sales = {}, inventory = {}, variacao = 0, rangeLabel = '' }) {
  const variacaoUp = variacao >= 0;
  const temVendas = (sales.quantidadeVendasTotal || 0) > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-surface border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="label-caps">Receita Total</span>
          <DollarSign className="w-4 h-4 text-accent" />
        </div>
        <div className="font-mono text-2xl font-semibold text-accent">
          {formatBRL(sales.receitaTotal)}
        </div>
        <div className="text-xs text-text-secondary mt-2">
          {sales.quantidadeVendasTotal || 0} venda{sales.quantidadeVendasTotal === 1 ? '' : 's'} concluída{sales.quantidadeVendasTotal === 1 ? '' : 's'}
          {rangeLabel ? ` · ${rangeLabel}` : ''}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="label-caps">Unidades Vendidas</span>
          <Package className="w-4 h-4 text-text-muted" />
        </div>
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-2xl font-semibold">
            {(sales.unidadesTotais || 0).toLocaleString('pt-BR')}
          </span>
          {temVendas && (
            <Badge variant={variacaoUp ? 'HEALTHY' : 'CRITICAL'}>
              {variacaoUp ? '+' : ''}{variacao}%
            </Badge>
          )}
        </div>
        <div className="text-xs text-text-secondary mt-2">vs mês anterior</div>
      </div>

      <div className="bg-surface border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="label-caps">Valor do Estoque</span>
          <Boxes className="w-4 h-4 text-text-muted" />
        </div>
        <div className="font-mono text-2xl font-semibold">
          {formatBRL(inventory.totalInventoryValue)}
        </div>
        <div className="text-xs text-text-secondary mt-2">
          {inventory.totalSkuCount || 0} SKUs registrados
        </div>
      </div>
    </div>
  );
}

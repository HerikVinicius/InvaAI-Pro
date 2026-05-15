import { useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '../../ui/Button';
import { calculateVendedoresSummary } from '../../../utils/business-logic';
import VendedoresSummary from '../components/VendedoresSummary';
import VendedoresFilters from '../components/VendedoresFilters';
import VendedoresTable from '../components/VendedoresTable';

export default function VendedoresPage({
  vendedores = [],
  pagination = {},
  loading = false,
  canManage = false,
  onOpenModal = () => {},
  onLoadPage = () => {},
  onToggleActive = () => {},
  onPermissionsOpen = () => {},
}) {
  const [filtroRegiao, setFiltroRegiao] = useState('todas');
  const [filtroDesempenho, setFiltroDesempenho] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('ativos');

  const summary = calculateVendedoresSummary(vendedores);
  const regioes = ['todas', ...new Set(vendedores.map((v) => v.warehouseUnit).filter(Boolean))];

  const vendedoresFiltrados = vendedores.filter((v) => {
    if (filtroStatus === 'ativos' && !v.isActive) return false;
    if (filtroStatus === 'inativos' && v.isActive) return false;
    if (filtroRegiao !== 'todas' && v.warehouseUnit !== filtroRegiao) return false;

    const pct = v.achievementPercentage || 0;
    if (filtroDesempenho === 'alto' && pct < 80) return false;
    if (filtroDesempenho === 'medio' && (pct < 40 || pct >= 80)) return false;
    if (filtroDesempenho === 'baixo' && pct >= 40) return false;

    return true;
  });

  const limparFiltros = () => {
    setFiltroRegiao('todas');
    setFiltroDesempenho('todos');
    setFiltroStatus('ativos');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-text-muted">Home › Vendedores</div>
          <h1 className="text-xl font-semibold mt-1">Gestão de Equipe de Vendas</h1>
        </div>
        {canManage && (
          <Button icon={Plus} onClick={() => onOpenModal(null)}>
            Adicionar Novo Vendedor
          </Button>
        )}
      </div>

      <VendedoresSummary
        summary={summary}
        activeCount={summary.activeCount}
        inactiveCount={summary.inactiveCount}
      />

      <VendedoresFilters
        filtroRegiao={filtroRegiao}
        filtroDesempenho={filtroDesempenho}
        filtroStatus={filtroStatus}
        onFiltroRegiao={setFiltroRegiao}
        onFiltroDesempenho={setFiltroDesempenho}
        onFiltroStatus={setFiltroStatus}
        regioes={regioes}
        onLimparFiltros={limparFiltros}
      />

      <VendedoresTable
        vendedoresFiltrados={vendedoresFiltrados}
        vendedores={vendedores}
        pagination={pagination}
        loading={loading}
        canManage={canManage}
        onOpenModal={onOpenModal}
        onLoadPage={onLoadPage}
        onToggleActive={onToggleActive}
        onPermissionsOpen={onPermissionsOpen}
      />
    </div>
  );
}

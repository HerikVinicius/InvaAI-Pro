import { Plus, Search, Phone } from 'lucide-react';
import Button from '../../ui/Button';
import ClientesSummary from '../ClientesSummary';
import ClientesFilters from '../ClientesFilters';
import ClientesTable from '../ClientesTable';

/**
 * Página de Apresentação para Clientes
 * Responsabilidades:
 * - Renderizar UI
 * - Passar dados aos componentes filhos
 * - Disparar callbacks (sem lógica)
 *
 * Recebe TUDO via props - não tem estado próprio (além de UI temporária)
 */
export default function ClientesPage({
  clientes = [],
  loading = false,
  summary = {},
  filters = {},
  onSearchChange = () => {},
  onFilterDebtChange = () => {},
  onCreateClick = () => {},
  onPaymentClick = () => {},
}) {
  const { search = '', onlyWithDebt = false } = filters;
  const { total = 0, comDebito = 0, totalDevedor = 0 } = summary;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-text-muted">Home › Clientes</div>
          <h1 className="text-xl font-semibold mt-1">Clientes & Fiado</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Cadastro de clientes e controle de saldo devedor (fiado).
          </p>
        </div>
        <Button icon={Plus} onClick={onCreateClick}>Novo Cliente</Button>
      </div>

      {/* Resumo */}
      <ClientesSummary
        total={total}
        comDebito={comDebito}
        totalDevedor={totalDevedor}
      />

      {/* Filtros */}
      <ClientesFilters
        search={search}
        onSearchChange={onSearchChange}
        onlyWithDebt={onlyWithDebt}
        onFilterDebtChange={onFilterDebtChange}
      />

      {/* Tabela */}
      <ClientesTable
        clientes={clientes}
        loading={loading}
        onPaymentClick={onPaymentClick}
      />
    </div>
  );
}

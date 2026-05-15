import { Phone, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';
import { fmt } from '../../utils/format';
import { getClienteStatus } from '../../utils/business-logic';

/**
 * Componente Presentacional: Tabela de Clientes
 * Recebe dados via props, renderiza tabela
 */
export default function ClientesTable({
  clientes = [],
  loading = false,
  onPaymentClick = () => {},
}) {
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-surface-elevated border-b border-border">
            <th className="text-left px-4 py-3 label-caps">Cliente</th>
            <th className="text-left px-4 py-3 label-caps">Telefone</th>
            <th className="text-right px-4 py-3 label-caps">Saldo Devedor</th>
            <th className="text-center px-4 py-3 label-caps">Status</th>
            <th className="text-right px-4 py-3 label-caps">Ações</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-sm text-text-secondary">
                Carregando…
              </td>
            </tr>
          ) : clientes.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-sm text-text-secondary">
                Nenhum cliente encontrado.
              </td>
            </tr>
          ) : (
            clientes.map((cliente) => (
              <ClienteRow
                key={cliente._id}
                cliente={cliente}
                onPaymentClick={onPaymentClick}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Componente Presentacional: Linha da Tabela de Clientes
 */
function ClienteRow({ cliente, onPaymentClick = () => {} }) {
  const status = getClienteStatus(cliente.saldoDevedor);
  const isEmAberto = status === 'ABERTO';

  return (
    <tr className="border-b border-border hover:bg-surface-hover transition-colors">
      {/* Nome */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-semibold">
            {cliente.name
              ?.split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
          <span className="text-sm font-medium">{cliente.name}</span>
        </div>
      </td>

      {/* Telefone */}
      <td className="px-4 py-3 text-sm text-text-secondary">
        {cliente.phone ? (
          <span className="inline-flex items-center gap-1.5">
            <Phone className="w-3 h-3 text-text-muted" />
            {cliente.phone}
          </span>
        ) : (
          <span className="text-text-muted">—</span>
        )}
      </td>

      {/* Saldo Devedor */}
      <td className="px-4 py-3 text-right">
        <span
          className={`font-mono text-sm font-semibold ${
            isEmAberto ? 'text-status-critical' : 'text-text-muted'
          }`}
        >
          {fmt(cliente.saldoDevedor)}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3 text-center">
        {isEmAberto ? (
          <span className="inline-flex items-center gap-1 text-xs text-amber-300">
            <AlertCircle className="w-3 h-3" /> Em aberto
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-accent">
            <CheckCircle2 className="w-3 h-3" /> Quite
          </span>
        )}
      </td>

      {/* Ações */}
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => onPaymentClick(cliente)}
          disabled={!isEmAberto}
          className="text-xs font-medium text-accent hover:underline disabled:text-text-muted disabled:no-underline disabled:cursor-not-allowed inline-flex items-center gap-1"
        >
          <DollarSign className="w-3 h-3" /> Receber
        </button>
      </td>
    </tr>
  );
}

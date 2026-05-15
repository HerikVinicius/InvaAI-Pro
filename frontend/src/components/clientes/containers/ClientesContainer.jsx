import { useState } from 'react';
import { useClientesData } from '../../../hooks/useClientesData';
import ClientesPage from '../pages/ClientesPage';
import CreateClienteModal from '../CreateClienteModal';
import PaymentModal from '../PaymentModal';

/**
 * Container Component para Clientes
 * Responsabilidades:
 * - Gerenciar estado de dados
 * - Orquestrar API calls
 * - Passar props para componentes de apresentação
 *
 * NÃO renderiza UI diretamente, apenas lógica e composição
 */
export default function ClientesContainer() {
  // Estados de modal
  const [createOpen, setCreateOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState(null);

  // Lógica de dados (agora em um hook, separado)
  const clientesData = useClientesData({ debounce: 300 });
  const { clientes, loading, filters, setSearch, setOnlyWithDebt, reload } = clientesData;

  // Handlers que orquestram ações
  const handleCreateOpen = () => setCreateOpen(true);
  const handleCreateClose = () => setCreateOpen(false);

  const handleCreated = () => {
    setCreateOpen(false);
    reload(); // Recarrega a lista
  };

  const handlePaymentOpen = (cliente) => setPaymentTarget(cliente);
  const handlePaymentClose = () => setPaymentTarget(null);

  const handlePaymentConfirmed = () => {
    setPaymentTarget(null);
    reload(); // Recarrega a lista
  };

  // Props para passar para o componente de apresentação
  const pageProps = {
    // Dados
    clientes,
    loading,
    summary: clientesData.summary,

    // Filtros
    filters,
    onSearchChange: setSearch,
    onFilterDebtChange: setOnlyWithDebt,

    // Ações
    onCreateClick: handleCreateOpen,
    onPaymentClick: handlePaymentOpen,
  };

  return (
    <>
      {/* Componente de apresentação puro */}
      <ClientesPage {...pageProps} />

      {/* Modais (também controláveis) */}
      <CreateClienteModal
        open={createOpen}
        onClose={handleCreateClose}
        onCreated={handleCreated}
      />

      <PaymentModal
        open={!!paymentTarget}
        cliente={paymentTarget}
        onClose={handlePaymentClose}
        onPaid={handlePaymentConfirmed}
      />
    </>
  );
}

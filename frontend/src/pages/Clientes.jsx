import { useState } from 'react';
import { useClientesData } from '../hooks/useClientesData';
import ClientesPage from '../components/clientes/pages/ClientesPage';
import CreateClienteModal from '../components/clientes/CreateClienteModal';
import PaymentModal from '../components/clientes/PaymentModal';

/**
 * CONTAINER: Clientes.jsx
 * Responsabilidades:
 * - Gerenciar estado de dados (via hook)
 * - Gerenciar estado de modais
 * - Orquestrar callbacks
 * - Renderizar componente de página
 */
export default function Clientes() {
  // Estado de modais
  const [createOpen, setCreateOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState(null);

  // Lógica de dados (extraída para hook)
  const clientesData = useClientesData({ debounce: 300 });
  const { clientes, loading, filters, setSearch, setOnlyWithDebt, reload } = clientesData;

  // Handlers que orquestram ações
  const handleCreateOpen = () => setCreateOpen(true);
  const handleCreateClose = () => setCreateOpen(false);

  const handleCreated = () => {
    setCreateOpen(false);
    reload();
  };

  const handlePaymentOpen = (cliente) => setPaymentTarget(cliente);
  const handlePaymentClose = () => setPaymentTarget(null);

  const handlePaymentConfirmed = () => {
    setPaymentTarget(null);
    reload();
  };

  // Props para componente de apresentação
  const pageProps = {
    clientes,
    loading,
    summary: clientesData.summary,
    filters,
    onSearchChange: setSearch,
    onFilterDebtChange: setOnlyWithDebt,
    onCreateClick: handleCreateOpen,
    onPaymentClick: handlePaymentOpen,
  };

  return (
    <>
      <ClientesPage {...pageProps} />

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

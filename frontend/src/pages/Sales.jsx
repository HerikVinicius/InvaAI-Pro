import { useAuthStore } from '../store/authStore';
import FullSalesView from '../components/sales/FullSalesView';
import VendedorSalesView from '../components/sales/VendedorSalesView';

export default function Sales() {
  const { user } = useAuthStore();
  if (user?.role === 'vendedor') return <VendedorSalesView />;
  return <FullSalesView />;
}

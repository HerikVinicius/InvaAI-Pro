import { ShoppingCart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/**
 * FAB "Nova Venda" — always-visible shortcut. Hides itself on the routes
 * where it would be redundant (Nova Venda, Pagamento, Login, Register).
 * Only roles allowed to register sales see it.
 */
const HIDDEN_ROUTES = ['/nova-venda', '/pagamento', '/login', '/register'];
const ALLOWED_ROLES = ['master', 'admin', 'lojista'];

export default function FloatingActionButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  if (!user || !ALLOWED_ROLES.includes(user.role)) return null;
  if (HIDDEN_ROUTES.includes(location.pathname)) return null;

  return (
    <button
      onClick={() => navigate('/nova-venda')}
      title="Registrar Nova Venda"
      aria-label="Nova Venda"
      className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-accent text-background flex items-center justify-center shadow-lg hover:bg-accent-hover hover:scale-105 active:scale-95 transition-all group"
    >
      <ShoppingCart className="w-5 h-5" />
      <span className="absolute right-full mr-3 whitespace-nowrap text-xs font-medium bg-surface border border-border rounded-md px-2 py-1 text-text-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Nova Venda
      </span>
    </button>
  );
}

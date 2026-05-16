import { Navigate } from 'react-router-dom';
import { useAuthStore, can } from '../store/authStore';

// Rota inicial conforme o role — evita loops para roles operacionais que não têm dashboard.
export const homeRouteFor = (role) => {
  if (role === 'vendedor' || role === 'gerente') return '/inventory';
  return '/dashboard';
};

// Rotas que aceitam acesso via override de permissão, além da lista de roles.
// Se o usuário tiver a permissão ativa (override ou padrão da role), passa.
const PERMISSION_ROUTES = {
  caixa:      'permitir_abrir_caixa',
  historico:  'permitir_abrir_caixa',
  inventory:  'permitir_cadastrar_produto',
};

export default function ProtectedRoute({ children, requireRole, requirePermission, requireAiChat }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (requirePermission) {
    if (!can(user, requirePermission)) {
      return <Navigate to={homeRouteFor(user?.role)} replace />;
    }
    return children;
  }

  if (requireRole) {
    const roles = Array.isArray(requireRole) ? requireRole : [requireRole];
    if (!roles.includes(user?.role)) {
      return <Navigate to={homeRouteFor(user?.role)} replace />;
    }
  }

  if (requireAiChat && user?.aiChatEnabled === false) {
    return <Navigate to={homeRouteFor(user?.role)} replace />;
  }

  return children;
}

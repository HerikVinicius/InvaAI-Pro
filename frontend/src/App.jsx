import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute, { homeRouteFor } from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Vendedores from './pages/Vendedores';
import Sales from './pages/Sales';
import AIInsights from './pages/AIInsights';
import Settings from './pages/Settings';
import Users from './pages/Users';
import NovaVenda from './pages/NovaVenda';
import Pagamento from './pages/Pagamento';
import Caixa from './pages/Caixa';
import HistoricoCaixa from './pages/HistoricoCaixa';
import Clientes from './pages/Clientes';

function RootRedirect() {
  const { user } = useAuthStore();
  return <Navigate to={homeRouteFor(user?.role)} replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#121214',
              color: '#dde4dd',
              border: '1px solid #27272a',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#09090b' } },
            error: { iconTheme: { primary: '#ffb4ab', secondary: '#09090b' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard"   element={<ProtectedRoute requireRole={['admin', 'master', 'lojista']}><Dashboard /></ProtectedRoute>} />
            <Route path="/inventory"   element={<ProtectedRoute requireRole={['admin', 'master', 'lojista', 'vendedor', 'gerente']}><Inventory /></ProtectedRoute>} />
            <Route path="/vendedores"  element={<ProtectedRoute requireRole={['admin', 'master', 'lojista']}><Vendedores /></ProtectedRoute>} />
            <Route path="/nova-venda"  element={<ProtectedRoute requireRole={['admin', 'master', 'lojista', 'vendedor', 'gerente']}><NovaVenda /></ProtectedRoute>} />
            <Route path="/pagamento"   element={<ProtectedRoute requireRole={['admin', 'master', 'lojista', 'vendedor', 'gerente']}><Pagamento /></ProtectedRoute>} />
            <Route path="/sales"           element={<ProtectedRoute requireRole={['admin', 'master', 'lojista', 'vendedor', 'gerente']}><Sales /></ProtectedRoute>} />
            <Route path="/caixa"           element={<ProtectedRoute requirePermission="permitir_abrir_caixa"><Caixa /></ProtectedRoute>} />
            <Route path="/historico-caixa" element={<ProtectedRoute requirePermission="permitir_abrir_caixa"><HistoricoCaixa /></ProtectedRoute>} />
            <Route path="/clientes"        element={<ProtectedRoute requireRole={['admin', 'master', 'lojista']}><Clientes /></ProtectedRoute>} />
            <Route path="/ai-insights"     element={<ProtectedRoute requireRole={['admin', 'master', 'lojista']}><AIInsights /></ProtectedRoute>} />
            <Route path="/settings"        element={<Settings />} />
            <Route path="/users"           element={<ProtectedRoute requireRole={['admin', 'master']}><Users /></ProtectedRoute>} />
          </Route>

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

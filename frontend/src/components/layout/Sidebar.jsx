import { NavLink } from 'react-router-dom';
import { LayoutGrid, Archive, Users, Sparkles, Settings, Menu, ShoppingCart, BarChart2, UserCog, Wallet, Receipt, UserCircle } from 'lucide-react';
import { useAuthStore, can } from '../../store/authStore';

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuthStore();

  // Itens de caixa visíveis para quem tem a permissão (gerente incluso via ROLE_DEFAULTS).
  const canCaixa = can(user, 'permitir_abrir_caixa');

  const navItems = [
    { to: '/dashboard',       label: 'Dashboard',           icon: LayoutGrid,   roles: ['admin', 'master', 'lojista'] },
    { to: '/inventory',       label: 'Estoque',             icon: Archive,      roles: ['admin', 'master', 'lojista', 'vendedor', 'gerente'] },
    { to: '/vendedores',      label: 'Vendedores',          icon: Users,        roles: ['admin', 'master', 'lojista'] },
    { to: '/clientes',        label: 'Clientes & Fiado',    icon: UserCircle,   roles: ['admin', 'master', 'lojista'] },
    { to: '/nova-venda',      label: 'Nova Venda',          icon: ShoppingCart, roles: ['admin', 'master', 'lojista', 'vendedor', 'gerente'] },
    { to: '/caixa',           label: 'Caixa',               icon: Wallet,       show: canCaixa },
    { to: '/historico-caixa', label: 'Histórico de Caixa',  icon: Receipt,      show: canCaixa },
    { to: '/sales',           label: 'Relatório de Vendas', icon: BarChart2,    roles: ['admin', 'master', 'lojista', 'vendedor', 'gerente'] },
    { to: '/ai-insights',     label: 'Insights de IA',      icon: Sparkles,     roles: ['admin', 'master', 'lojista'] },
    { to: '/users',           label: 'Usuários',            icon: UserCog,      roles: ['admin', 'master'] },
    { to: '/settings',        label: 'Configurações',       icon: Settings },
  ];

  return (
    <aside className={`flex flex-col bg-surface border-r border-border transition-all duration-200 ${collapsed ? 'w-16' : 'w-60'}`}>
      <div className="flex items-center justify-between p-5 border-b border-border h-[73px]">
        {!collapsed && (
          <div>
            <div className="font-semibold text-accent text-base">InvAI Pro</div>
            <div className="text-xs text-text-muted mt-0.5">Warehouse Delta-9</div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="text-text-muted hover:text-text-primary p-1 rounded"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          // `show` tem precedência sobre `roles` (permite override granular).
          if (item.show === false) return null;
          if (item.show === undefined && item.roles && !item.roles.includes(user?.role)) return null;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent border-r-2 border-accent'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {!collapsed && user && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-xs flex-shrink-0">
              {user.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-text-primary truncate">{user.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted">{user.role}</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-text-muted">Status do Sistema: Ótimo</span>
          </div>
        </div>
      )}
    </aside>
  );
}

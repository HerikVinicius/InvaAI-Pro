import { Search, HelpCircle, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../NotificationBell';

export default function Topbar({ searchPlaceholder = 'Pesquisar...', rightSlot }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-[73px] border-b border-border bg-background flex items-center px-6 gap-4">
      <div className="flex-1 max-w-2xl relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          className="w-full bg-surface border border-border rounded-md pl-9 pr-3 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:border-accent"
        />
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <NotificationBell />
        <button className="p-2 text-text-muted hover:text-text-primary transition-colors" aria-label="Ajuda">
          <HelpCircle className="w-4 h-4" />
        </button>
        {rightSlot}
        <div className="h-6 w-px bg-border" />
        <div className="text-right">
          <div className="text-sm font-semibold text-text-primary">{user?.name}</div>
          <div className="text-[10px] uppercase tracking-wider text-text-muted">{user?.role}</div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-text-muted hover:text-status-critical transition-colors"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

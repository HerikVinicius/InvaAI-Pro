import { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import NotificationToast from '../ui/NotificationToast';
import FloatingActionButton from '../ui/FloatingActionButton';
import { useNotificationStore } from '../../store/notificationStore';
import { notificationService } from '../../services/notificationService';
import { useAuthStore } from '../../store/authStore';

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [displayedToasts, setDisplayedToasts] = useState([]);
  const { addNotification } = useNotificationStore();
  const { syncUser } = useAuthStore();
  const shownIdsRef = useRef(new Set());

  // Sincroniza permissões do usuário com o banco ao montar o layout.
  // Garante que overrides alterados por admins sejam refletidos sem novo login.
  useEffect(() => { syncUser(); }, []);

  useEffect(() => {
    const fetchNewNotifications = async () => {
      try {
        const res = await notificationService.getUnread();
        const unreadNotifs = res.data?.notifications || [];

        unreadNotifs.forEach((notif) => {
          if (!shownIdsRef.current.has(notif._id)) {
            shownIdsRef.current.add(notif._id);
            setDisplayedToasts((prev) => [...prev, notif]);
            addNotification(notif);
          }
        });
      } catch (err) {
        console.debug('Notification check:', err.message);
      }
    };

    fetchNewNotifications();
    const interval = setInterval(fetchNewNotifications, 5000);
    return () => clearInterval(interval);
  }, [addNotification]);

  const handleToastDismiss = (id) => {
    setDisplayedToasts((prev) => prev.filter((t) => t._id !== id));
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Notification Toasts Container */}
      <div className="fixed bottom-4 right-4 space-y-2 z-40 pointer-events-none">
        {displayedToasts.map((notif) => (
          <div key={notif._id} className="pointer-events-auto">
            <NotificationToast notification={notif} onDismiss={() => handleToastDismiss(notif._id)} />
          </div>
        ))}
      </div>

      {/* Floating Action Button — Nova Venda shortcut on every screen */}
      <FloatingActionButton />
    </div>
  );
}

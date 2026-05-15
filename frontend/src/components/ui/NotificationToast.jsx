import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function NotificationToast({ notification, onDismiss }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!isVisible) return null;

  return (
    <div className="animate-slide-down max-w-sm bg-white border border-gray-200 rounded-lg p-4 flex items-start gap-3 shadow-xl">
      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-600">
          {notification.type === 'CRITICAL_STOCK' ? 'Fora de Estoque!' : 'Estoque Baixo'}
        </p>
        <p className="text-xs text-gray-700 mt-1">{notification.productName}</p>
        <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-2">SKU: {notification.sku}</p>
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          onDismiss();
        }}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

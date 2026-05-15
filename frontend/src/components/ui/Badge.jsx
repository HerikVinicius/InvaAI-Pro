const variants = {
  HEALTHY: 'bg-status-healthy-bg text-status-healthy border-status-healthy/30',
  LOW_STOCK: 'bg-status-warning-bg text-status-warning border-status-warning/30',
  CRITICAL: 'bg-status-critical-bg text-status-critical border-status-critical/30',
  master: 'bg-accent/10 text-accent border-accent/30',
  editor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  viewer: 'bg-text-muted/10 text-text-secondary border-text-muted/30',
  default: 'bg-surface-elevated text-text-secondary border-border',
};

const labels = {
  HEALTHY: 'OK',
  LOW_STOCK: 'Estoque baixo',
  CRITICAL: 'Crítico',
};

export default function Badge({ variant = 'default', children, className = '' }) {
  const styles = variants[variant] || variants.default;
  const label = labels[variant] || children;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${styles} ${className}`}>
      {label}
    </span>
  );
}

export default function Card({ children, className = '', ...props }) {
  return (
    <div className={`bg-surface border border-border rounded-lg ${className}`} {...props}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, trend, accent }) {
  return (
    <div className={`bg-surface border border-border rounded-lg p-4 ${accent ? 'ring-1 ring-accent/40' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="label-caps">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-text-muted" />}
      </div>
      <div className="font-mono text-2xl font-semibold text-text-primary">{value}</div>
      {trend && <div className="text-xs text-text-secondary mt-1">{trend}</div>}
    </div>
  );
}

export default function Skeleton({ className = '', rows = 1 }) {
  if (rows > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={`animate-pulse-soft bg-surface-elevated rounded ${className}`} />
        ))}
      </div>
    );
  }
  return <div className={`animate-pulse-soft bg-surface-elevated rounded ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-2 w-full" />
    </div>
  );
}

export function SkeletonRow({ columns = 6 }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3"><Skeleton className="h-4 w-3/4" /></td>
      ))}
    </tr>
  );
}

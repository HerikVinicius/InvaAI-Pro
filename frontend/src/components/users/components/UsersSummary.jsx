function SummaryCard({ label, value, sub, tone = 'accent' }) {
  const tones = {
    accent: 'text-accent',
    purple: 'text-purple-300',
    sky:    'text-sky-300',
    amber:  'text-amber-300',
  };
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="label-caps mb-2">{label}</div>
      <div className={`font-mono text-2xl font-semibold ${tones[tone]}`}>{value}</div>
      <div className="text-xs text-text-muted mt-1">{sub}</div>
    </div>
  );
}

export default function UsersSummary({ summary, isMaster }) {
  return (
    <div className={`grid grid-cols-1 gap-4 ${isMaster ? 'md:grid-cols-5' : 'md:grid-cols-2'}`}>
      {isMaster && (
        <SummaryCard
          label="Tenants Ativos"
          value={summary.tenantsCount}
          sub="bancos isolados"
          tone="accent"
        />
      )}
      {isMaster && (
        <SummaryCard
          label="Masters"
          value={summary.totalMasters}
          sub="acesso total"
          tone="purple"
        />
      )}
      {isMaster && (
        <SummaryCard
          label="Admins"
          value={summary.totalAdmins}
          sub="banco main"
          tone="accent"
        />
      )}
      <SummaryCard
        label="Lojistas"
        value={summary.totalLojistas}
        sub="donos de tenant"
        tone="sky"
      />
      <SummaryCard
        label="Vendedores"
        value={summary.totalVendedores}
        sub="equipe de vendas"
        tone="amber"
      />
    </div>
  );
}

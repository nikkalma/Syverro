interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  color: string;
}

export default function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div style={{
      padding: '20px',
      background: 'var(--surface)',
      borderRadius: '12px',
      border: '1px solid var(--border-soft)',
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '28px' }}>{icon}</span>
        <span style={{ fontSize: '28px', fontWeight: '300', color }}>{value}</span>
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px' }}>{label}</div>
    </div>
  );
}

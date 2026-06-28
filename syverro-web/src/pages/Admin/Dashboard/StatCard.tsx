// src/pages/Admin/Dashboard/StatCard.tsx

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
      background: 'rgba(18, 28, 36, 0.6)',
      backdropFilter: 'blur(12px)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.06)',
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '28px' }}>{icon}</span>
        <span style={{ fontSize: '28px', fontWeight: '300', color }}>{value}</span>
      </div>
      <div style={{ color: '#97A6BA', fontSize: '13px', marginTop: '8px' }}>{label}</div>
    </div>
  );
}
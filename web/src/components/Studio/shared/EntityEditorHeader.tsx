interface Props {
  name: string;
  photoUrl?: string | null;
  nativeName?: string | null;
  completionPercent?: number;
  lastUpdated?: string;
  statusLabel?: string;
  identitySummary?: string;
}

export default function EntityEditorHeader({ name, photoUrl, nativeName, completionPercent, lastUpdated, statusLabel, identitySummary }: Props) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      padding: '20px 28px',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border-soft)',
    }}>
      <div style={{
        width: '56px', height: '56px', borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--primary-soft), var(--surface))',
        border: '2px solid var(--glass-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '22px', color: 'var(--primary)',
        overflow: 'hidden', flexShrink: 0,
      }}>
        {photoUrl ? (
          <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--text-primary)', lineHeight: 1.3 }}>
          {name}
        </div>
        {nativeName && (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            {nativeName}
          </div>
        )}
        {identitySummary && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {identitySummary}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexShrink: 0 }}>
        {statusLabel && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '2px' }}>Status</div>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{statusLabel}</div>
          </div>
        )}
        {completionPercent !== undefined && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '2px' }}>Complete</div>
            <div style={{ fontSize: '13px', color: completionPercent >= 80 ? '#4CAF50' : '#FFA726' }}>{completionPercent}%</div>
          </div>
        )}
        {lastUpdated && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '2px' }}>Updated</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{lastUpdated}</div>
          </div>
        )}
      </div>
    </div>
  );
}

import { getLocaleData, getBrowserLocale } from '../../../locales';

interface Props {
  name: string;
  photoUrl?: string | null;
  completionPercent?: number;
  lastUpdated?: string;
  statusLabel?: string;
  identitySummary?: string;
  metadataStatus?: string;
  entityTypeLabel?: string;
  sapphireStatus?: string;
  explorerVisible?: boolean;
}

const METADATA_STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  draft:              { label: 'Draft',               color: '#97A6BA', bg: 'rgba(151,166,186,0.12)' },
  identity_complete:  { label: 'Identity Complete',   color: '#5B86A1', bg: 'rgba(91,134,161,0.12)' },
  editorial_complete: { label: 'Editorial Complete',  color: '#4CAF50', bg: 'rgba(76,175,80,0.12)' },
  knowledge_complete: { label: 'Knowledge Complete',  color: '#A855F7', bg: 'rgba(168,85,247,0.12)' },
  review_ready:       { label: 'Review Ready',        color: '#FFA726', bg: 'rgba(255,167,38,0.12)' },
  golden:             { label: 'Golden',              color: '#FFD700', bg: 'rgba(255,215,0,0.15)' },
};

const pillStyle = (color: string, bg: string): React.CSSProperties => ({
  fontSize: '11px',
  fontWeight: 500,
  color,
  background: bg,
  padding: '2px 10px',
  borderRadius: '12px',
  display: 'inline-block',
  whiteSpace: 'nowrap',
});

const captionStyle: React.CSSProperties = {
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
  marginBottom: '2px',
};

export default function EntityEditorHeader({
  name,
  photoUrl,
  completionPercent,
  lastUpdated,
  statusLabel,
  identitySummary,
  metadataStatus,
  entityTypeLabel,
  sapphireStatus,
  explorerVisible,
}: Props) {
  const t = getLocaleData(getBrowserLocale());
  const ws = t.admin.workspace;

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {name}
          </div>
          {entityTypeLabel && (
            <span style={pillStyle('var(--primary)', 'var(--primary-soft)')}>
              {entityTypeLabel}
            </span>
          )}
        </div>
        {identitySummary && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {identitySummary}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexShrink: 0 }}>
        {metadataStatus && METADATA_STATUS_STYLES[metadataStatus] && (
          <div style={{ textAlign: 'right' }}>
            <div style={captionStyle}>{ws.metadata}</div>
            <span style={pillStyle(METADATA_STATUS_STYLES[metadataStatus].color, METADATA_STATUS_STYLES[metadataStatus].bg)}>
              {METADATA_STATUS_STYLES[metadataStatus].label}
            </span>
          </div>
        )}
        {sapphireStatus && (
          <div style={{ textAlign: 'right' }}>
            <div style={captionStyle}>{ws.sapphire}</div>
            <span style={pillStyle('#FFD700', 'rgba(255,215,0,0.15)')}>{sapphireStatus}</span>
          </div>
        )}
        {explorerVisible !== undefined && (
          <div style={{ textAlign: 'right' }}>
            <div style={captionStyle}>{ws.explorer}</div>
            <span style={pillStyle(explorerVisible ? '#4CAF50' : '#97A6BA', explorerVisible ? 'rgba(76,175,80,0.12)' : 'rgba(151,166,186,0.12)')}>
              {explorerVisible ? ws.visible : ws.hidden}
            </span>
          </div>
        )}
        {statusLabel && (
          <div style={{ textAlign: 'right' }}>
            <div style={captionStyle}>{ws.status}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{statusLabel}</div>
          </div>
        )}
        {completionPercent !== undefined && (
          <div style={{ textAlign: 'right' }}>
            <div style={captionStyle}>{ws.complete}</div>
            <div style={{ fontSize: '13px', color: completionPercent >= 80 ? 'var(--success)' : 'var(--warning)' }}>{completionPercent}%</div>
          </div>
        )}
        {lastUpdated && (
          <div style={{ textAlign: 'right' }}>
            <div style={captionStyle}>{ws.updated}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{lastUpdated}</div>
          </div>
        )}
      </div>
    </div>
  );
}

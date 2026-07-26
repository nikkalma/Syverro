interface Props {
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
  dirty?: boolean;
  saveLabel?: string;
  savingLabel?: string;
  cancelLabel?: string;
}

export default function ActionBar({ onSave, onCancel, saving, dirty, saveLabel, savingLabel, cancelLabel }: Props) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'flex-end', gap: '12px',
      paddingTop: '20px', borderTop: '1px solid var(--border-soft)',
      marginTop: '24px',
    }}>
      <button
        onClick={onCancel}
        disabled={saving}
        style={{
          padding: '8px 20px',
          fontSize: '13px',
          fontWeight: 500,
          background: 'transparent',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-soft)',
          borderRadius: '8px',
          cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.6 : 1,
        }}
      >
        {cancelLabel || 'Cancel'}
      </button>
      <button
        onClick={onSave}
        disabled={saving || !dirty}
        style={{
          padding: '8px 24px',
          fontSize: '13px',
          fontWeight: 600,
          background: dirty ? 'var(--primary)' : 'var(--border-soft)',
          color: dirty ? '#fff' : 'var(--text-muted)',
          border: 'none',
          borderRadius: '8px',
          cursor: (saving || !dirty) ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.7 : 1,
          transition: 'background 0.2s, opacity 0.2s',
        }}
      >
        {saving ? (savingLabel || 'Saving...') : (saveLabel || 'Save Changes')}
      </button>
    </div>
  );
}

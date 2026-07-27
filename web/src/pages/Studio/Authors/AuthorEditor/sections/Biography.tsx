import { useState, useEffect } from 'react';
import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import DetailGrid from '../../../../../components/Studio/shared/DetailGrid';
import ActionBar from '../../../../../components/Studio/shared/ActionBar';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';
import type { AdminAuthorUpdate } from '../../../../../types/admin';

function FormField({ label, value, onChange, placeholder, disabled, type }: {
  label: string;
  value: string | number;
  onChange: (v: any) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}) {
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', fontSize: '14px',
    background: 'var(--input-bg)', border: '1px solid var(--border-soft)',
    borderRadius: '8px', color: 'var(--text-primary)', outline: 'none',
    fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
  };
  return (
    <div>
      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
        {label}
      </div>
      <input
        type={type || 'text'}
        value={value}
        onChange={(e) => onChange(type === 'number' ? (e.target.value ? Number(e.target.value) : '') : e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{ ...inputStyle, opacity: disabled ? 0.6 : 1 }}
      />
    </div>
  );
}

export default function Biography() {
  const t = getLocaleData(getBrowserLocale());
  const { author, loading, saving, saveError, updateAuthor } = useAuthorEditor();

  const [bio, setBio] = useState('');
  const [activeFrom, setActiveFrom] = useState<number | ''>('');
  const [activeTo, setActiveTo] = useState<number | ''>('');

  useEffect(() => {
    if (!author) return;
    setBio(author.bio || '');
    setActiveFrom(author.active_from_year ?? '');
    setActiveTo(author.active_to_year ?? '');
  }, [author]);

  const hasChanges =
    bio !== (author?.bio || '') ||
    activeFrom !== (author?.active_from_year ?? '') ||
    activeTo !== (author?.active_to_year ?? '');

  const reset = () => {
    if (!author) return;
    setBio(author.bio || '');
    setActiveFrom(author.active_from_year ?? '');
    setActiveTo(author.active_to_year ?? '');
  };

  const handleSave = async () => {
    const data: AdminAuthorUpdate = {
      bio: bio.trim() || null,
      active_from_year: activeFrom !== '' ? activeFrom : null,
      active_to_year: activeTo !== '' ? activeTo : null,
    };
    await updateAuthor(data);
  };

  if (loading || !author) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title={t.admin.authors.editor.biography.biography}>
        {author.bio ? (
          <div style={{
            fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap',
            padding: '16px 20px', background: 'var(--surface-hover)', borderRadius: '8px',
          }}>
            {author.bio}
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
            {t.admin.authors.editor.noBio}
          </p>
        )}
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.authors.editor.biography.biographyEditor}>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder={t.admin.authors.editor.bioPlaceholder}
          rows={12}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '14px',
            lineHeight: 1.8,
            fontFamily: 'Inter, sans-serif',
            background: 'var(--bg)',
            border: '1px solid var(--border-soft)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            resize: 'vertical',
            outline: 'none',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-soft)'; }}
        />
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.authors.editor.biography.activityPeriod}>
        <DetailGrid>
          <FormField label={t.admin.authors.editor.biography.activeFrom} value={activeFrom} onChange={setActiveFrom} type="number" placeholder="e.g. 1950" />
          <FormField label={t.admin.authors.editor.biography.activeTo} value={activeTo} onChange={setActiveTo} type="number" placeholder="e.g. 2020" />
        </DetailGrid>
      </EditorSectionCard>

      {saveError && (
        <div style={{
          padding: '12px 16px', background: 'rgba(220,38,38,0.1)',
          border: '1px solid rgba(220,38,38,0.3)', borderRadius: '8px',
          color: 'var(--error)', fontSize: '13px',
        }}>
          {saveError}
        </div>
      )}

      <ActionBar
        onSave={handleSave}
        onCancel={reset}
        saving={saving}
        dirty={hasChanges}
        saveLabel={t.admin.common.save}
        savingLabel={t.admin.common.saving}
        cancelLabel={t.admin.common.cancel}
      />
    </div>
  );
}

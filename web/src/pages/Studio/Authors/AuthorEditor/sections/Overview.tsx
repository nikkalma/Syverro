import { useState, useEffect } from 'react';
import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import DetailGrid from '../../../../../components/Studio/shared/DetailGrid';
import ActionBar from '../../../../../components/Studio/shared/ActionBar';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';
import type { AdminAuthorUpdate } from '../../../../../types/admin';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
}

interface InputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: 'text' | 'url';
  multiline?: boolean;
  disabled?: boolean;
}

function FormField({ label, value, onChange, placeholder, type, multiline, disabled }: InputProps) {
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
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, opacity: disabled ? 0.6 : 1 }}
        />
      ) : (
        <input
          type={type || 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={{ ...inputStyle, opacity: disabled ? 0.6 : 1 }}
        />
      )}
    </div>
  );
}

function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer',
      userSelect: 'none',
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: 'var(--primary)' }}
      />
      {label}
    </label>
  );
}

export default function Overview() {
  const t = getLocaleData(getBrowserLocale());
  const { author, loading, saving, saveError, updateAuthor } = useAuthorEditor();

  const [name, setName] = useState('');
  const [nativeName, setNativeName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugLocked, setSlugLocked] = useState(false);
  const [photo, setPhoto] = useState('');
  const [heroBg, setHeroBg] = useState('');
  const [shortDescription, setShortDescription] = useState('');

  useEffect(() => {
    if (!author) return;
    setName(author.name || '');
    setNativeName(author.native_name || '');
    setSlug(author.slug || '');
    setSlugLocked(author.slug_locked || false);
    setPhoto(author.photo || '');
    setHeroBg(author.hero_background_url || '');
    setShortDescription(author.author_intro_quote || '');
  }, [author]);

  useEffect(() => {
    if (!slugLocked && name) {
      const generated = slugify(name);
      if (generated !== slug) {
        setSlug(generated);
      }
    }
  }, [name, slugLocked]);

  const hasChanges =
    name !== (author?.name || '') ||
    nativeName !== (author?.native_name || '') ||
    slug !== (author?.slug || '') ||
    slugLocked !== (author?.slug_locked || false) ||
    photo !== (author?.photo || '') ||
    heroBg !== (author?.hero_background_url || '') ||
    shortDescription !== (author?.author_intro_quote || '');

  const reset = () => {
    if (!author) return;
    setName(author.name || '');
    setNativeName(author.native_name || '');
    setSlug(author.slug || '');
    setSlugLocked(author.slug_locked || false);
    setPhoto(author.photo || '');
    setHeroBg(author.hero_background_url || '');
    setShortDescription(author.author_intro_quote || '');
  };

  const handleSave = async () => {
    const data: AdminAuthorUpdate = {
      name,
      native_name: nativeName || null,
      slug: slug || null,
      slug_locked: slugLocked,
      photo: photo || null,
      hero_background_url: heroBg || null,
      author_intro_quote: shortDescription || null,
    };
    await updateAuthor(data);
  };

  if (loading || !author) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        <div style={{
          width: '100px', height: '100px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary-soft), var(--surface))',
          border: '2px solid var(--border-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '36px', color: 'var(--primary)',
          overflow: 'hidden', flexShrink: 0,
        }}>
          {photo ? (
            <img src={photo} alt={author.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            author.name.charAt(0).toUpperCase()
          )}
        </div>
        <div style={{ flex: 1 }}>
          <EditorSectionCard title={t.admin.authors.editor.overview.coreInfo}>
            <DetailGrid>
              <FormField label={t.admin.authors.editor.overview.name} value={name} onChange={setName} />
              <FormField label={t.admin.authors.editor.overview.nativeName} value={nativeName} onChange={setNativeName} />
            </DetailGrid>
            <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <FormField label={t.admin.authors.editor.overview.slugAuto} value={slug} onChange={(v) => { setSlug(v); setSlugLocked(true); }} />
              </div>
              <div style={{ marginTop: '22px' }}>
                <CheckboxField
                  label={t.admin.authors.editor.overview.slugLocked}
                  checked={slugLocked}
                  onChange={setSlugLocked}
                />
              </div>
            </div>
          </EditorSectionCard>
        </div>
      </div>

      <EditorSectionCard title={t.admin.authors.editor.overview.heroBackground}>
        {heroBg ? (
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              width: '100%', height: '120px', borderRadius: '8px', overflow: 'hidden',
              background: 'var(--surface-hover)', marginBottom: '8px',
            }}>
              <img src={heroBg} alt={t.admin.authors.editor.media.heroAlt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: '0 0 12px 0' }}>{t.admin.authors.editor.noHeroBg}</p>
        )}
        <FormField label="URL" value={heroBg} onChange={setHeroBg} type="url" placeholder="https://..." />
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.authors.editor.overview.shortDescription}>
        <FormField
          label={t.admin.authors.editor.overview.shortDescription}
          value={shortDescription}
          onChange={setShortDescription}
          multiline
          placeholder={t.admin.authors.editor.noShortDescription}
        />
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.authors.editor.overview.publicationState}>
        <DetailGrid>
          <FormField label={t.admin.authors.editor.overview.creationType} value={author.creation_type} onChange={() => {}} disabled />
          <FormField label={t.admin.authors.editor.overview.booksCount} value={String(author.book_count)} onChange={() => {}} disabled />
          <FormField label={t.admin.authors.editor.overview.created} value={author.created_at ? new Date(author.created_at).toLocaleDateString() : '-'} onChange={() => {}} disabled />
          <FormField label={t.admin.authors.editor.overview.updated} value={author.updated_at ? new Date(author.updated_at).toLocaleDateString() : '-'} onChange={() => {}} disabled />
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

import { useState, useEffect } from 'react';
import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import ActionBar from '../../../../../components/Studio/shared/ActionBar';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';
import type { AdminAuthorUpdate } from '../../../../../types/admin';

function FormField({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
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
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

export default function Media() {
  const t = getLocaleData(getBrowserLocale());
  const { author, loading, saving, saveError, updateAuthor } = useAuthorEditor();

  const [photo, setPhoto] = useState('');
  const [signature, setSignature] = useState('');
  const [heroBg, setHeroBg] = useState('');
  const [caption, setCaption] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  useEffect(() => {
    if (!author) return;
    setPhoto(author.photo || '');
    setSignature(author.signature_image || '');
    setHeroBg(author.hero_background_url || '');
    setCaption(author.portrait_caption || '');
    setGallery(author.gallery || []);
  }, [author]);

  const hasChanges =
    photo !== (author?.photo || '') ||
    signature !== (author?.signature_image || '') ||
    heroBg !== (author?.hero_background_url || '') ||
    caption !== (author?.portrait_caption || '') ||
    gallery.length !== (author?.gallery || []).length ||
    gallery.some((u, i) => u !== (author?.gallery || [])[i]);

  const reset = () => {
    if (!author) return;
    setPhoto(author.photo || '');
    setSignature(author.signature_image || '');
    setHeroBg(author.hero_background_url || '');
    setCaption(author.portrait_caption || '');
    setGallery(author.gallery || []);
  };

  const handleSave = async () => {
    const data: AdminAuthorUpdate = {
      photo: photo.trim() || null,
      signature_image: signature.trim() || null,
      hero_background_url: heroBg.trim() || null,
      portrait_caption: caption.trim() || null,
      gallery: gallery.length > 0 ? gallery : [],
    };
    await updateAuthor(data);
  };

  const addGalleryItem = () => {
    const url = newGalleryUrl.trim();
    if (!url) return;
    setGallery([...gallery, url]);
    setNewGalleryUrl('');
  };

  const removeGalleryItem = (idx: number) => {
    setGallery(gallery.filter((_, i) => i !== idx));
  };

  if (loading || !author) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <EditorSectionCard title={t.admin.authors.editor.media.portrait}>
            {photo && (
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <img src={photo} alt={author.name}
                  style={{ width: '140px', height: '140px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-soft)' }} />
              </div>
            )}
            <FormField label="URL" value={photo} onChange={setPhoto} placeholder="https://..." />
          </EditorSectionCard>
        </div>

        <div style={{ flex: 1, minWidth: '200px' }}>
          <EditorSectionCard title={t.admin.authors.editor.media.signature}>
            {signature && (
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <img src={signature} alt={t.admin.authors.editor.media.signatureAlt}
                  style={{ maxWidth: '200px', maxHeight: '60px', objectFit: 'contain' }} />
              </div>
            )}
            <FormField label="URL" value={signature} onChange={setSignature} placeholder="https://..." />
          </EditorSectionCard>
        </div>
      </div>
      </div>

      <EditorSectionCard title={t.admin.authors.editor.media.heroBackground}>
        {heroBg && (
          <div style={{
            width: '100%', height: '200px', borderRadius: '8px', overflow: 'hidden',
            background: 'var(--surface-hover)', marginBottom: '12px',
          }}>
            <img src={heroBg} alt={t.admin.authors.editor.media.heroBackgroundAlt}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <FormField label="URL" value={heroBg} onChange={setHeroBg} placeholder="https://..." />
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.authors.editor.media.portraitCaption}>
        <FormField label={t.admin.authors.editor.media.caption} value={caption} onChange={setCaption} placeholder="Photo credit or caption..." />
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.authors.editor.media.gallery}>
        {gallery.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            {gallery.map((url, i) => (
              <div key={i} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-soft)', aspectRatio: '1' }}>
                <img src={url} alt={`${t.admin.authors.editor.media.gallery} ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button type="button" onClick={() => removeGalleryItem(i)}
                  style={{
                    position: 'absolute', top: '4px', right: '4px',
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)', border: 'none',
                    color: '#fff', cursor: 'pointer', fontSize: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={newGalleryUrl}
            onChange={(e) => setNewGalleryUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addGalleryItem(); }}
            placeholder="Add image URL..."
            style={{
              flex: 1, padding: '8px 12px', fontSize: '14px',
              background: 'var(--input-bg)', border: '1px solid var(--border-soft)',
              borderRadius: '8px', color: 'var(--text-primary)', outline: 'none',
              fontFamily: 'Inter, sans-serif',
            }}
          />
          <button type="button" onClick={addGalleryItem}
            style={{
              padding: '8px 16px', background: 'var(--accent)', border: 'none',
              borderRadius: '8px', color: '#fff', cursor: 'pointer',
            }}>
            Add
          </button>
        </div>
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

import { useState, useEffect } from 'react';
import type { KnowledgeEntity } from '../../../types/admin';
import type { LocaleData } from '../../../locales';

interface EntityModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  entity: KnowledgeEntity | null;
  defaultType: string;
  t: LocaleData;
  onClose: () => void;
  onSave: (data: any) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--bg)',
  border: '1px solid var(--border-soft)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '14px',
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
};

export default function EntityModal({ isOpen, mode, entity, defaultType, t, onClose, onSave }: EntityModalProps) {
  const [nodeType, setNodeType] = useState(defaultType);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [isSapphire, setIsSapphire] = useState(false);
  const [explorerVisible, setExplorerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && entity) {
      setNodeType(entity.node_type);
      setName(entity.name || '');
      setSlug(entity.slug || '');
      setDescription(entity.description || '');
      setStatus(entity.status || 'draft');
      setIsSapphire(entity.is_sapphire === true);
      setExplorerVisible(entity.explorer_visible === true);
    } else {
      setNodeType(defaultType);
      setName('');
      setSlug('');
      setDescription('');
      setStatus('draft');
      setIsSapphire(false);
      setExplorerVisible(false);
    }
    setError(null);
  }, [mode, entity, isOpen, defaultType]);

  if (!isOpen) return null;

  const generateSlug = (value: string) => {
    return value.trim().toLowerCase()
      .replace(/[^a-z0-9\u0400-\u04ff\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const trimmed = name.trim();
      if (!trimmed) throw new Error(t.admin.entities.name);
      const finalSlug = slug.trim() ? slug.trim() : generateSlug(trimmed) || 'unknown';
      onSave({
        name: trimmed,
        slug: finalSlug,
        node_type: nodeType,
        description: description.trim() || null,
        status,
        is_sapphire: isSapphire,
        explorer_visible: explorerVisible,
      });
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const typeOptions = [
    { key: 'genre', label: t.admin.entities.entityTypes.genre },
    { key: 'literary_direction', label: t.admin.entities.entityTypes.literary_direction },
    { key: 'place', label: t.admin.entities.entityTypes.place },
    { key: 'timeline_event', label: t.admin.entities.entityTypes.timeline_event },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, padding: '20px',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface)', borderRadius: '16px',
        border: '1px solid var(--border-soft)',
        maxWidth: '520px', width: '100%', padding: '32px',
        color: 'var(--text-primary)',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '22px', fontWeight: '400', margin: 0 }}>
            {mode === 'create' ? `➕ ${t.admin.entities.create}` : `✏️ ${t.admin.entities.edit}`}
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            fontSize: '24px', cursor: 'pointer', padding: '4px 8px',
          }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'create' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                {t.admin.entities.type} *
              </label>
              <select value={nodeType} onChange={(e) => setNodeType(e.target.value)} style={inputStyle}>
                {typeOptions.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              {t.admin.entities.name} *
            </label>
            <input value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              {t.admin.entities.slug}
            </label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={generateSlug(name) || 'auto-generated'} style={inputStyle} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              {t.admin.entities.description}
            </label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              {t.admin.entities.status}
            </label>
            <select value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')} style={inputStyle}>
              <option value="draft">{t.admin.entities.statusDraft}</option>
              <option value="published">{t.admin.entities.statusPublished}</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={isSapphire}
                onChange={(e) => setIsSapphire(e.target.checked)}
                style={{ accentColor: 'var(--primary)' }} />
              {t.admin.entities.sapphire}
            </label>
            <label style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={explorerVisible}
                onChange={(e) => setExplorerVisible(e.target.checked)}
                style={{ accentColor: 'var(--primary)' }} />
              {t.admin.entities.explorer}
            </label>
          </div>

          {error && <div style={{ color: 'var(--danger, #EF5350)', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" disabled={loading} style={{
              flex: 1, padding: '12px', background: 'var(--primary)', border: 'none',
              borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
              fontFamily: 'Inter, sans-serif',
            }}>
              {loading ? t.admin.common.saving : mode === 'create' ? `➕ ${t.admin.entities.create}` : `💾 ${t.admin.common.save}`}
            </button>
            <button type="button" onClick={onClose} style={{
              padding: '12px 24px', background: 'transparent',
              border: '1px solid var(--border-soft)', borderRadius: '8px',
              color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}>{t.admin.entities.cancel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

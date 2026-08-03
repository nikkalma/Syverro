import { useState, useEffect } from 'react';
import { useEntityWorkspace } from '../EntityWorkspaceContext';
import EditorSectionCard from '../../../../components/Studio/shared/EditorSectionCard';
import DetailGrid from '../../../../components/Studio/shared/DetailGrid';
import ActionBar from '../../../../components/Studio/shared/ActionBar';
import { getLocaleData, getBrowserLocale } from '../../../../locales';
import { ENTITY_TYPES } from '../../../../types/admin';
import { entityTypeLabel } from '../entityType';
import EditorialIntelligence from '../../../../components/Studio/editorialIntelligence/EditorialIntelligence';
import { buildEntityReport } from '../editorialIntelligence';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: '14px',
  background: 'var(--input-bg)', border: '1px solid var(--border-soft)',
  borderRadius: '8px', color: 'var(--text-primary)', outline: 'none',
  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
};

function FormField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
        {label}
      </div>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

function makeSlug(value: string): string {
  return value.trim().toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04ff\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function Overview() {
  const t = getLocaleData(getBrowserLocale());
  const { entity, isNew, saving, saveError, saveEntity } = useEntityWorkspace();
  const eLocale = t.admin.entities;

  const [nodeType, setNodeType] = useState('genre');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugLocked, setSlugLocked] = useState(false);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  useEffect(() => {
    if (!entity) return;
    setNodeType(entity.node_type);
    setName(entity.name || '');
    setSlug(entity.slug || '');
    setSlugLocked(Boolean(entity.slug));
    setDescription(entity.description || '');
    setStatus(entity.status || 'draft');
  }, [entity]);

  useEffect(() => {
    if (!slugLocked && !slug && name) {
      setSlug(makeSlug(name));
    }
  }, [name, slugLocked]);

  const hasChanges = isNew
    ? Boolean(name.trim())
    : Boolean(
        entity &&
        (name !== entity.name ||
          slug !== entity.slug ||
          description !== (entity.description || '') ||
          status !== entity.status)
      );

  const reset = () => {
    if (!entity) return;
    setName(entity.name || '');
    setSlug(entity.slug || '');
    setSlugLocked(Boolean(entity.slug));
    setDescription(entity.description || '');
    setStatus(entity.status || 'draft');
  };

  const handleSave = async () => {
    const finalSlug = slug.trim() || makeSlug(name) || 'unknown';
    if (isNew) {
      await saveEntity({
        name: name.trim(),
        slug: finalSlug,
        node_type: nodeType,
        description: description.trim() || null,
        status,
        is_sapphire: false,
        explorer_visible: false,
      });
    } else {
      await saveEntity({
        name: name.trim(),
        slug: finalSlug,
        description: description.trim() || null,
        status,
      });
    }
  };

  if (isNew) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <EditorSectionCard title={eLocale.newEntity}>
          <DetailGrid columns={2}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {eLocale.type} *
              </div>
              <select value={nodeType} onChange={(e) => setNodeType(e.target.value)} style={inputStyle}>
                {ENTITY_TYPES.map((et) => (
                  <option key={et} value={et}>{entityTypeLabel(et)}</option>
                ))}
              </select>
            </div>
            <FormField label={eLocale.name + ' *'} value={name} onChange={setName} />
          </DetailGrid>
          <div style={{ marginTop: '12px' }}>
            <FormField label={eLocale.slug} value={slug} onChange={(v) => { setSlug(v); setSlugLocked(Boolean(v)); }} placeholder={makeSlug(name) || t.admin.authors.editor.overview.slugAuto} />
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
              {eLocale.description}
            </div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }} />
          </div>
        </EditorSectionCard>

        {saveError && (
          <div style={{ padding: '12px 16px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '8px', color: 'var(--error)', fontSize: '13px' }}>
            {saveError}
          </div>
        )}

        <ActionBar
          onSave={handleSave}
          onCancel={reset}
          saving={saving}
          dirty={hasChanges}
          saveLabel={eLocale.create}
          savingLabel={t.admin.common.saving}
          cancelLabel={t.admin.entities.cancel}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {entity && (
        <EditorialIntelligence
          report={buildEntityReport(entity, {
            name: eLocale.name,
            slug: eLocale.slug,
            type: eLocale.type,
            description: eLocale.description,
            status: eLocale.status,
          })}
        />
      )}
      <EditorSectionCard title={eLocale.name}>
        <FormField label={eLocale.name} value={name} onChange={setName} />
        <div style={{ marginTop: '12px' }}>
          <FormField label={eLocale.slug} value={slug} onChange={(v) => { setSlug(v); setSlugLocked(true); }} placeholder={t.admin.authors.editor.overview.slugAuto} />
        </div>
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
            {eLocale.description}
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }} />
        </div>
      </EditorSectionCard>

      {saveError && (
        <div style={{ padding: '12px 16px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '8px', color: 'var(--error)', fontSize: '13px' }}>
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

import { useEffect, useState } from 'react';
import { useBookWorkspace } from '../BookWorkspaceContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import ActionBar from '../../../../../components/Studio/shared/ActionBar';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';

export default function Editorial() {
  const t = getLocaleData(getBrowserLocale());
  const { book, saving, saveError, saveEnrichment } = useBookWorkspace();
  const [description, setDescription] = useState('');
  useEffect(() => setDescription(book?.description || ''), [book]);
  if (!book) return null;
  const original = book.description || '';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title={t.admin.books.description}>
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={10} placeholder={t.admin.books.descriptionPlaceholder}
          style={{ width: '100%', padding: '12px', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6, background: 'var(--input-bg)', border: '1px solid var(--border-soft)', borderRadius: '8px', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }} />
      </EditorSectionCard>
      {saveError && <div style={{ color: 'var(--error)', fontSize: '13px' }}>{saveError}</div>}
      <ActionBar onSave={() => saveEnrichment({ description: description.trim() || null })} onCancel={() => setDescription(original)} saving={saving} dirty={description !== original} saveLabel={t.admin.common.save} savingLabel={t.admin.common.saving} cancelLabel={t.admin.common.cancel} />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useBookWorkspace } from '../BookWorkspaceContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import DetailGrid from '../../../../../components/Studio/shared/DetailGrid';
import ActionBar from '../../../../../components/Studio/shared/ActionBar';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';
import type { AdminBook } from '../../../../../types/admin';

const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', background: 'var(--input-bg)', border: '1px solid var(--border-soft)', borderRadius: '8px', color: 'var(--text-primary)' };
const labelStyle: React.CSSProperties = { fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' };

export default function Preview() {
  const t = getLocaleData(getBrowserLocale());
  const { book, publicDetail, saving, saveError, saveBook } = useBookWorkspace();
  const [isPublished, setIsPublished] = useState(false);
  const [metadataStatus, setMetadataStatus] = useState<AdminBook['metadata_status']>('draft');
  const [moderationStatus, setModerationStatus] = useState<AdminBook['moderation_status']>('draft');
  useEffect(() => { if (book) { setIsPublished(book.is_published); setMetadataStatus(book.metadata_status); setModerationStatus(book.moderation_status); } }, [book]);
  if (!book) return null;

  const authors = publicDetail?.authors.map((author) => author.displayName || author.name) || (book.authors || []).map((author) => author.name);
  const genres = publicDetail?.genres || book.genre_objects || [];
  const knowledge = publicDetail?.knowledge || [];
  const bibliography = [
    [t.bookPage.originalTitle, publicDetail?.originalTitle ?? book.original_title],
    [t.bookPage.metadata.year, publicDetail?.publicationYear ?? book.original_publication_year],
    [t.bookPage.metadata.language, publicDetail?.originalLanguage ?? book.original_language],
    [t.bookPage.metadata.country, publicDetail?.countryOfOrigin ?? book.country_of_origin],
    [t.bookPage.metadata.publicationType, publicDetail?.publicationType ?? book.publication_type],
    [t.bookPage.metadata.series, publicDetail?.seriesName ?? book.series_name],
    [t.bookPage.metadata.seriesPosition, publicDetail?.seriesPosition ?? book.series_position],
  ].filter(([, value]) => value !== null && value !== undefined && value !== '');
  const dirty = isPublished !== book.is_published || metadataStatus !== book.metadata_status || moderationStatus !== book.moderation_status;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title={t.admin.bookWorkspace.publicPreview}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, 150px) 1fr', gap: '20px', alignItems: 'start' }}>
          {book.cover ? <img src={book.cover} alt={book.title} style={{ width: '100%', borderRadius: '8px' }} /> : <div style={{ aspectRatio: '2/3', background: 'var(--surface-hover)', borderRadius: '8px' }} />}
          <div><h2 style={{ margin: 0, color: 'var(--text-primary)' }}>{book.title}</h2>{book.subtitle && <p style={{ color: 'var(--text-secondary)' }}>{book.subtitle}</p>}<p style={{ color: 'var(--accent)' }}>{authors.join(', ')}</p><div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>{genres.map((genre) => <span key={genre.id} style={{ padding: '4px 8px', borderRadius: '12px', background: 'var(--primary-soft)', color: 'var(--primary)', fontSize: '12px' }}>{genre.name}</span>)}</div></div>
        </div>
      </EditorSectionCard>
      <EditorSectionCard title={t.bookPage.aboutTitle}><dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', margin: 0 }}>{bibliography.map(([label, value]) => <div key={String(label)}><dt style={labelStyle}>{label}</dt><dd style={{ margin: 0, color: 'var(--text-secondary)' }}>{String(value)}</dd></div>)}</dl></EditorSectionCard>
      <EditorSectionCard title={t.bookPage.descriptionTitle}><p style={{ margin: 0, lineHeight: 1.6, color: book.description ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{book.description || t.bookPage.noDescription}</p></EditorSectionCard>
      {knowledge.length > 0 && <EditorSectionCard title={t.bookPage.knowledgeTitle}><div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>{knowledge.map((item) => <span key={item.nodeId} style={{ padding: '5px 9px', borderRadius: '12px', background: 'var(--surface-hover)', color: 'var(--text-secondary)', fontSize: '12px' }}>{item.name}</span>)}</div></EditorSectionCard>}
      {knowledge.length > 0 && <EditorSectionCard title={t.bookPage.mapTitle}><div style={{ padding: '18px', textAlign: 'center', border: '1px solid var(--border-soft)', borderRadius: '10px', color: 'var(--text-secondary)' }}><strong>{book.title}</strong><div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px' }}>{knowledge.slice(0, 8).map((item) => <span key={item.nodeId}>{item.name}</span>)}</div></div></EditorSectionCard>}

      <EditorSectionCard title={t.admin.workspace.status}>
        <DetailGrid columns={2}>
          <div><div style={labelStyle}>{t.admin.workspace.moderation}</div><select value={moderationStatus} onChange={(e) => setModerationStatus(e.target.value as AdminBook['moderation_status'])} style={inputStyle}>{Object.entries(t.admin.workspace.moderationStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div><div style={labelStyle}>{t.admin.workspace.metadata}</div><select value={metadataStatus} onChange={(e) => setMetadataStatus(e.target.value as AdminBook['metadata_status'])} style={inputStyle}><option value="draft">{t.admin.workspace.metadataStatuses.draft}</option><option value="incomplete">{t.admin.workspace.metadataStatuses.incomplete}</option><option value="review_ready">{t.admin.workspace.metadataStatuses.reviewReady}</option><option value="complete">{t.admin.workspace.metadataStatuses.complete}</option></select></div>
        </DetailGrid>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', color: 'var(--text-secondary)' }}><input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />{t.admin.books.publishBook}</label>
      </EditorSectionCard>
      {saveError && <div style={{ color: 'var(--error)' }}>{saveError}</div>}
      <ActionBar onSave={() => saveBook({ is_published: isPublished, metadata_status: metadataStatus, moderation_status: moderationStatus })} onCancel={() => { setIsPublished(book.is_published); setMetadataStatus(book.metadata_status); setModerationStatus(book.moderation_status); }} saving={saving} dirty={dirty} saveLabel={t.admin.common.save} savingLabel={t.admin.common.saving} cancelLabel={t.admin.common.cancel} />
    </div>
  );
}

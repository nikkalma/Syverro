import { useBookWorkspace } from '../BookWorkspaceContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import DetailGrid from '../../../../../components/Studio/shared/DetailGrid';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';

export default function Preview() {
  const t = getLocaleData(getBrowserLocale());
  const { book } = useBookWorkspace();
  const bLocale = t.admin.books;
  const pageCopy = t.bookPage;

  if (!book) return null;

  const statusColor = book.is_published ? '#4CAF50' : '#61A6A1';
  const statusBg = book.is_published ? 'rgba(76,175,80,0.15)' : 'rgba(97,166,161,0.15)';

  const tagStyle: React.CSSProperties = {
    display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
    fontSize: '12px', fontWeight: '500', color: 'var(--primary)', background: 'var(--primary-soft)',
  };

  const enrichment = [
    { label: bLocale.originalTitle, value: book.original_title || '—' },
    { label: bLocale.originalLanguage, value: book.original_language || '—' },
    { label: bLocale.countryOfOrigin, value: book.country_of_origin || '—' },
    { label: bLocale.originalYear, value: book.original_publication_year != null ? String(book.original_publication_year) : '—' },
    { label: bLocale.pages, value: book.total_pages != null ? String(book.total_pages) : '—' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1 · Hero / identity */}
      <EditorSectionCard title={t.admin.workspace.sections.identity}>
        <div style={{
          maxWidth: '420px',
          background: 'var(--surface-hover)',
          border: '1px solid var(--border-soft)',
          borderRadius: '14px',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '20px', fontWeight: '500', color: 'var(--text-primary)' }}>
              {book.title}
            </span>
            <span style={{
              display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
              fontSize: '12px', fontWeight: '500', color: statusColor, background: statusBg,
            }}>
{book.is_published ? bLocale.publishedBadge : bLocale.draftBadge}
            </span>
          </div>

          {book.cover && (
            <img src={book.cover} alt={book.title}
              style={{ width: '100%', borderRadius: '10px', border: '1px solid var(--border-soft)', maxHeight: '220px', objectFit: 'cover' }} />
          )}

          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {book.author}
            {book.original_publication_year ? ` · ${book.original_publication_year}` : ''}
          </div>
        </div>
      </EditorSectionCard>

      {/* 2. About the book */}
      <EditorSectionCard title={pageCopy.aboutTitle}>
        {book.description ? (
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {book.description}
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            {pageCopy.noDescription}
          </p>
        )}
      </EditorSectionCard>

      {/* 3. How the book is told (narrative / form) */}
      <EditorSectionCard title={pageCopy.howToldTitle}>
        <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {pageCopy.howToldEmpty}
        </p>
        <DetailGrid columns={2}>
          {enrichment.map((item) => (
            <div key={item.label}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.value}</div>
            </div>
          ))}
        </DetailGrid>
      </EditorSectionCard>

      {/* 4. Knowledge around the book */}
      <EditorSectionCard title={pageCopy.knowledgeTitle}>
        <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {pageCopy.knowledgeIntro}
        </p>
        {book.genres?.length ? (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {book.genres.map((g) => (
              <span key={g} style={tagStyle}>{g}</span>
            ))}
          </div>
        ) : (
          <span style={tagStyle}>&mdash;</span>
        )}
      </EditorSectionCard>
    </div>
  );
}
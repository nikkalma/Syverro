import { useBookWorkspace } from '../BookWorkspaceContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';

export default function Preview() {
  const t = getLocaleData(getBrowserLocale());
  const { book } = useBookWorkspace();
  const bLocale = t.admin.books;

  if (!book) return null;

  const statusColor = book.is_published ? '#4CAF50' : '#61A6A1';
  const statusBg = book.is_published ? 'rgba(76,175,80,0.15)' : 'rgba(97,166,161,0.15)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title={t.admin.workspace.preview}>
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

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {book.genres?.slice(0, 4).map((g) => (
              <span key={g} style={{
                display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
                fontSize: '12px', fontWeight: '500', color: 'var(--primary)', background: 'var(--primary-soft)',
              }}>
                {g}
              </span>
            ))}
          </div>

          {book.cover && (
            <img src={book.cover} alt={book.title}
              style={{ width: '100%', borderRadius: '10px', border: '1px solid var(--border-soft)', maxHeight: '220px', objectFit: 'cover' }} />
          )}

          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {book.author}
            {book.original_publication_year ? ` · ${book.original_publication_year}` : ''}
          </div>

          {book.description && (
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {book.description}
            </p>
          )}
        </div>
      </EditorSectionCard>
    </div>
  );
}

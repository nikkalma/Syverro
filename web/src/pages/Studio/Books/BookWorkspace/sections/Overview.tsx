import { Link } from 'react-router-dom';
import { useBookWorkspace } from '../BookWorkspaceContext';
import EditorialIntelligence from '../../../../../components/Studio/editorialIntelligence/EditorialIntelligence';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';
import { buildBookReport, type BookEditorialLabels } from '../editorialIntelligence';
import { getBookReadiness } from '../bookWorkspaceModel';

export default function Overview() {
  const t = getLocaleData(getBrowserLocale());
  const { book } = useBookWorkspace();
  if (!book) return null;

  const labels: BookEditorialLabels = {
    name: t.admin.books.name,
    author: t.admin.enrichment.authorSection,
    cover: t.admin.books.coverUrl,
    genres: t.admin.books.genres,
    description: t.admin.books.description,
    pages: t.admin.books.pages,
  };
  const missing = getBookReadiness(book);
  const fieldLabels: Record<string, string> = {
    title: t.admin.books.name,
    authors: t.admin.enrichment.authorSection,
    cover: t.admin.books.coverUrl,
    publication_year: t.admin.books.originalYear,
    pages: t.admin.books.pages,
    description: t.admin.books.description,
    genres: t.admin.books.genres,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorialIntelligence report={buildBookReport(book, labels)} />
      <EditorSectionCard title={t.admin.bookWorkspace.readiness}>
        <p style={{ margin: '0 0 10px', color: 'var(--text-muted)', fontSize: '13px' }}>{t.admin.bookWorkspace.readinessDescription}</p>
        {missing.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--success)', fontSize: '13px' }}>{t.admin.bookWorkspace.allReady}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ margin: '0 0 4px', color: 'var(--text-muted)', fontSize: '13px' }}>{t.admin.bookWorkspace.missingSummary}</p>
            {missing.map((item) => (
              <Link key={item.key} to={`../${item.section}`} style={{ color: 'var(--accent)', fontSize: '13px', textDecoration: 'none' }}>
                {fieldLabels[item.key]} →
              </Link>
            ))}
          </div>
        )}
        <p style={{ margin: '12px 0 0', color: 'var(--text-muted)', fontSize: '12px' }}>{t.admin.bookWorkspace.lifecycleSeparate}</p>
      </EditorSectionCard>
    </div>
  );
}

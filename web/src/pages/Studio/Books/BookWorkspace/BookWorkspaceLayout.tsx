import { getLocaleData, getBrowserLocale } from '../../../../locales';
import EntityWorkspaceLayout from '../../../../components/Studio/shared/EntityWorkspaceLayout';
import { BookWorkspaceProvider, useBookWorkspace } from './BookWorkspaceContext';
import { getBookCompletion } from './bookWorkspaceModel';
import { studioPath } from '../../../../shared/utils/studioRoutes';

const SECTION_PATHS = ['overview', 'identity', 'editorial', 'knowledge', 'preview'] as const;

function WorkspaceContent() {
  const t = getLocaleData(getBrowserLocale());
  const { book, loading, error } = useBookWorkspace();

  const now = new Date();
  const updatedAgo = book?.updated_at
    ? Math.floor((now.getTime() - new Date(book.updated_at).getTime()) / 86400000)
    : null;
  const lastUpdated = updatedAgo !== null
    ? (updatedAgo === 0 ? t.admin.authors.editor.today : `${updatedAgo}${t.admin.authors.editor.daysAgo}`)
    : undefined;

  const identityParts: string[] = [];
  if (book?.authors?.length) identityParts.push(book.authors.map((author) => author.name).join(', '));
  if (book?.publication_format) identityParts.push(book.publication_format);
  if (book?.original_publication_year) identityParts.push(String(book.original_publication_year));
  if (book?.country_of_origin) identityParts.push(book.country_of_origin);

  return (
    <EntityWorkspaceLayout
      name={book?.title || ''}
      photoUrl={book?.cover}
      completionPercent={book ? getBookCompletion(book) : undefined}
      lastUpdated={lastUpdated}
      statusLabel={book?.is_published ? t.admin.books.publishedBadge : t.admin.books.draftBadge}
      identitySummary={identityParts.join(' · ') || undefined}
      metadataStatus={book?.metadata_status}
      entityTypeLabel={t.admin.workspace.book}
      sections={SECTION_PATHS.map((p) => ({
        path: p,
        label: p === 'identity' ? t.admin.bookWorkspace.identityBibliography
          : p === 'editorial' ? t.admin.bookWorkspace.editorial
          : p === 'preview' ? t.admin.bookWorkspace.previewPublishing
          : (t.admin.workspace.sections as Record<string, string>)[p],
      }))}
      basePath={book?.id ? studioPath(`books/${book.id}/workspace`) : ''}
      loading={loading}
      error={error}
      notFoundLabel={t.admin.workspace.book}
    />
  );
}

export default function BookWorkspaceLayout() {
  return (
    <BookWorkspaceProvider>
      <WorkspaceContent />
    </BookWorkspaceProvider>
  );
}

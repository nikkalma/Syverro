import { BookOpen } from 'lucide-react';
import { getLocaleData, getBrowserLocale } from '../../../../locales';
import EntityWorkspaceLayout from '../../../../components/Studio/shared/EntityWorkspaceLayout';
import EmptyWorkspace from '../../../../components/Studio/shared/EmptyWorkspace';
import type { AdminBook } from '../../../../types/admin';
import { BookWorkspaceProvider, useBookWorkspace } from './BookWorkspaceContext';

const SECTION_PATHS = ['overview', 'identity', 'knowledge', 'connections', 'content', 'media', 'preview'] as const;

function computeCompletion(book: AdminBook): number {
  const fields = [
    book.title, book.author, book.cover, book.description,
    book.original_title, book.original_language, book.country_of_origin,
    book.original_publication_year, book.series_name,
    book.genres?.length, book.themes?.length, book.total_pages,
  ];
  const filled = fields.filter((f) => f !== null && f !== undefined && f !== '' && f !== 0);
  return Math.round((filled.length / fields.length) * 100);
}

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
  if (book?.author) identityParts.push(book.author);
  if (book?.publication_format) identityParts.push(book.publication_format);
  if (book?.original_publication_year) identityParts.push(String(book.original_publication_year));
  if (book?.country_of_origin) identityParts.push(book.country_of_origin);

  return (
    <EntityWorkspaceLayout
      name={book?.title || ''}
      photoUrl={book?.cover}
      completionPercent={book ? computeCompletion(book) : undefined}
      lastUpdated={lastUpdated}
      statusLabel={book?.is_published ? t.admin.books.publishedBadge : t.admin.books.draftBadge}
      identitySummary={identityParts.join(' · ') || undefined}
      metadataStatus={book?.metadata_status}
      entityTypeLabel={t.admin.workspace.book}
      sections={SECTION_PATHS.map((p) => ({
        path: p,
        label: (t.admin.workspace.sections as Record<string, string>)[p],
      }))}
      basePath={book?.id ? `/studio/books/${book.id}/workspace` : ''}
      loading={loading}
      error={error}
      notFoundLabel={t.admin.workspace.book}
      preview={
        <EmptyWorkspace
          icon={<BookOpen size={20} />}
          title={t.admin.workspace.preview}
          description={t.admin.workspace.previewDesc}
        />
      }
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

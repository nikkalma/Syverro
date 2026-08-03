import { getLocaleData, getBrowserLocale } from '../../../../locales';
import { AuthorEditorProvider, useAuthorEditor, SECTION_PATHS } from './AuthorEditorContext';
import { type AdminAuthor, getAuthorDisplayName } from '../../../../types/admin';
import EntityWorkspaceLayout from '../../../../components/Studio/shared/EntityWorkspaceLayout';
import MetadataStatusControl from './MetadataStatusControl';

function computeCompletion(author: AdminAuthor): number {
  const fields = [
    author.name, author.slug, author.display_name, author.nationality,
    author.birth_date, author.photo, author.about_summary,
    author.occupations?.length, author.languages?.length,
  ];
  const filled = fields.filter((f) => f !== null && f !== undefined && f !== '' && f !== 0);
  return Math.round((filled.length / fields.length) * 100);
}

function EditorContent() {
  const { author, loading, error } = useAuthorEditor();
  const t = getLocaleData(getBrowserLocale());

  const now = new Date();
  const updatedAgo = author?.updated_at
    ? Math.floor((now.getTime() - new Date(author.updated_at).getTime()) / 86400000)
    : null;
  const lastUpdated = updatedAgo !== null
    ? (updatedAgo === 0 ? t.admin.authors.editor.today : `${updatedAgo}${t.admin.authors.editor.daysAgo}`)
    : undefined;

  const identityParts: string[] = [];
  if (author?.nationality) identityParts.push(author.nationality);
  if (author?.occupations?.length) identityParts.push(author.occupations.slice(0, 2).join(', '));
  if (author?.birth_date) identityParts.push(`b. ${author.birth_date}`);
  if (author?.death_date) identityParts.push(`d. ${author.death_date}`);

  return (
    <EntityWorkspaceLayout
      name={author ? getAuthorDisplayName(author) : ''}
      photoUrl={author?.photo}
      completionPercent={author ? computeCompletion(author) : undefined}
      lastUpdated={lastUpdated}
      statusLabel={author?.creation_type === 'auto' ? t.admin.authors.editor.autoImported : t.admin.authors.editor.curated}
      identitySummary={identityParts.join(' · ') || undefined}
      metadataStatus={author?.metadata_status}
      entityTypeLabel={t.admin.workspace.author}
      sections={SECTION_PATHS.map((p) => ({
        path: p,
        label: (t.admin.authors.editor.sections as Record<string, string>)[p],
      }))}
      basePath={`/studio/authors/${author?.id}/edit`}
      loading={loading}
      error={error}
      notFoundLabel={t.admin.authors.editAuthor}
      preview={<>
        <MetadataStatusControl />
      </>}
    />
  );
}

export default function AuthorEditorLayout() {
  return (
    <AuthorEditorProvider>
      <EditorContent />
    </AuthorEditorProvider>
  );
}

import { getLocaleData, getBrowserLocale } from '../../../../locales';
import { AuthorEditorProvider, useAuthorEditor, SECTION_PATHS } from './AuthorEditorContext';
import { getAuthorDisplayName } from '../../../../types/admin';
import EntityWorkspaceLayout from '../../../../components/Studio/shared/EntityWorkspaceLayout';
import { studioPath } from '../../../../shared/utils/studioRoutes';
import AuthorEditorNavigation from './AuthorEditorNavigation';
import AuthorWorkflowSummary from './AuthorWorkflowSummary';

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
  const basePath = studioPath(`authors/${author?.id}/edit`);

  return (
    <EntityWorkspaceLayout
      name={author ? getAuthorDisplayName(author) : ''}
      photoUrl={author?.photo}
      lastUpdated={lastUpdated}
      statusLabel={author?.creation_type === 'auto' ? t.admin.authors.editor.autoImported : t.admin.authors.editor.curated}
      identitySummary={identityParts.join(' · ') || undefined}
      metadataStatus={author?.metadata_status}
      entityTypeLabel={t.admin.workspace.author}
      sections={SECTION_PATHS.map((p) => ({
        path: p,
        label: (t.admin.authors.editor.sections as Record<string, string>)[p],
      }))}
      basePath={basePath}
      loading={loading}
      error={error}
      notFoundLabel={t.admin.authors.editAuthor}
      workflowSummary={<AuthorWorkflowSummary />}
      navigation={<AuthorEditorNavigation basePath={basePath} />}
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

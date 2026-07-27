import { Outlet } from 'react-router-dom';
import { getLocaleData, getBrowserLocale } from '../../../../locales';
import { AuthorEditorProvider, useAuthorEditor, SECTION_PATHS } from './AuthorEditorContext';
import type { AdminAuthor } from '../../../../types/admin';
import EntityEditorHeader from '../../../../components/Studio/shared/EntityEditorHeader';
import EditorSectionNav from '../../../../components/Studio/shared/EditorSectionNav';
import EmptyWorkspace from '../../../../components/Studio/shared/EmptyWorkspace';

function computeCompletion(author: AdminAuthor): number {
  const fields = [
    author.name, author.slug, author.display_name, author.nationality,
    author.bio, author.birth_date, author.photo,
    author.occupations?.length, author.languages?.length,
  ];
  const filled = fields.filter((f) => f !== null && f !== undefined && f !== '' && f !== 0);
  return Math.round((filled.length / fields.length) * 100);
}

function EditorContent() {
  const { author, loading, error } = useAuthorEditor();
  const t = getLocaleData(getBrowserLocale());

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        {t.admin.common.loading}
      </div>
    );
  }

  if (error || !author) {
    return (
      <div style={{
        padding: '40px', textAlign: 'center', color: 'var(--error)',
        background: 'var(--glass-bg)', borderRadius: '12px',
        border: '1px solid var(--glass-border)',
      }}>
        <p>{error || 'Author not found'}</p>
      </div>
    );
  }

  const displayName = author.display_name || author.name;
  const completionPercent = computeCompletion(author);

  const now = new Date();
  const updatedAgo = author.updated_at
    ? Math.floor((now.getTime() - new Date(author.updated_at).getTime()) / 86400000)
    : null;
  const lastUpdated = updatedAgo !== null
    ? (updatedAgo === 0 ? t.admin.authors.editor.today : `${updatedAgo}${t.admin.authors.editor.daysAgo}`)
    : undefined;

  const identityParts: string[] = [];
  if (author.nationality) identityParts.push(author.nationality);
  if (author.occupations?.length) identityParts.push(author.occupations.slice(0, 2).join(', '));
  if (author.birth_date) identityParts.push(`b. ${author.birth_date}`);
  if (author.death_date) identityParts.push(`d. ${author.death_date}`);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <EntityEditorHeader
        name={displayName}
        photoUrl={author.photo}
        nativeName={author.native_name}
        completionPercent={completionPercent}
        lastUpdated={lastUpdated}
        statusLabel={author.creation_type === 'auto' ? t.admin.authors.editor.autoImported : t.admin.authors.editor.curated}
        identitySummary={identityParts.join(' · ')}
        metadataStatus={author.metadata_status}
      />
      <EditorSectionNav
        sections={SECTION_PATHS.map((p) => ({
          path: p,
          label: (t.admin.authors.editor.sections as Record<string, string>)[p],
        }))}
        basePath={`/studio/authors/${author.id}/edit`}
      />
      <div style={{ flex: 1, display: 'flex', gap: '24px', padding: '24px 28px' }}>
        <div style={{
          flex: 1, minWidth: 0,
          background: 'var(--surface)',
          border: '1px solid var(--border-soft)',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <Outlet />
        </div>
        <aside style={{
          width: '220px', flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: '16px',
        }}>
          <EmptyWorkspace
            icon="📋"
            title={t.admin.authors.editor.activityTitle}
            description={t.admin.authors.editor.activityDesc}
          />
        </aside>
      </div>
    </div>
  );
}

export default function AuthorEditorLayout() {
  return (
    <AuthorEditorProvider>
      <EditorContent />
    </AuthorEditorProvider>
  );
}

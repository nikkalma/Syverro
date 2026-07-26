import { Outlet } from 'react-router-dom';
import { getLocaleData, getBrowserLocale } from '../../../../locales';
import { AuthorEditorProvider, useAuthorEditor, SECTIONS } from './AuthorEditorContext';
import EntityEditorHeader from '../../../../components/Studio/shared/EntityEditorHeader';
import EditorSectionNav from '../../../../components/Studio/shared/EditorSectionNav';

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
  const completionPercent = 85;

  const now = new Date();
  const updatedAgo = author.updated_at
    ? Math.floor((now.getTime() - new Date(author.updated_at).getTime()) / 86400000)
    : null;
  const lastUpdated = updatedAgo !== null
    ? (updatedAgo === 0 ? 'Today' : `${updatedAgo}d ago`)
    : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <EntityEditorHeader
        name={displayName}
        photoUrl={author.photo}
        nativeName={author.native_name}
        completionPercent={completionPercent}
        lastUpdated={lastUpdated}
      />
      <EditorSectionNav
        sections={[...SECTIONS]}
        basePath={`/studio/authors/${author.id}/edit`}
      />
      <div style={{ flex: 1, padding: '24px 28px' }}>
        <Outlet />
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

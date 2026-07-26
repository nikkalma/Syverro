import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import EmptyWorkspace from '../../../../../components/Studio/shared/EmptyWorkspace';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';

export default function Quotes() {
  const t = getLocaleData(getBrowserLocale());
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title={t.admin.authors.editor.quotes.quotesAbout}>
        <EmptyWorkspace
          icon="💬"
          title={t.admin.authors.editor.noQuotes}
          description={t.admin.authors.editor.quotes.quotesAboutDesc}
        />
        <div style={{
          marginTop: '12px', padding: '10px', background: 'var(--surface-hover)', borderRadius: '8px',
          border: '1px dashed var(--border-soft)',
          textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)',
          cursor: 'pointer',
        }}>
          {t.admin.authors.editor.addQuote}
        </div>
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.authors.editor.quotes.authorStatements}>
        <EmptyWorkspace
          icon="✍️"
          title={t.admin.authors.editor.noStatements}
          description={t.admin.authors.editor.quotes.authorStatementsDesc}
        />
        <div style={{
          marginTop: '12px', padding: '10px', background: 'var(--surface-hover)', borderRadius: '8px',
          border: '1px dashed var(--border-soft)',
          textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)',
          cursor: 'pointer',
        }}>
          {t.admin.authors.editor.addStatement}
        </div>
      </EditorSectionCard>
    </div>
  );
}

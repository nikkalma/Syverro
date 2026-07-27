import { useState, useEffect, useRef } from 'react';
import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import ActionBar from '../../../../../components/Studio/shared/ActionBar';
import { apiClient } from '../../../../../shared/api/client';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';
import type { AdminAuthorUpdate } from '../../../../../types/admin';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: '14px',
  background: 'var(--input-bg)', border: '1px solid var(--border-soft)',
  borderRadius: '8px', color: 'var(--text-primary)', outline: 'none',
  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
};

export default function Works() {
  const t = getLocaleData(getBrowserLocale());
  const { author, loading, saving, saveError, updateAuthor } = useAuthorEditor();

  const [notableWorks, setNotableWorks] = useState<string[]>([]);
  const [newNotableWork, setNewNotableWork] = useState('');
  const [bookQuery, setBookQuery] = useState('');
  const [bookResults, setBookResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [linkedBookIds, setLinkedBookIds] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!author) return;
    setNotableWorks(author.notable_works || []);
  }, [author]);

  useEffect(() => {
    if (!author) return;
    const fetchLinkedBooks = async () => {
      try {
        const res = await apiClient.get('/admin/books', { params: { search: author.name, limit: 50 } });
        const books: any[] = res.data?.data || [];
        const linked = new Set<string>();
        for (const b of books) {
          const authors = b.authors || [];
          if (authors.some((a: any) => a.id === author.id)) {
            linked.add(b.id);
          }
        }
        setLinkedBookIds(linked);
      } catch {}
    };
    fetchLinkedBooks();
  }, [author]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!bookQuery.trim()) { setBookResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiClient.get('/admin/books', { params: { search: bookQuery, limit: 10 } });
        const books: any[] = res.data?.data || [];
        setBookResults(books);
      } catch { setBookResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [bookQuery]);

  const handleLink = async (bookId: string) => {
    if (!author) return;
    try {
      await apiClient.post(`/admin/books/${bookId}/authors`, null, { params: { author_id: author.id } });
      setLinkedBookIds((prev) => new Set(prev).add(bookId));
    } catch (e) { console.error('Failed to link book', e); }
  };

  const handleUnlink = async (bookId: string) => {
    if (!author) return;
    try {
      await apiClient.delete(`/admin/books/${bookId}/authors/${author.id}`);
      setLinkedBookIds((prev) => { const next = new Set(prev); next.delete(bookId); return next; });
    } catch (e) { console.error('Failed to unlink book', e); }
  };

  const addNotableWork = () => {
    const work = newNotableWork.trim();
    if (!work || notableWorks.includes(work)) return;
    setNotableWorks([...notableWorks, work]);
    setNewNotableWork('');
  };

  const removeNotableWork = (idx: number) => {
    setNotableWorks(notableWorks.filter((_, i) => i !== idx));
  };

  const hasChanges =
    notableWorks.length !== (author?.notable_works || []).length ||
    notableWorks.some((w, i) => w !== (author?.notable_works || [])[i]);

  const handleSave = async () => {
    const data: AdminAuthorUpdate = { notable_works: notableWorks.length > 0 ? notableWorks : [] };
    await updateAuthor(data);
  };

  const reset = () => {
    if (!author) return;
    setNotableWorks(author.notable_works || []);
  };

  if (loading || !author) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title={t.admin.authors.editor.works.connectedBooks}>
        <div style={{ marginBottom: '12px' }}>
          <input
            type="text"
            value={bookQuery}
            onChange={(e) => setBookQuery(e.target.value)}
            placeholder="Search books..."
            style={inputStyle}
          />
        </div>
        {searching && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Searching...</div>}
        {bookResults.map((book: any) => {
          const isLinked = linkedBookIds.has(book.id);
          const bookAuthors: Array<{ id: string; name: string }> = book.authors || [];
          const authorNames = bookAuthors.map((a) => a.name).join(', ') || book.author;
          return (
            <div key={book.id} style={{
              display: 'flex', gap: '12px', alignItems: 'center',
              padding: '10px 12px',
              background: isLinked ? 'rgba(76,175,80,0.06)' : 'var(--surface-hover)',
              borderRadius: '8px', marginBottom: '4px',
            }}>
              {book.cover && (
                <img src={book.cover} alt="" style={{ width: '32px', height: '48px', borderRadius: '4px', objectFit: 'cover' }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{book.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{authorNames}</div>
              </div>
              <button
                type="button"
                onClick={() => isLinked ? handleUnlink(book.id) : handleLink(book.id)}
                style={{
                  padding: '4px 12px', fontSize: '12px', borderRadius: '6px',
                  border: 'none', cursor: 'pointer',
                  background: isLinked ? 'rgba(220,38,38,0.1)' : 'rgba(76,175,80,0.1)',
                  color: isLinked ? 'var(--error)' : 'var(--success)',
                }}
              >
                {isLinked ? 'Unlink' : 'Link'}
              </button>
            </div>
          );
        })}
        {!bookQuery && linkedBookIds.size > 0 && (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '8px 0' }}>
            {linkedBookIds.size} book(s) linked — search to manage
          </div>
        )}
      </EditorSectionCard>

      <EditorSectionCard title={t.admin.authors.editor.works.notableWorks}>
        {notableWorks.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
            {notableWorks.map((w, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px',
                background: 'var(--surface-hover)',
                borderRadius: '8px',
                fontSize: '14px', color: 'var(--text-secondary)',
              }}>
                <span style={{ fontSize: '16px' }}>📖</span>
                <span style={{ flex: 1 }}>{w}</span>
                <button type="button" onClick={() => removeNotableWork(i)}
                  style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '16px' }}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={newNotableWork}
            onChange={(e) => setNewNotableWork(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addNotableWork(); }}
            placeholder={t.admin.authors.editor.addNotableWork}
            style={inputStyle}
          />
          <button type="button" onClick={addNotableWork}
            style={{
              padding: '8px 16px', background: 'var(--accent)', border: 'none',
              borderRadius: '8px', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
            {t.admin.common.save}
          </button>
        </div>
      </EditorSectionCard>

      {saveError && (
        <div style={{
          padding: '12px 16px', background: 'rgba(220,38,38,0.1)',
          border: '1px solid rgba(220,38,38,0.3)', borderRadius: '8px',
          color: 'var(--error)', fontSize: '13px',
        }}>
          {saveError}
        </div>
      )}

      <ActionBar
        onSave={handleSave}
        onCancel={reset}
        saving={saving}
        dirty={hasChanges}
        saveLabel={t.admin.common.save}
        savingLabel={t.admin.common.saving}
        cancelLabel={t.admin.common.cancel}
      />
    </div>
  );
}

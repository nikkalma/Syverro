import { useState, useEffect, useRef } from 'react';
import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import { apiClient } from '../../../../../shared/api/client';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';
import { getAuthorDisplayName } from '../../../../../types/admin';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: '14px',
  background: 'var(--input-bg)', border: '1px solid var(--border-soft)',
  borderRadius: '8px', color: 'var(--text-primary)', outline: 'none',
  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
};

export default function Works() {
  const t = getLocaleData(getBrowserLocale());
  const { author, loading } = useAuthorEditor();

  const [bookQuery, setBookQuery] = useState('');
  const [bookResults, setBookResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [linkedBookIds, setLinkedBookIds] = useState<Set<string>>(new Set());
  const [linkedBooks, setLinkedBooks] = useState<any[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!author) return;
    const fetchLinkedBooks = async () => {
      try {
        const res = await apiClient.get('/admin/books', { params: { search: author.name, limit: 50 } });
        const books: any[] = res.data?.data || [];
        const linked: any[] = [];
        const ids = new Set<string>();
        for (const b of books) {
          const bookAuthors = b.authors || [];
          if (bookAuthors.some((a: any) => a.id === author.id)) {
            linked.push(b);
            ids.add(b.id);
          }
        }
        setLinkedBooks(linked);
        setLinkedBookIds(ids);
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

  if (loading || !author) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title={t.admin.authors.editor.works.connectedBooks}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '-8px 0 16px 0', lineHeight: 1.5 }}>
          {t.admin.authors.editor.connectedBooksDesc}
        </p>

        {linkedBooks.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Featured Works ({linkedBooks.length})
            </div>
            {linkedBooks.map((book: any) => {
              const bookAuthors: Array<any> = book.authors || [];
              const authorNames = bookAuthors.map((a: any) => getAuthorDisplayName(a)).join(', ') || book.author;
              return (
                <div key={book.id} style={{
                  display: 'flex', gap: '12px', alignItems: 'center',
                  padding: '10px 12px', marginBottom: '4px',
                  background: 'rgba(76,175,80,0.06)', borderRadius: '8px',
                }}>
                  {book.cover && (
                    <img src={book.cover} alt="" style={{ width: '28px', height: '42px', borderRadius: '4px', objectFit: 'cover' }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{book.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{authorNames}</div>
                  </div>
                  <button type="button" onClick={() => handleUnlink(book.id)}
                    style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'rgba(220,38,38,0.1)', color: 'var(--error)' }}>
                    Unlink
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginBottom: '12px' }}>
          <input type="text" value={bookQuery} onChange={(e) => setBookQuery(e.target.value)}
            placeholder="Search books to link..." style={inputStyle} />
        </div>
        {searching && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Searching...</div>}
        {bookResults.map((book: any) => {
          const isLinked = linkedBookIds.has(book.id);
          const bookAuthors: Array<any> = book.authors || [];
          const authorNames = bookAuthors.map((a: any) => getAuthorDisplayName(a)).join(', ') || book.author;
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
              <button type="button"
                onClick={() => isLinked ? handleUnlink(book.id) : handleLink(book.id)}
                style={{
                  padding: '4px 12px', fontSize: '12px', borderRadius: '6px',
                  border: 'none', cursor: 'pointer',
                  background: isLinked ? 'rgba(220,38,38,0.1)' : 'rgba(76,175,80,0.1)',
                  color: isLinked ? 'var(--error)' : 'var(--success)',
                }}>
                {isLinked ? 'Unlink' : 'Link'}
              </button>
            </div>
          );
        })}
        {!bookQuery && linkedBooks.length === 0 && (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
            {t.admin.authors.editor.noConnectedBooks}
          </div>
        )}
      </EditorSectionCard>
    </div>
  );
}

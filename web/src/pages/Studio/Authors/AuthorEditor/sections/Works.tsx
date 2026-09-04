import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthorEditor } from '../AuthorEditorContext';
import EditorSectionCard from '../../../../../components/Studio/shared/EditorSectionCard';
import { apiClient } from '../../../../../shared/api/client';
import { getLocaleData, getBrowserLocale } from '../../../../../locales';
import { getAuthorDisplayName } from '../../../../../types/admin';
import type { AdminBook } from '../../../../../types/admin';

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
  const [bookResults, setBookResults] = useState<AdminBook[]>([]);
  const [searching, setSearching] = useState(false);
  const [linkedBookIds, setLinkedBookIds] = useState<Set<string>>(new Set());
  const [linkedBooks, setLinkedBooks] = useState<AdminBook[]>([]);
  const [linkedBooksLoading, setLinkedBooksLoading] = useState(true);
  const [linkedBooksError, setLinkedBooksError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchLinkedBooks = useCallback(async () => {
    if (!author) return;
    setLinkedBooksLoading(true);
    setLinkedBooksError(false);
    try {
      // Catalog authorship is canonical in book_authors. AuthorPublication is
      // intentionally loaded and edited in the separate Bibliography section.
      const res = await apiClient.get('/admin/books', { params: { author_id: author.id, limit: 50 } });
      const books: AdminBook[] = res.data?.data || [];
      setLinkedBooks(books);
      setLinkedBookIds(new Set(books.map((book) => book.id)));
    } catch {
      setLinkedBooks([]);
      setLinkedBookIds(new Set());
      setLinkedBooksError(true);
    } finally {
      setLinkedBooksLoading(false);
    }
  }, [author]);

  useEffect(() => {
    fetchLinkedBooks();
  }, [fetchLinkedBooks]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!bookQuery.trim()) { setBookResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiClient.get('/admin/books', { params: { search: bookQuery, limit: 10 } });
        const books: AdminBook[] = res.data?.data || [];
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
      const linkedBook = bookResults.find((book) => book.id === bookId);
      setLinkedBookIds((prev) => new Set(prev).add(bookId));
      if (linkedBook) {
        setLinkedBooks((prev) => prev.some((book) => book.id === bookId) ? prev : [...prev, linkedBook]);
      }
    } catch (e) { console.error('Failed to link book', e); }
  };

  const handleUnlink = async (bookId: string) => {
    if (!author) return;
    try {
      await apiClient.delete(`/admin/books/${bookId}/authors/${author.id}`);
      setLinkedBookIds((prev) => { const next = new Set(prev); next.delete(bookId); return next; });
      setLinkedBooks((prev) => prev.filter((book) => book.id !== bookId));
    } catch (e) { console.error('Failed to unlink book', e); }
  };

  if (loading || !author) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <EditorSectionCard title={t.admin.authors.editor.works.connectedBooks}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '-8px 0 16px 0', lineHeight: 1.5 }}>
          {t.admin.authors.editor.connectedBooksDesc}
        </p>

        {linkedBooksLoading && (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '8px 0' }}>
            {t.admin.common.loading}
          </div>
        )}

        {!linkedBooksLoading && linkedBooksError && (
          <div style={{ fontSize: '13px', color: 'var(--error)', padding: '8px 0' }}>
            {t.admin.authors.editor.linkedBooksLoadError}{' '}
            <button type="button" onClick={fetchLinkedBooks} style={{ border: 0, padding: 0, background: 'none', color: 'var(--accent)', cursor: 'pointer' }}>
              {t.admin.common.retry}
            </button>
          </div>
        )}

        {!linkedBooksLoading && !linkedBooksError && linkedBooks.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t.admin.authors.editor.works.connectedBooks} ({linkedBooks.length})
            </div>
            {linkedBooks.map((book) => {
              const bookAuthors = book.authors || [];
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
                    <div style={{ fontSize: '11px', color: book.publication_id ? 'var(--success)' : 'var(--warning)', marginTop: '2px' }}>
                      {book.publication_id ? `Canonical Work: ${book.publication_id}` : 'Unlinked from a canonical Work'}
                    </div>
                  </div>
                  <button type="button" onClick={() => handleUnlink(book.id)}
                    style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'rgba(220,38,38,0.1)', color: 'var(--error)' }}>
                    {t.admin.studioCleanup.unlink}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginBottom: '12px' }}>
          <input type="text" value={bookQuery} onChange={(e) => setBookQuery(e.target.value)}
            placeholder={t.admin.studioCleanup.searchBooks} style={inputStyle} />
        </div>
        {searching && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t.admin.studioCleanup.searching}</div>}
        {bookResults.map((book) => {
          const isLinked = linkedBookIds.has(book.id);
          const bookAuthors = book.authors || [];
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
                {isLinked ? t.admin.studioCleanup.unlink : t.admin.studioCleanup.link}
              </button>
            </div>
          );
        })}
        {!bookQuery && !linkedBooksLoading && !linkedBooksError && linkedBooks.length === 0 && (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
            {t.admin.authors.editor.noConnectedBooks}
          </div>
        )}
      </EditorSectionCard>
    </div>
  );
}

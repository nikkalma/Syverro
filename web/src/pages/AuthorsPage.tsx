import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../shared/api/client';
import { formatAuthorName } from '../shared/utils/formatAuthorName';
import { Search } from 'lucide-react';

interface AuthorBrief {
  id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  native_name: string | null;
  biography_excerpt: string | null;
  photo_url: string | null;
  nationality: string | null;
}

export default function AuthorsPage() {
  const navigate = useNavigate();
  const [authors, setAuthors] = useState<AuthorBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiClient.get<AuthorBrief[]>('/authors')
      .then((res) => setAuthors(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = authors.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      (a.first_name || '').toLowerCase().includes(q) ||
      (a.last_name || '').toLowerCase().includes(q) ||
      (a.native_name || '').toLowerCase().includes(q) ||
      (a.nationality || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 60px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '500', color: '#E6EDF3', marginBottom: '20px' }}>
        Авторы
      </h1>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        background: 'var(--bg)', borderRadius: '8px', padding: '4px 14px',
        border: '1px solid var(--border-soft)', maxWidth: '400px', marginBottom: '28px',
      }}>
        <Search size={18} color="var(--text-secondary)" />
        <input
          placeholder="Search authors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: 'none', border: 'none', outline: 'none',
            color: 'var(--text-primary)', fontSize: '14px', width: '100%',
            padding: '8px 4px', fontFamily: 'Inter, sans-serif',
          }}
        />
      </div>

      {loading ? (
        <div style={{ color: '#97A6BA', fontSize: '14px' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#5B86A1', fontSize: '14px', padding: '60px 0' }}>
          {authors.length === 0 ? 'No authors found' : 'No authors match your search'}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {filtered.map((author) => {
            const displayName = formatAuthorName(author.name, author.first_name, author.last_name);
            return (
              <div
                key={author.id}
                onClick={() => navigate(`/authors/${author.id}`)}
                style={{
                  display: 'flex', gap: '16px', padding: '16px',
                  background: 'rgba(18,28,36,0.5)', borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer', transition: 'border-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(91,134,161,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
              >
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                  background: 'linear-gradient(135deg, #2A4B60, #1A2832)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', color: '#5B86A1',
                }}>
                  {author.photo_url ? (
                    <img src={author.photo_url} alt={displayName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: '500', color: '#E6EDF3', marginBottom: '4px' }}>
                    {displayName}
                  </div>
                  {author.nationality && (
                    <div style={{ fontSize: '12px', color: '#5B86A1', marginBottom: '4px' }}>
                      {author.nationality}
                    </div>
                  )}
                  {author.biography_excerpt && (
                    <div style={{ fontSize: '12px', color: '#97A6BA', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
                      {author.biography_excerpt}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

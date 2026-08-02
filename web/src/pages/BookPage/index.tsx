import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AddToLibraryModal } from './AddToLibraryModal';
import type { PersonalBookStatus } from '../../types/personalBook';
import type { PersonalBook } from '../../types/personalBook';
import type { PublicBookDetail } from '../../types/bookDetail';
import { formatAuthorName } from '../../shared/utils/formatAuthorName';
import { authorPath } from '../../shared/utils/authorUrl';
import { bookDetailApi } from '../../shared/api/bookDetailApi';
import { bookApi } from '../../shared/api/bookApi';
import { useOffline } from '@/lib/offline';

const labelStyle: React.CSSProperties = {
  fontSize: '11px', color: '#5B86A1', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.3px',
};

const valueStyle: React.CSSProperties = {
  fontSize: '14px', color: '#E6EDF3',
};

const sectionBoxStyle: React.CSSProperties = {
  background: 'rgba(18,28,36,0.4)', borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.04)', padding: '12px 16px',
};

const tagPillStyle = (color: string): React.CSSProperties => ({
  padding: '3px 12px', borderRadius: '14px', fontSize: '12px',
  background: `${color}12`, color, border: `1px solid ${color}25`,
  cursor: 'pointer', display: 'inline-block',
});

export default function BookPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<PublicBookDetail | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'not-found' | 'error'>('loading');
  const [personalBook, setPersonalBook] = useState<PersonalBook | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { trackReadingStart, trackReadingFinish, trackNote } = useOffline();

  const loadBook = useCallback(async () => {
    if (!id) {
      setLoadState('not-found');
      return;
    }
    setLoadState('loading');
    try {
      const detail = await bookDetailApi.getById(id);
      setBook(detail);
      setLoadState('ready');
    } catch (error) {
      setBook(null);
      setLoadState(axios.isAxiosError(error) && error.response?.status === 404 ? 'not-found' : 'error');
    }
  }, [id]);

  useEffect(() => {
    void loadBook();
  }, [loadBook]);

  useEffect(() => {
    if (!id) return;
    void bookApi.getUserBooks()
      .then((items) => setPersonalBook(items.find((item) => item.bookId === id) ?? null))
      .catch(() => setPersonalBook(null));
  }, [id]);

  const isInLibrary = !!personalBook;
  const primaryAuthor = book?.authors.find((author) => author.isPrimary) ?? book?.authors[0] ?? null;
  const themes = book?.knowledge.filter((item) => item.nodeType === 'theme') ?? [];
  const motifs = book?.knowledge.filter((item) => item.nodeType === 'motif') ?? [];
  const concepts = book?.knowledge.filter((item) => item.nodeType === 'concept') ?? [];
  const atmospheres = book?.knowledge.filter((item) => item.nodeType === 'atmosphere') ?? [];

  if (loadState === 'loading') {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#97A6BA' }}>Загрузка книги…</div>;
  }

  if (loadState === 'not-found') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: '#E6EDF3' }}>Книга не найдена</h2>
        <button onClick={() => navigate('/')} style={{
          marginTop: '16px', padding: '8px 16px', background: '#2A4B60',
          border: 'none', borderRadius: '8px', color: '#E6EDF3', cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
        }}>Вернуться в библиотеку</button>
      </div>
    );
  }

  if (loadState === 'error' || !book) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: '#E6EDF3' }}>Не удалось загрузить книгу</h2>
        <button onClick={() => void loadBook()} style={{
          marginTop: '16px', padding: '8px 16px', background: '#2A4B60',
          border: 'none', borderRadius: '8px', color: '#E6EDF3', cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
        }}>Повторить</button>
      </div>
    );
  }

  const handleAddToLibrary = async (status: PersonalBookStatus) => {
    await bookApi.addToLibrary(book.title, primaryAuthor?.name ?? '', status);
    const personalBooks = await bookApi.getUserBooks();
    setPersonalBook(personalBooks.find((item) => item.bookId === book.id) ?? null);
    setIsAddModalOpen(false);
    if (status === 'reading') {
      trackReadingStart(book.id, { title: book.title, author: primaryAuthor?.name ?? '' });
    }
  };

  const handleRemoveFromLibrary = () => {
    if (personalBook?.status === 'reading') trackReadingFinish(book.id, 0);
  };

  const handleTagClick = (type: 'genre' | 'theme', value: string) => {
    navigate(`/?${type}=${encodeURIComponent(value)}`);
  };

  const handleSaveNote = (text: string) => {
    if (text.trim()) { trackNote(book.id, text.trim()); }
  };

  const MetaBlock = ({ label, children, span }: { label: string; children: React.ReactNode; span?: number }) => (
    <div style={{
      padding: '8px 12px', background: 'rgba(0,0,0,0.15)', borderRadius: '6px',
      gridColumn: span ? `span ${span}` : undefined,
    }}>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{children || <span style={{ color: '#5B86A1', fontStyle: 'italic' }}>—</span>}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
      <button onClick={() => navigate('/')} style={{
        background: 'none', border: 'none', color: '#5B86A1', cursor: 'pointer',
        fontSize: '14px', marginBottom: '24px', fontFamily: 'Inter, sans-serif',
      }}>← Назад в библиотеку</button>

      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        {/* Left content */}
        <div style={{ flex: '1', minWidth: 0 }}>
          {/* Title & Author */}
          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '500', color: '#E6EDF3', margin: '0 0 4px 0', lineHeight: 1.2 }}>
              {book.title}
            </h1>
            {book.subtitle && (
              <h2 style={{ fontSize: '16px', fontWeight: '300', color: '#97A6BA', margin: '0 0 8px 0' }}>
                {book.subtitle}
              </h2>
            )}
            <div style={{ fontSize: '16px', color: '#97A6BA', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {book.authors.map((author) => (
                <span key={author.id}
                  onClick={() => author.slug && navigate(authorPath({ id: author.id, slug: author.slug }))}
                  style={{ color: '#5B86A1', cursor: author.slug ? 'pointer' : 'default', textDecoration: 'none' }}>
                  ✍️ {formatAuthorName(author.displayName || author.name)}
                </span>
              ))}
            </div>
          </div>

          {/* Publication metadata */}
          <div style={{ ...sectionBoxStyle, marginBottom: '16px' }}>
            <div style={{ ...labelStyle, marginBottom: '8px' }}>Публикация</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
              {book.publicationYear !== null && <MetaBlock label="Год">{book.publicationYear}</MetaBlock>}
              {book.countryOfOrigin && <MetaBlock label="Страна">{book.countryOfOrigin}</MetaBlock>}
              {book.totalPages !== null && <MetaBlock label="Страниц">{book.totalPages}</MetaBlock>}
              {book.originalLanguage && <MetaBlock label="Язык">{book.originalLanguage}</MetaBlock>}
              <MetaBlock label="Обложка">{book.cover ? '✓ Есть' : '—'}</MetaBlock>
            </div>
          </div>

          {/* Series */}
          {book.seriesName && (
            <div style={{ ...sectionBoxStyle, marginBottom: '16px' }}>
              <div style={{ ...labelStyle, marginBottom: '4px' }}>Серия</div>
              <div style={valueStyle}>
                📚 {book.seriesName} {book.seriesPosition ? `• Книга ${book.seriesPosition}` : ''}
              </div>
            </div>
          )}

          {/* Description */}
          <div style={{ marginBottom: '24px' }}>
            <p style={{
              color: book.description ? '#97A6BA' : '#5B86A1',
              lineHeight: '1.8', fontSize: '15px', whiteSpace: 'pre-wrap',
              fontStyle: book.description ? 'normal' : 'italic', margin: 0,
            }}>
              {book.description || 'Описание пока отсутствует'}
            </p>
          </div>

          {/* Taxonomy section */}
          <div style={{ marginBottom: '20px' }}>
            {/* Genres */}
            {book.genres.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ ...labelStyle, marginBottom: '6px' }}>Жанры</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {book.genres.map((genre) => (
                    <span key={genre.id} style={tagPillStyle('#5B86A1')} onClick={() => handleTagClick('genre', genre.name)}>{genre.name}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Themes */}
            {themes.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ ...labelStyle, marginBottom: '6px' }}>Темы</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {themes.map((theme) => (
                    <span key={theme.nodeId} style={tagPillStyle('#FBBF24')} onClick={() => handleTagClick('theme', theme.name)}>{theme.name}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Motifs/Vibe/Mood grouped */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              {motifs.length > 0 && (
                <div>
                  <div style={{ ...labelStyle, marginBottom: '6px' }}>Мотивы</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {motifs.map((motif) => (
                      <span key={motif.nodeId} style={tagPillStyle('#EC4899')}>{motif.name}</span>
                    ))}
                  </div>
                </div>
              )}
              {atmospheres.length > 0 && (
                <div>
                  <div style={{ ...labelStyle, marginBottom: '6px' }}>Атмосфера</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {atmospheres.map((atmosphere) => (
                      <span key={atmosphere.nodeId} style={tagPillStyle('#5B86A1')}>{atmosphere.name}</span>
                    ))}
                  </div>
                </div>
              )}
              {concepts.length > 0 && (
                <div>
                  <div style={{ ...labelStyle, marginBottom: '6px' }}>Концепты</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {concepts.map((concept) => (
                      <span key={concept.nodeId} style={tagPillStyle('#A855F7')}>{concept.name}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Personal interactions */}
          {isInLibrary && (
            <div style={{ ...sectionBoxStyle, marginBottom: '16px' }}>
              <div style={{ ...labelStyle, marginBottom: '8px' }}>Моё взаимодействие</div>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ ...labelStyle, fontSize: '10px' }}>Статус</div>
                  <div style={valueStyle}>
                    {personalBook?.status === 'reading' && '📖 Читаю'}
                    {personalBook?.status === 'planned' && '📚 На полке'}
                    {personalBook?.status === 'completed' && '✅ Завершено'}
                    {personalBook?.status === 'postponed' && '⏸ Отложено'}
                    {personalBook?.status === 'abandoned' && '❌ Брошено'}
                  </div>
                </div>
                {personalBook?.startedAt && (
                  <div>
                    <div style={{ ...labelStyle, fontSize: '10px' }}>Начато</div>
                    <div style={valueStyle}>{new Date(personalBook.startedAt).toLocaleDateString('ru-RU')}</div>
                  </div>
                )}
                {personalBook?.completedAt && (
                  <div>
                    <div style={{ ...labelStyle, fontSize: '10px' }}>Завершено</div>
                    <div style={valueStyle}>{new Date(personalBook.completedAt).toLocaleDateString('ru-RU')}</div>
                  </div>
                )}
                {personalBook?.rereadCount !== undefined && personalBook.rereadCount > 0 && (
                  <div>
                    <div style={{ ...labelStyle, fontSize: '10px' }}>Прочтений</div>
                    <div style={valueStyle}>{personalBook.rereadCount}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Cover + actions */}
        <div style={{ flex: '0 0 240px' }}>
          <div style={{
            width: '100%', aspectRatio: '2/3',
            background: 'linear-gradient(135deg, #1A2832, #0F1A22)',
            borderRadius: '12px', overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            {book.cover ? (
              <img src={book.cover} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '48px', opacity: 0.3, color: '#5B86A1',
              }}>📖</div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {isInLibrary ? (
              <button onClick={handleRemoveFromLibrary} style={{
                width: '100%', padding: '10px 16px', background: 'rgba(239,83,80,0.2)',
                border: '1px solid rgba(239,83,80,0.3)', borderRadius: '8px',
                color: '#EF5350', fontSize: '14px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: '500',
              }}>✕ Убрать из библиотеки</button>
            ) : (
              <button onClick={() => setIsAddModalOpen(true)} style={{
                width: '100%', padding: '10px 16px', background: '#5B86A1', border: 'none',
                borderRadius: '8px', color: '#0A1118', fontSize: '14px', fontWeight: '600',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}>+ В библиотеку</button>
            )}
          </div>

          {/* Graph navigation placeholder */}
          <div style={{
            ...sectionBoxStyle, marginTop: '12px', textAlign: 'center',
            padding: '16px', fontSize: '12px', color: '#5B86A1',
          }}>
            <div style={{ fontSize: '20px', marginBottom: '4px', opacity: 0.5 }}>🔮</div>
            Граф связей
          </div>
        </div>
      </div>

      {/* Reading & Notes */}
      <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <div style={{ ...sectionBoxStyle }}>
            <div style={{ ...labelStyle, marginBottom: '4px' }}>Чтение</div>
            <div style={{ color: '#5B86A1', fontSize: '14px' }}>
              Функция в разработке
            </div>
          </div>
        </div>
        <div>
          <div style={{ ...sectionBoxStyle }}>
            <div style={{ ...labelStyle, marginBottom: '8px' }}>Мои заметки</div>
            <textarea
              placeholder="Напишите заметку о книге..."
              style={{
                width: '100%', minHeight: '60px', background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                padding: '10px', color: '#E6EDF3', fontSize: '14px',
                fontFamily: 'Inter, sans-serif', resize: 'vertical', boxSizing: 'border-box',
              }}
              onBlur={(e) => { const text = e.target.value; if (text.trim()) { handleSaveNote(text); e.target.value = ''; } }}
            />
            <div style={{ fontSize: '11px', color: '#5B86A1', marginTop: '6px' }}>
              Сохраняется локально
            </div>
          </div>
        </div>
      </div>

      <AddToLibraryModal isOpen={isAddModalOpen} bookTitle={book.title}
        onClose={() => setIsAddModalOpen(false)} onAdd={handleAddToLibrary} />
    </div>
  );
}

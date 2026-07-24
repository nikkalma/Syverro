// src/pages/BookPage/index.tsx

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLibrary } from '../../hooks/useLibrary';
import { AddToLibraryModal } from './AddToLibraryModal';
import type { PersonalBookStatus } from '../../types/personalBook';
import { formatAuthorName } from '../../shared/utils/formatAuthorName';

// ===== ОФФЛАЙН-СЛОЙ =====
import { useOffline } from '@/lib/offline';

export default function BookPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { books, loadBooks, addToMyLibrary, removeFromMyLibrary } = useLibrary();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // ===== ОФФЛАЙН-ХУК =====
  const { trackReadingStart, trackReadingFinish, trackNote } = useOffline();

  const book = books.find((b) => b.id === id);
  const personalBook = book?.personal ?? null;
  const isInLibrary = !!personalBook;
  const displayAuthor = book ? formatAuthorName(book.author) : '';

  if (!book) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: '#E6EDF3' }}>Книга не найдена</h2>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            background: '#2A4B60',
            border: 'none',
            borderRadius: '8px',
            color: '#E6EDF3',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Вернуться в библиотеку
        </button>
      </div>
    );
  }

  const handleAddToLibrary = (status: PersonalBookStatus) => {
    addToMyLibrary(book.id, status);
    setIsAddModalOpen(false);

    // ===== ТРЕКИНГ: НАЧАЛО ЧТЕНИЯ =====
    if (status === 'reading') {
      trackReadingStart(book.id, {
        title: book.title,
        author: book.author,
      });
    }
    // ==================================
  };

  const handleRemoveFromLibrary = () => {
    // ===== ТРЕКИНГ: ЗАВЕРШЕНИЕ ЧТЕНИЯ =====
    if (personalBook?.status === 'reading') {
      trackReadingFinish(book.id, 0);
    }
    // ======================================

    removeFromMyLibrary(book.id);
  };

  const handleTagClick = (type: 'genre' | 'theme', value: string) => {
    navigate(`/?${type}=${encodeURIComponent(value)}`);
  };

  // ===== ЗАМЕТКИ (временная заглушка) =====
  const handleSaveNote = (text: string) => {
    if (text.trim()) {
      trackNote(book.id, text.trim());
      console.log('📝 Заметка сохранена локально:', text);
    }
  };
  // ========================================

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'none',
          border: 'none',
          color: '#5B86A1',
          cursor: 'pointer',
          fontSize: '16px',
          marginBottom: '32px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        ← Назад в библиотеку
      </button>

      {/* ДВЕ КОЛОНКИ */}
      <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start' }}>
        {/* ЛЕВАЯ КОЛОНКА — ИНФОРМАЦИЯ */}
        <div style={{ flex: '1' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '400', color: '#E6EDF3', marginBottom: '8px' }}>
            {book.title}
          </h1>

          {book.subtitle && (
            <h2 style={{ fontSize: '20px', fontWeight: '300', color: '#97A6BA', marginBottom: '6px' }}>
              {book.subtitle}
            </h2>
          )}

          <div style={{ marginBottom: '16px' }}>
            {book.authorId ? (
              <span
                onClick={() => navigate(`/authors/${book.authorId}`)}
                style={{ fontSize: '18px', color: '#5B86A1', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#7BA5C1'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#5B86A1'}
              >
                ✍️ {displayAuthor}
              </span>
            ) : (
              <p style={{ fontSize: '18px', color: '#97A6BA', margin: 0 }}>✍️ {displayAuthor}</p>
            )}
          </div>

          {/* Метаданные — компактный блок */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '20px',
            padding: '12px 16px', background: 'rgba(18,28,36,0.4)', borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
            {book.originalYear && (
              <div>
                <div style={{ fontSize: '11px', color: '#5B86A1', marginBottom: '2px' }}>Год</div>
                <div style={{ fontSize: '14px', color: '#E6EDF3' }}>{book.originalYear}</div>
              </div>
            )}
            {book.authorCountry && (
              <div>
                <div style={{ fontSize: '11px', color: '#5B86A1', marginBottom: '2px' }}>Страна</div>
                <div style={{ fontSize: '14px', color: '#E6EDF3' }}>{book.authorCountry}</div>
              </div>
            )}
            {book.totalPages > 0 && (
              <div>
                <div style={{ fontSize: '11px', color: '#5B86A1', marginBottom: '2px' }}>Страниц</div>
                <div style={{ fontSize: '14px', color: '#E6EDF3' }}>{book.totalPages}</div>
              </div>
            )}
            {book.originalLanguage && (
              <div>
                <div style={{ fontSize: '11px', color: '#5B86A1', marginBottom: '2px' }}>Язык</div>
                <div style={{ fontSize: '14px', color: '#E6EDF3' }}>{book.originalLanguage}</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: '11px', color: '#5B86A1', marginBottom: '2px' }}>Обложка</div>
              <div style={{ fontSize: '14px', color: '#E6EDF3' }}>{book.cover ? '✓ Есть' : '—'}</div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <p style={{
              color: book.description ? '#97A6BA' : '#5B86A1',
              lineHeight: '1.8',
              fontSize: '15px',
              whiteSpace: 'pre-wrap',
              fontStyle: book.description ? 'normal' : 'italic',
            }}>
              {book.description || 'Описание пока отсутствует'}
            </p>
          </div>

          {book.series && (
            <p style={{ fontSize: '14px', color: '#5B86A1', marginBottom: '16px' }}>
              📚 {book.series} {book.seriesPosition ? `• Книга ${book.seriesPosition}` : ''}
            </p>
          )}

          {/* Жанры */}
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '14px', color: '#5B86A1', marginBottom: '8px', fontWeight: '400' }}>Жанры</h3>
            {book.genres && book.genres.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {book.genres.map((genre) => (
                  <span
                    key={genre}
                    style={{
                      padding: '4px 14px',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '20px',
                      fontSize: '13px',
                      color: '#97A6BA',
                      border: '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleTagClick('genre', genre)}
                  >
                    {genre}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#5B86A1', fontStyle: 'italic' }}>
                Жанры пока не определены
              </p>
            )}
          </div>

          {/* Темы */}
          {book.themes && book.themes.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h3 style={{ fontSize: '14px', color: '#5B86A1', marginBottom: '8px', fontWeight: '400' }}>Темы</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {book.themes.map((theme) => (
                  <span
                    key={theme}
                    style={{
                      padding: '4px 14px',
                      background: 'rgba(251, 191, 36, 0.08)',
                      borderRadius: '20px',
                      fontSize: '13px',
                      color: '#FBBF24',
                      border: '1px solid rgba(251, 191, 36, 0.15)',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleTagClick('theme', theme)}
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* БЛОКИ ТОЛЬКО ДЛЯ АВТОРИЗОВАННЫХ ПОЛЬЗОВАТЕЛЕЙ */}
          {/* ============================================ */}

          {isInLibrary && (
            <div style={{ marginTop: '24px' }}>
              {/* Моё взаимодействие */}
              <div style={{ margin: 0 }}>
                <h3 style={{ fontSize: '14px', color: '#5B86A1', marginBottom: '12px', fontWeight: '400' }}>
                  Моё взаимодействие
                </h3>
                <div
                  style={{
                    background: 'rgba(18, 28, 36, 0.4)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    padding: '16px 20px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#5B86A1' }}>Статус</div>
                      <div style={{ fontSize: '14px', color: '#E6EDF3' }}>
                        {personalBook?.status === 'reading' && '📖 Читаю'}
                        {personalBook?.status === 'planned' && '📚 На полке'}
                        {personalBook?.status === 'completed' && '✅ Завершено'}
                        {personalBook?.status === 'postponed' && '⏸ Отложено'}
                        {personalBook?.status === 'abandoned' && '❌ Брошено'}
                      </div>
                    </div>
                    {personalBook?.startedAt && (
                      <div>
                        <div style={{ fontSize: '11px', color: '#5B86A1' }}>Начато</div>
                        <div style={{ fontSize: '14px', color: '#E6EDF3' }}>
                          {new Date(personalBook.startedAt).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    )}
                    {personalBook?.completedAt && (
                      <div>
                        <div style={{ fontSize: '11px', color: '#5B86A1' }}>Завершено</div>
                        <div style={{ fontSize: '14px', color: '#E6EDF3' }}>
                          {new Date(personalBook.completedAt).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    )}
                    {personalBook?.rereadCount !== undefined && personalBook.rereadCount > 0 && (
                      <div>
                        <div style={{ fontSize: '11px', color: '#5B86A1' }}>Прочтений</div>
                        <div style={{ fontSize: '14px', color: '#E6EDF3' }}>
                          {personalBook.rereadCount}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Vibe (вайбы) */}
              {book.vibe && book.vibe.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h3 style={{ fontSize: '14px', color: '#5B86A1', marginBottom: '8px', fontWeight: '400' }}>Вайб</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {book.vibe.map((vibe) => (
                      <span
                        key={vibe}
                        style={{
                          padding: '4px 14px',
                          background: 'rgba(91, 134, 161, 0.08)',
                          borderRadius: '20px',
                          fontSize: '13px',
                          color: '#5B86A1',
                          border: '1px solid rgba(91, 134, 161, 0.15)',
                        }}
                      >
                        {vibe}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Мотивы */}
              {book.motifs && book.motifs.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h3 style={{ fontSize: '14px', color: '#5B86A1', marginBottom: '8px', fontWeight: '400' }}>Мотивы</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {book.motifs.map((motif) => (
                      <span
                        key={motif}
                        style={{
                          padding: '4px 14px',
                          background: 'rgba(236, 72, 153, 0.08)',
                          borderRadius: '20px',
                          fontSize: '13px',
                          color: '#EC4899',
                          border: '1px solid rgba(236, 72, 153, 0.15)',
                        }}
                      >
                        {motif}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Настроение */}
              {book.mood && book.mood.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h3 style={{ fontSize: '14px', color: '#5B86A1', marginBottom: '8px', fontWeight: '400' }}>Настроение</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {book.mood.map((mood) => (
                      <span
                        key={mood}
                        style={{
                          padding: '4px 14px',
                          background: 'rgba(168, 85, 247, 0.08)',
                          borderRadius: '20px',
                          fontSize: '13px',
                          color: '#A855F7',
                          border: '1px solid rgba(168, 85, 247, 0.15)',
                        }}
                      >
                        {mood}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ПРАВАЯ КОЛОНКА — ОБЛОЖКА И КНОПКИ */}
        <div style={{ flex: '0 0 280px' }}>
          <div
            style={{
              width: '100%',
              aspectRatio: '2/3',
              background: 'linear-gradient(135deg, #1A2832, #0F1A22)',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            {book.cover ? (
              <img
                src={book.cover}
                alt={book.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '64px',
                  opacity: 0.3,
                  color: '#5B86A1',
                }}
              >
                📖
              </div>
            )}
          </div>

          {/* Кнопки управления */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
            {isInLibrary ? (
              <button
                onClick={handleRemoveFromLibrary}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: 'rgba(239, 83, 80, 0.2)',
                  border: '1px solid rgba(239, 83, 80, 0.3)',
                  borderRadius: '8px',
                  color: '#EF5350',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '500',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 83, 80, 0.3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 83, 80, 0.2)'; }}
              >
                ✕ Убрать из библиотеки
              </button>
            ) : (
              <button
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: '#5B86A1',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#0A1118',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                + В библиотеку
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== ЧИТАЛКА И ЗАМЕТКИ ===== */}
      <div style={{ marginTop: '32px' }}>
        <h3 style={{ fontSize: '14px', color: '#5B86A1', marginBottom: '8px', fontWeight: '400' }}>Чтение внутри Syverro</h3>
        <div
          style={{
            background: 'rgba(18, 28, 36, 0.4)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '16px 20px',
            color: '#5B86A1',
            fontSize: '14px',
          }}
        >
          Функция находится в разработке
        </div>
      </div>

      {/* ===== ЗАМЕТКИ ===== */}
      <div style={{ marginTop: '16px', marginBottom: '40px' }}>
        <h3 style={{ fontSize: '14px', color: '#5B86A1', marginBottom: '8px', fontWeight: '400' }}>Мои заметки</h3>
        <div
          style={{
            background: 'rgba(18, 28, 36, 0.4)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '16px 20px',
          }}
        >
          <textarea
            placeholder="Напишите заметку о книге..."
            style={{
              width: '100%',
              minHeight: '80px',
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '12px',
              color: '#E6EDF3',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              resize: 'vertical',
            }}
            onBlur={(e) => {
              const text = e.target.value;
              if (text.trim()) {
                handleSaveNote(text);
                e.target.value = '';
              }
            }}
          />
          <div style={{ fontSize: '12px', color: '#5B86A1', marginTop: '8px' }}>
            Заметка сохранится локально и синхронизируется при подключении к интернету
          </div>
        </div>
      </div>

      {/* Модалки */}
      <AddToLibraryModal
        isOpen={isAddModalOpen}
        bookTitle={book.title}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddToLibrary}
      />
    </div>
  );
}

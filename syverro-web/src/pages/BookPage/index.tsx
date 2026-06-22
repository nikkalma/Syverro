// src/pages/BookPage/index.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLibrary } from '../../hooks/useLibrary';
import { storageService } from '../../services/storageService';
import { userBookService } from '../../services/userBookService';
import { EditModal } from './EditModal';
import { AddToLibraryModal } from './AddToLibraryModal';
import type { UserBookStatus } from '../../types/userBook';

const CURRENT_USER_ID = 'user_1';

export default function BookPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { books, loadBooks } = useLibrary();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const book = books.find((b) => b.id === id);
  const isInLibrary = book ? !!userBookService.getByBook(CURRENT_USER_ID, book.id) : false;

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

  const handleEditSave = (data: Partial<typeof book>) => {
    const updated = { ...book, ...data };
    storageService.updateGlobalBook(updated);
    loadBooks();
    setIsEditModalOpen(false);
  };

  const handleAddToLibrary = (status: UserBookStatus) => {
    userBookService.add(CURRENT_USER_ID, book.id, status);
    setIsAddModalOpen(false);
    loadBooks();
  };

  const handleRemoveFromLibrary = () => {
    userBookService.remove(CURRENT_USER_ID, book.id);
    loadBooks();
  };

  const userBook = userBookService.getByBook(CURRENT_USER_ID, book.id);

  // Фильтрация по тегу
  const handleTagClick = (type: 'genre' | 'theme', value: string) => {
    navigate(`/?${type}=${encodeURIComponent(value)}`);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Назад */}
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
        {/* ЛЕВАЯ КОЛОНКА — 70% */}
        <div style={{ flex: '0 0 70%', maxWidth: '70%' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '400', color: '#E6EDF3', marginBottom: '12px' }}>
            {book.title}
          </h1>

          {book.subtitle && (
            <h2 style={{ fontSize: '20px', fontWeight: '300', color: '#97A6BA', marginBottom: '6px' }}>
              {book.subtitle}
            </h2>
          )}

          <p style={{ fontSize: '18px', color: '#97A6BA', marginBottom: '12px' }}>{book.author}</p>

          {book.series && (
            <p style={{ fontSize: '14px', color: '#5B86A1', marginBottom: '10px' }}>
              {book.series} {book.seriesPosition ? `• Книга ${book.seriesPosition}` : ''}
            </p>
          )}

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '14px', color: '#97A6BA', marginBottom: '12px' }}>
            {book.originalYear && <span>{book.originalYear}</span>}
            {book.authorCountry && <span>{book.authorCountry}</span>}
            {book.totalPages > 0 && <span>{book.totalPages} стр.</span>}
            {book.originalLanguage && <span>{book.originalLanguage}</span>}
          </div>

          {book.description && (
            <div style={{ marginTop: '4px' }}>
              <p style={{
                color: '#97A6BA',
                lineHeight: '1.8',
                fontSize: '15px',
                whiteSpace: 'pre-wrap',
              }}>
                {book.description}
              </p>
            </div>
          )}
        </div>

        {/* ПРАВАЯ КОЛОНКА — 30% (ОБЛОЖКА + КНОПКИ) */}
        <div style={{ flex: '0 0 30%', maxWidth: '30%' }}>
          <div
            style={{
              width: '100%',
              aspectRatio: '2/3',
              background: 'linear-gradient(135deg, #1A2832, #0F1A22)',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.06)',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {isInLibrary ? (
              <>
                {/* Читать — закомментировано, пока закрытая комната */}
                {/*
                <button
                  onClick={() => navigate(`/reader/${book.id}`)}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    background: '#5B86A1',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#0A1118',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  📖 Читать
                </button>
                */}
                <button
                  onClick={handleRemoveFromLibrary}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    background: 'rgba(239, 83, 80, 0.15)',
                    border: '1px solid rgba(239, 83, 80, 0.2)',
                    borderRadius: '8px',
                    color: '#EF5350',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 83, 80, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 83, 80, 0.15)';
                  }}
                >
                  ✕ Убрать из библиотеки
                </button>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: '#97A6BA',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  ✏️ Редактировать
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    background: '#5B86A1',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#0A1118',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  + В библиотеку
                </button>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: '#97A6BA',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  ✏️ Редактировать
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* БЛОКИ НА ВСЮ ШИРИНУ */}
      {/* ============================================ */}

      {/* Жанры */}
      {book.genres && book.genres.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ fontSize: '14px', color: '#5B86A1', marginBottom: '8px' }}>Жанры</h3>
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
        </div>
      )}

      {/* Темы */}
      {book.themes && book.themes.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h3 style={{ fontSize: '14px', color: '#5B86A1', marginBottom: '8px' }}>Темы</h3>
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
        <>
          {/* Моё взаимодействие */}
          <div style={{ marginTop: '32px' }}>
            <h3 style={{ fontSize: '14px', color: '#5B86A1', marginBottom: '12px' }}>
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
                    {userBook?.status === 'reading' && '📖 Читаю'}
                    {userBook?.status === 'shelf' && '📚 На полке'}
                    {userBook?.status === 'completed' && '✅ Завершено'}
                    {userBook?.status === 'paused' && '⏸ Отложено'}
                    {userBook?.status === 'abandoned' && '❌ Брошено'}
                  </div>
                </div>
                {userBook?.startedAt && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#5B86A1' }}>Начато</div>
                    <div style={{ fontSize: '14px', color: '#E6EDF3' }}>
                      {new Date(userBook.startedAt).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                )}
                {userBook?.completedAt && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#5B86A1' }}>Завершено</div>
                    <div style={{ fontSize: '14px', color: '#E6EDF3' }}>
                      {new Date(userBook.completedAt).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                )}
                {userBook?.rereadCount !== undefined && userBook.rereadCount > 0 && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#5B86A1' }}>Прочтений</div>
                    <div style={{ fontSize: '14px', color: '#E6EDF3' }}>
                      {userBook.rereadCount}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vibe (вайбы) */}
          {book.vibe && book.vibe.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h3 style={{ fontSize: '14px', color: '#5B86A1', marginBottom: '8px' }}>Вайб</h3>
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
              <h3 style={{ fontSize: '14px', color: '#5B86A1', marginBottom: '8px' }}>Мотивы</h3>
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
              <h3 style={{ fontSize: '14px', color: '#5B86A1', marginBottom: '8px' }}>Настроение</h3>
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
        </>
      )}

      {/* Читалка (заглушка) */}
      <div style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '14px', color: '#5B86A1', marginBottom: '8px' }}>Чтение внутри Syverro</h3>
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

      {/* Заметки (заглушка) */}
      <div style={{ marginTop: '16px', marginBottom: '40px' }}>
        <h3 style={{ fontSize: '14px', color: '#5B86A1', marginBottom: '8px' }}>Мои заметки</h3>
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

      {/* Модалки */}
      <EditModal
        isOpen={isEditModalOpen}
        book={book}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditSave}
      />

      <AddToLibraryModal
        isOpen={isAddModalOpen}
        bookTitle={book.title}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddToLibrary}
      />
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useAdminStore } from '../../../store/adminStore';


interface BooksFiltersProps {
  onFilterChange: () => void;
}


export default function BooksFilters({ onFilterChange }: BooksFiltersProps) {
  const {
    searchQuery,
    setSearchQuery,
    booksFilters,
    setBooksFilters,
    clearFilters,
  } = useAdminStore();


  const [localSearch, setLocalSearch] = useState(searchQuery);

  const [statusFilter, setStatusFilter] = useState<string>(
    booksFilters.is_published === true
      ? 'published'
      : booksFilters.is_published === false
        ? 'draft'
        : 'all'
  );

  const [genreFilter, setGenreFilter] = useState<string>(
    booksFilters.genre || ''
  );



  // ===== ПРИМЕНЕНИЕ ФИЛЬТРОВ =====

  const applyFilters = () => {
    const newFilters = {
      ...(statusFilter !== 'all'
        ? {
            is_published: statusFilter === 'published',
          }
        : {}),

      ...(genreFilter
        ? {
            genre: genreFilter,
          }
        : {}),
    };


    setBooksFilters(newFilters);

    setSearchQuery(localSearch);

    onFilterChange();
  };



  // ===== СБРОС =====

  const handleClear = () => {
    setLocalSearch('');
    setStatusFilter('all');
    setGenreFilter('');

    clearFilters();

    onFilterChange();
  };



  // ===== ПОИСК =====

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        applyFilters();
      }
    }, 400);


    return () => clearTimeout(timer);
  }, [localSearch]);



  // ===== ФИЛЬТРЫ =====

  useEffect(() => {
    applyFilters();
  }, [statusFilter, genreFilter]);



  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      padding: '16px',
      background: 'rgba(18, 28, 36, 0.4)',
      backdropFilter: 'blur(8px)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.06)',
      alignItems: 'center',
    }}>

      <div style={{ flex: 1, minWidth: '200px' }}>
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="🔍 Поиск по названию, автору..."
          style={{
            width: '100%',
            padding: '8px 14px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            color: '#E6EDF3',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            outline: 'none',
          }}
        />
      </div>


      <div style={{ minWidth: '140px' }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Все статусы</option>
          <option value="published">📗 Опубликованные</option>
          <option value="draft">📕 Черновики</option>
        </select>
      </div>


      <div style={{ minWidth: '140px' }}>
        <input
          type="text"
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          placeholder="🏷️ Фильтр по жанру"
          style={{
            width: '100%',
            padding: '8px 14px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            color: '#E6EDF3',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            outline: 'none',
          }}
        />
      </div>


      <button onClick={handleClear}>
        ✕ Очистить
      </button>


      <div style={{
        color: '#5B86A1',
        fontSize: '13px',
        marginLeft: 'auto',
      }}>
        {
          statusFilter !== 'all' ||
          genreFilter ||
          localSearch
            ? '🔍 Фильтры активны'
            : '📋 Все книги'
        }
      </div>

    </div>
  );
}
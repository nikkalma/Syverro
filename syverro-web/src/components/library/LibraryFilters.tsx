// src/components/library/LibraryFilters.tsx
import { BookStatus, statusLabels } from '../../types/bookEntry';

interface LibraryFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: BookStatus | 'all';
  onStatusChange: (value: BookStatus | 'all') => void;
  genreFilter: string;
  onGenreChange: (value: string) => void;
  availableGenres: string[];
}

export function LibraryFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  genreFilter,
  onGenreChange,
  availableGenres,
}: LibraryFiltersProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '24px',
        padding: '16px',
        background: 'rgba(18, 28, 36, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Поиск */}
      <input
        type="text"
        placeholder="🔍 Поиск по названию или автору..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{
          flex: 1,
          minWidth: '200px',
          padding: '8px 14px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          color: '#E6EDF3',
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          outline: 'none',
          marginBottom: 0,
        }}
      />

      {/* Фильтр по статусу */}
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value as BookStatus | 'all')}
        className="syverro-select"
        style={{ width: 'auto', minWidth: '140px' }}
      >
        <option value="all">Все статусы</option>
        {Object.entries(statusLabels).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      {/* Фильтр по жанру */}
      <select
        value={genreFilter}
        onChange={(e) => onGenreChange(e.target.value)}
        className="syverro-select"
        style={{ width: 'auto', minWidth: '140px' }}
      >
        <option value="all">Все жанры</option>
        {availableGenres.map((genre) => (
          <option key={genre} value={genre}>
            {genre}
          </option>
        ))}
      </select>
    </div>
  );
}
import { UserBookStatus, statusLabels, statusOrder } from '../../types/userBook';
import { getLocaleData, getBrowserLocale } from '../../locales';

interface LibraryControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilters: UserBookStatus[];
  onStatusToggle: (status: UserBookStatus) => void;
  genreFilters: string[];
  onGenreToggle: (genre: string) => void;
  allGenres: string[];
  onClearFilters: () => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export default function LibraryControls({
  searchQuery,
  onSearchChange,
  statusFilters,
  onStatusToggle,
  genreFilters,
  onGenreToggle,
  allGenres,
  onClearFilters,
  viewMode,
  onViewModeChange,
}: LibraryControlsProps) {
  const locale = getBrowserLocale();
  const t = getLocaleData(locale);

  const hasFilters = searchQuery || statusFilters.length > 0 || genreFilters.length > 0;

  return (
    <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder={t.library?.searchPlaceholder || '🔍 Поиск по названию / автору...'}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'rgba(18, 28, 36, 0.6)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              color: '#E6EDF3',
              fontSize: '14px',
              outline: 'none',
              fontFamily: 'Inter, sans-serif',
            }}
          />
        </div>

        <button
          onClick={() => onViewModeChange('grid')}
          style={{
            padding: '8px 16px',
            background: viewMode === 'grid' ? 'rgba(91, 134, 161, 0.2)' : 'transparent',
            border: viewMode === 'grid' ? '1px solid rgba(91, 134, 161, 0.3)' : '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
            color: viewMode === 'grid' ? '#E6EDF3' : '#97A6BA',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {t.library?.grid || '▣ Сетка'}
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          style={{
            padding: '8px 16px',
            background: viewMode === 'list' ? 'rgba(91, 134, 161, 0.2)' : 'transparent',
            border: viewMode === 'list' ? '1px solid rgba(91, 134, 161, 0.3)' : '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
            color: viewMode === 'list' ? '#E6EDF3' : '#97A6BA',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {t.library?.list || '☰ Список'}
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '12px 16px',
          background: 'rgba(18, 28, 36, 0.3)',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {statusOrder.map((status) => (
          <button
            key={status}
            onClick={() => onStatusToggle(status)}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              borderRadius: '20px',
              background: statusFilters.includes(status)
                ? 'rgba(91, 134, 161, 0.25)'
                : 'rgba(255,255,255,0.04)',
              border: statusFilters.includes(status)
                ? '1px solid rgba(91, 134, 161, 0.3)'
                : '1px solid rgba(255,255,255,0.06)',
              color: statusFilters.includes(status) ? '#E6EDF3' : '#97A6BA',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {statusLabels[status]}
          </button>
        ))}

        <span style={{ color: '#2A4B60', margin: '0 4px' }}>|</span>

        {allGenres.slice(0, 8).map((genre) => (
          <button
            key={genre}
            onClick={() => onGenreToggle(genre)}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              borderRadius: '20px',
              background: genreFilters.includes(genre)
                ? 'rgba(91, 134, 161, 0.2)'
                : 'rgba(255,255,255,0.04)',
              border: genreFilters.includes(genre)
                ? '1px solid rgba(91, 134, 161, 0.2)'
                : '1px solid rgba(255,255,255,0.06)',
              color: genreFilters.includes(genre) ? '#E6EDF3' : '#97A6BA',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {genre}
          </button>
        ))}
        {allGenres.length > 8 && (
          <span style={{ fontSize: '12px', color: '#5B86A1' }}>+{allGenres.length - 8}</span>
        )}

        {hasFilters && (
          <button
            onClick={onClearFilters}
            style={{
              marginLeft: 'auto',
              padding: '4px 12px',
              fontSize: '12px',
              color: '#5B86A1',
              background: 'transparent',
              border: '1px solid rgba(91, 134, 161, 0.2)',
              borderRadius: '20px',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {t.library?.clearFilters || 'Сбросить'}
          </button>
        )}
      </div>
    </div>
  );
}
// src/components/LibrarySidebar.tsx
import type { EnrichedBook } from '../types/book';

export interface LibrarySidebarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedMoods: string[];
  setSelectedMoods: (val: string[]) => void;
  selectedVibes: string[];
  setSelectedVibes: (val: string[]) => void;
  selectedThemes: string[];
  setSelectedThemes: (val: string[]) => void;
  selectedGenres: string[];
  setSelectedGenres: (val: string[]) => void;
  selectedCountries: string[];
  setSelectedCountries: (val: string[]) => void;
  selectedCenturies: string[];
  setSelectedCenturies: (val: string[]) => void;
  moodOptions: string[];
  vibeOptions: string[];
  themeOptions: string[];
  allGenres: string[];
  allCountries: string[];
  allCenturies: string[];
  toggleFilter: (item: string, selected: string[], setSelected: (val: string[]) => void) => void;
  handleFindForMe: () => void;
  randomBook: EnrichedBook | null;
  filteredBooks: EnrichedBook[];
}

const FilterGroup = ({ 
  title, 
  items, 
  selected, 
  setSelected, 
  toggleFilter, 
  maxDisplay = 6 
}: { 
  title: string;
  items: string[];
  selected: string[];
  setSelected: (val: string[]) => void;
  toggleFilter: (item: string, selected: string[], setSelected: (val: string[]) => void) => void;
  maxDisplay?: number;
}) => (
  <div>
    <div style={{ fontSize: '11px', color: '#5B86A1', marginBottom: '8px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {title}
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {items.slice(0, maxDisplay).map(item => (
        <span 
          key={item} 
          onClick={() => toggleFilter(item, selected, setSelected)}
          style={{ 
            fontSize: '12px',
            padding: '4px 12px',
            background: selected.includes(item) ? '#5B86A1' : '#121C24',
            border: selected.includes(item) ? '1px solid #5B86A1' : '1px solid #2A4B60',
            borderRadius: '14px',
            color: selected.includes(item) ? '#0A1118' : '#97A6BA',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!selected.includes(item)) {
              e.currentTarget.style.borderColor = '#5B86A1';
              e.currentTarget.style.color = '#E6EDF3';
            }
          }}
          onMouseLeave={(e) => {
            if (!selected.includes(item)) {
              e.currentTarget.style.borderColor = '#2A4B60';
              e.currentTarget.style.color = '#97A6BA';
            }
          }}
        >
          {item}
        </span>
      ))}
      {items.length > maxDisplay && (
        <span style={{ fontSize: '10px', color: '#5B86A1', padding: '4px 8px' }}>
          +{items.length - maxDisplay}
        </span>
      )}
    </div>
  </div>
);

export default function LibrarySidebar({
  searchQuery,
  setSearchQuery,
  selectedMoods,
  setSelectedMoods,
  selectedVibes,
  setSelectedVibes,
  selectedThemes,
  setSelectedThemes,
  selectedGenres,
  setSelectedGenres,
  selectedCountries,
  setSelectedCountries,
  selectedCenturies,
  setSelectedCenturies,
  moodOptions,
  vibeOptions,
  themeOptions,
  allGenres,
  allCountries,
  allCenturies,
  toggleFilter,
  handleFindForMe,
  randomBook,
}: LibrarySidebarProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      padding: '24px 20px',
      width: '100%',
      height: '100%',
      overflowY: 'auto',
    }}>
      <input
        type="text"
        placeholder="🔍 Я найду..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: '#121C24',
          border: '1px solid #2A4B60',
          borderRadius: '12px',
          color: '#E6EDF3',
          fontSize: '15px',
          outline: 'none',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '400'
        }}
      />

      <FilterGroup title="Настроение" items={moodOptions} selected={selectedMoods} setSelected={setSelectedMoods} toggleFilter={toggleFilter} />
      <FilterGroup title="Вайб" items={vibeOptions} selected={selectedVibes} setSelected={setSelectedVibes} toggleFilter={toggleFilter} />
      <FilterGroup title="Темы" items={themeOptions} selected={selectedThemes} setSelected={setSelectedThemes} toggleFilter={toggleFilter} />
      <FilterGroup title="Жанры" items={allGenres} selected={selectedGenres} setSelected={setSelectedGenres} toggleFilter={toggleFilter} />
      <FilterGroup title="Страны" items={allCountries} selected={selectedCountries} setSelected={setSelectedCountries} toggleFilter={toggleFilter} />
      <FilterGroup title="Эпоха" items={allCenturies} selected={selectedCenturies} setSelected={setSelectedCenturies} toggleFilter={toggleFilter} />

      <button
        onClick={handleFindForMe}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: '#5B86A1',
          border: 'none',
          borderRadius: '12px',
          color: '#0A1118',
          fontSize: '15px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontFamily: 'Inter, sans-serif',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#4A7590';
          e.currentTarget.style.transform = 'scale(1.02)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#5B86A1';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        Найди для меня
      </button>

      {randomBook && (
        <div style={{ paddingTop: '20px', borderTop: '1px solid #1A2832' }}>
          <div style={{ 
            fontSize: '13px', 
            color: '#5B86A1', 
            marginBottom: '12px',
            fontWeight: '500', 
            textTransform: 'uppercase', 
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '16px' }}>🎲</span> Игра с судьбой
          </div>
          <div style={{ padding: '12px', background: '#121C24', borderRadius: '12px', border: '1px solid #2A4B60' }}>
            <div style={{ color: '#E6EDF3', fontSize: '14px', fontWeight: '500' }}>{randomBook.title}</div>
            <div style={{ color: '#97A6BA', fontSize: '12px' }}>{randomBook.author}</div>
            <div style={{ marginTop: '8px' }}>
              <span style={{ fontSize: '11px', color: '#5B86A1', padding: '2px 10px', border: '1px solid #2A4B60', borderRadius: '8px', cursor: 'pointer' }}>Открыть</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
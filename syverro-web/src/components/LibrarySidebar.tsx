// src/components/LibrarySidebar.tsx
import { useState } from 'react';
import type { EnrichedBook } from '../types/book';
import { getABTestVariant } from '../utils/abTest';
import { Search, Sparkles, Shuffle, BookOpen, Globe2, Clock, Tag, FolderOpen } from 'lucide-react';

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
  filteredBooks: EnrichedBook[];
  onRandomClick?: () => void;
}

const AccordionGroup = ({
  title,
  items,
  selected,
  setSelected,
  toggleFilter,
  defaultOpen = false,
}: {
  title: string;
  items: string[];
  selected: string[];
  setSelected: (val: string[]) => void;
  toggleFilter: (item: string, selected: string[], setSelected: (val: string[]) => void) => void;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  if (items.length === 0) return null;

  const getIcon = () => {
    switch (title) {
      case 'Настроение': return <Sparkles size={14} />;
      case 'Вайб': return <BookOpen size={14} />;
      case 'Темы': return <Tag size={14} />;
      case 'Жанры': return <FolderOpen size={14} />;
      case 'Страны': return <Globe2 size={14} />;
      case 'Эпоха': return <Clock size={14} />;
      default: return null;
    }
  };

  return (
    <div>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          padding: '4px 0',
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          userSelect: 'none',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {getIcon()}
          {title}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
          {isOpen ? '▾' : '▸'} {items.length}
        </span>
      </div>

      {isOpen && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
          {items.map((item) => (
            <span
              key={item}
              onClick={() => toggleFilter(item, selected, setSelected)}
              style={{
                fontSize: '12px',
                padding: '4px 12px',
                background: selected.includes(item) ? 'var(--primary)' : 'var(--chip)',
                border: selected.includes(item) ? '1px solid var(--primary)' : '1px solid var(--border-soft)',
                borderRadius: '14px',
                color: selected.includes(item) ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

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
  onRandomClick,
}: LibrarySidebarProps) {
  const randomButtonLabel = getABTestVariant(
    'global_random_button',
    'Шагнуть в неизвестность',
    'Скрытый маршрут'
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '24px 20px',
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        background: 'var(--bg)',
      }}
    >
      <div style={{ position: 'relative' }}>
        <Search 
          size={18} 
          style={{ 
            position: 'absolute', 
            left: '14px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }} 
        />
        <input
          type="text"
          placeholder="Я найду..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px 12px 40px',
            background: 'var(--surface-alt)',
            border: '1px solid var(--border-soft)',
            borderRadius: '12px',
            color: 'var(--text-primary)',
            fontSize: '15px',
            outline: 'none',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '400',
          }}
        />
      </div>

      <AccordionGroup
        title="Настроение"
        items={moodOptions}
        selected={selectedMoods}
        setSelected={setSelectedMoods}
        toggleFilter={toggleFilter}
        defaultOpen={false}
      />

      <AccordionGroup
        title="Вайб"
        items={vibeOptions}
        selected={selectedVibes}
        setSelected={setSelectedVibes}
        toggleFilter={toggleFilter}
        defaultOpen={false}
      />

      <AccordionGroup
        title="Темы"
        items={themeOptions}
        selected={selectedThemes}
        setSelected={setSelectedThemes}
        toggleFilter={toggleFilter}
        defaultOpen={true}
      />

      <AccordionGroup
        title="Жанры"
        items={allGenres}
        selected={selectedGenres}
        setSelected={setSelectedGenres}
        toggleFilter={toggleFilter}
        defaultOpen={false}
      />

      <AccordionGroup
        title="Страны"
        items={allCountries}
        selected={selectedCountries}
        setSelected={setSelectedCountries}
        toggleFilter={toggleFilter}
        defaultOpen={false}
      />

      <AccordionGroup
        title="Эпоха"
        items={allCenturies}
        selected={selectedCenturies}
        setSelected={setSelectedCenturies}
        toggleFilter={toggleFilter}
        defaultOpen={false}
      />

      <button
        onClick={handleFindForMe}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'var(--primary)',
          border: 'none',
          borderRadius: '12px',
          color: '#FFFFFF',
          fontSize: '15px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontFamily: 'Inter, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        <Sparkles size={18} />
        Найди для меня
      </button>

      {onRandomClick && (
        <button
          onClick={onRandomClick}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'rgba(91, 134, 161, 0.15)',
            border: '1px solid rgba(91, 134, 161, 0.2)',
            borderRadius: '12px',
            color: 'var(--primary)',
            fontSize: '15px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'Inter, sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Shuffle size={18} />
          {randomButtonLabel}
        </button>
      )}
    </div>
  );
}
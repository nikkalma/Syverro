// src/components/LibrarySidebar.tsx
import { useState } from 'react';
import type { EnrichedBook } from '../types/book';
import { getABTestVariant } from '../utils/abTest';

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

// Компонент группы-аккордеона
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
          color: '#5B86A1',
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          userSelect: 'none',
        }}
      >
        <span>{title}</span>
        <span style={{ fontSize: '10px', color: '#2A4B60' }}>
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
  // A/B тест для кнопки в сайдбаре
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
      }}
    >
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
          fontWeight: '400',
        }}
      />

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

      {onRandomClick && (
        <button
          onClick={onRandomClick}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'rgba(91, 134, 161, 0.15)',
            border: '1px solid rgba(91, 134, 161, 0.2)',
            borderRadius: '12px',
            color: '#5B86A1',
            fontSize: '15px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'Inter, sans-serif',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(91, 134, 161, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(91, 134, 161, 0.15)';
          }}
        >
          🎲 {randomButtonLabel}
        </button>
      )}
    </div>
  );
}
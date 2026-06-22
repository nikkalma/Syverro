// src/hooks/useLibraryFilters.ts
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { EnrichedBook } from '../types/book';

export function useLibraryFilters(books: EnrichedBook[]) {
  const [searchParams] = useSearchParams();

  // Читаем параметры из URL при первом рендере
  const initialGenre = searchParams.get('genre') || '';
  const initialTheme = searchParams.get('theme') || '';
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>(
    initialTheme ? [initialTheme] : []
  );
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    initialGenre ? [initialGenre] : []
  );
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCenturies, setSelectedCenturies] = useState<string[]>([]);

  // Синхронизация с URL при изменении фильтров (опционально)
  // Можно добавить позже, если нужно обновлять URL при клике в сайдбаре

  const getCentury = (year: number | null): string => {
    if (!year) return 'Неизвестно';
    return `${Math.ceil(year / 100)} век`;
  };

  const toggleFilter = (item: string, selected: string[], setSelected: (val: string[]) => void) => {
    setSelected(selected.includes(item) 
      ? selected.filter(i => i !== item) 
      : [...selected, item]
    );
  };

  const moodOptions = ['Уютное', 'Мрачное', 'Меланхоличное', 'Вдохновляющее', 'Тревожное', 'Светлое', 'Напряжённое', 'Философское', 'Медитативное'];
  const vibeOptions = ['Осенний вечер', 'Библиотека ночью', 'Морское путешествие', 'Старый город', 'Космос', 'Академия', 'Дорога', 'Выживание', 'Приключение'];
  const themeOptions = ['Дружба', 'Потеря', 'Взросление', 'Любовь', 'Власть', 'Религия', 'Наука', 'Смерть', 'Искупление'];
  
  const allGenres = Array.from(new Set(books.flatMap(b => b.genres || [])));
  const allCountries = Array.from(new Set(
    books.map(b => b.authorCountry).filter((c): c is string => c !== null && c !== undefined)
  ));
  const allCenturies = Array.from(new Set(books.map(b => getCentury(b.originalYear)).filter(c => c !== 'Неизвестно')));

  const filteredBooks = books.filter(book => {
    if (searchQuery && !book.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !book.author.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedGenres.length > 0 && !book.genres?.some(g => selectedGenres.includes(g))) {
      return false;
    }
    if (selectedThemes.length > 0 && !book.themes?.some(t => selectedThemes.includes(t))) {
      return false;
    }
    if (selectedCountries.length > 0 && !selectedCountries.includes(book.authorCountry || '')) {
      return false;
    }
    if (selectedCenturies.length > 0) {
      const bookCentury = getCentury(book.originalYear);
      if (!selectedCenturies.includes(bookCentury)) return false;
    }
    return true;
  });

  const handleFindForMe = () => {
    const totalSelected = selectedMoods.length + selectedVibes.length + selectedThemes.length + 
                          selectedGenres.length + selectedCountries.length + selectedCenturies.length;
    if (totalSelected === 0 && !searchQuery) {
      alert('Выберите хотя бы один фильтр или введите поисковый запрос');
      return;
    }
    alert(`Найдено ${filteredBooks.length} книг по вашим критериям`);
  };

  return {
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
    filteredBooks,
    toggleFilter,
    handleFindForMe,
  };
}
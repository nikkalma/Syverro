// src/screens/HomeScreen/StatusFilters.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface StatusFiltersProps {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  counts: {
    all: number;
    finished: number;
    reading: number;
    planned: number;
  };
}

export default function StatusFilters({ activeFilter, setActiveFilter, counts }: StatusFiltersProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isDarkMode = theme.mode === 'dark';

  const filters = [
    { key: 'all', label: t('filters.all') || 'Всего', emoji: '📚', count: counts.all },
    { key: 'finished', label: t('filters.finished') || 'Прочитано', emoji: '✅', count: counts.finished },
    { key: 'reading', label: t('filters.reading') || 'Читаю', emoji: '📖', count: counts.reading },
    { key: 'planned', label: t('filters.planned') || 'В планах', emoji: '📅', count: counts.planned },
  ];

  const getStyle = (isActive: boolean) => ({
    flex: 1,
    backgroundColor: isActive ? theme.primary : (isDarkMode ? theme.surface : '#F0E8DC'),
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    borderWidth: isActive ? 0 : 1,
    borderColor: theme.border,
  });

  const getTextStyle = (isActive: boolean) => ({
    color: isActive ? '#FFF' : theme.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  });

  const getLabelStyle = (isActive: boolean) => ({
    color: isActive ? '#FFF' : theme.textSecondary,
    fontSize: 8,
  });

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
      {filters.map(filter => {
        const isActive = activeFilter === filter.key;
        return (
          <TouchableOpacity 
            key={filter.key} 
            onPress={() => setActiveFilter(filter.key)} 
            style={getStyle(isActive)}
            activeOpacity={0.4}
          >
            <Text style={getTextStyle(isActive)}>{filter.count}</Text>
            <Text style={getLabelStyle(isActive)}>
              {filter.emoji} {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
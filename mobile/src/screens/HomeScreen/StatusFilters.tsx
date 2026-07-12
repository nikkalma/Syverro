// src/screens/HomeScreen/StatusFilters.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
  const { theme, mode } = useTheme();  // ✅ ИСПРАВЛЕНО: добавлен mode
  const { t } = useLanguage();
  const isDarkMode = mode === 'dark';

  const filters = [
    { key: 'all', label: t('filters.all') || 'Всего', emoji: '📚', count: counts.all },
    { key: 'finished', label: t('filters.finished') || 'Прочитано', emoji: '✅', count: counts.finished },
    { key: 'reading', label: t('filters.reading') || 'Читаю', emoji: '📖', count: counts.reading },
    { key: 'planned', label: t('filters.planned') || 'В планах', emoji: '📅', count: counts.planned },
  ];

  return (
    <View style={styles.container}>
      {filters.map(filter => {
        const isActive = activeFilter === filter.key;
        return (
          <TouchableOpacity 
            key={filter.key} 
            onPress={() => setActiveFilter(filter.key)} 
            style={[
              styles.filterButton,
              { 
                backgroundColor: isActive ? theme.primary : (isDarkMode ? theme.surface : '#F0E8DC'),
                borderColor: theme.border,
                borderWidth: isActive ? 0 : 1,
              }
            ]}
            activeOpacity={0.4}
          >
            <Text style={[
              styles.countText,
              { color: isActive ? '#FFF' : theme.textPrimary }
            ]}>
              {filter.count}
            </Text>
            <Text style={[
              styles.labelText,
              { color: isActive ? '#FFF' : theme.textSecondary }
            ]}>
              {filter.emoji} {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
  },
  countText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  labelText: {
    fontSize: 8,
  },
});
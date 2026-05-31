import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function StatusFilters({ activeFilter, setActiveFilter, counts, lang }) {
  const { theme } = useTheme();
  const isDarkMode = theme.mode === 'dark';

  const filters = [
    { key: 'all', label: lang.counters?.total || 'Всего', emoji: '', count: counts.all },
    { key: 'finished', label: lang.counters?.finished || 'Прочитано', emoji: '✅', count: counts.finished },
    { key: 'reading', label: lang.counters?.reading || 'Читаю', emoji: '📖', count: counts.reading },
    { key: 'planned', label: lang.counters?.planned || 'В планах', emoji: '📅', count: counts.planned },
  ];

  const getStyle = (activeBookId) => {
    if (activeBookId) {
      return {
        flex: 1,
        backgroundColor: theme.primary,
        borderRadius: 10,
        padding: 8,
        alignItems: 'center',
      };
    }
    return {
      flex: 1,
      backgroundColor: isDarkMode ? theme.surface : '#F0E8DC',
      borderRadius: 10,
      padding: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    };
  };

  const getTextStyle = (activeBookId) => ({
    color: activeBookId ? '#FFF' : theme.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  });

  const getLabelStyle = (activeBookId) => ({
    color: activeBookId ? '#FFF' : theme.textSecondary,
    fontSize: 8,
  });

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
      {filters.map(filter => {
        const activeBookId = activeFilter === filter.key;
        return (
          <TouchableOpacity 
            key={filter.key} 
            onPress={() => setActiveFilter(filter.key)} 
            style={getStyle(activeBookId)}
          activeOpacity={0.4}
          >
            <Text style={getTextStyle(activeBookId)}>{filter.count}</Text>
            <Text style={getLabelStyle(activeBookId)}>
              {filter.emoji} {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
// src/screens/HomeScreen/SortModal.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface SortModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
}

export default function SortModal({ visible, setVisible, sortBy, setSortBy }: SortModalProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const sortOptions = [
    { key: 'date', label: t('sort.byDate') || 'По дате добавления', icon: '📅' },
    { key: 'title', label: t('sort.byTitle') || 'По названию', icon: '🔤' },
    { key: 'author', label: t('sort.byAuthor') || 'По автору', icon: '👤' },
    { key: 'rating', label: t('sort.byRating') || 'По оценке', icon: '⭐' },
  ];

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 20 }}>
          <Text style={{ color: theme.textPrimary, fontSize: 18, marginBottom: 16, textAlign: 'center' }}>
            {t('sort.title') || 'Сортировать по'}
          </Text>
          {sortOptions.map(option => (
            <TouchableOpacity 
              key={option.key} 
              onPress={() => {
                setSortBy(option.key);
                setVisible(false);
              }}
              style={{ 
                paddingVertical: 12, 
                borderBottomWidth: 1, 
                borderBottomColor: theme.border,
                backgroundColor: sortBy === option.key ? theme.primary + '20' : 'transparent',
                borderRadius: 8,
                paddingHorizontal: 12,
                marginBottom: 4,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
              activeOpacity={0.4}
            >
              <Text style={{ fontSize: 18 }}>{option.icon}</Text>
              <Text style={{ 
                color: sortBy === option.key ? theme.primary : theme.textPrimary,
                fontWeight: sortBy === option.key ? 'bold' : 'normal',
              }}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity 
            onPress={() => setVisible(false)} 
            style={{ marginTop: 16, padding: 12, backgroundColor: theme.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}
            activeOpacity={0.4}
          >
            <Text style={{ color: theme.textPrimary, textAlign: 'center' }}>{t('buttons.cancel') || 'Отмена'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
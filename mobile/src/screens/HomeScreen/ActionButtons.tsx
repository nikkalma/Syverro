// src/screens/HomeScreen/ActionButtons.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface ActionButtonsProps {
  showSearch: boolean;
  setShowSearch: (show: boolean) => void;
  showAddForm: boolean;
  setShowAddForm: (show: boolean) => void;
  setSortModalVisible: (visible: boolean) => void;
}

export default function ActionButtons({ 
  showSearch, 
  setShowSearch, 
  showAddForm, 
  setShowAddForm, 
  setSortModalVisible 
}: ActionButtonsProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 12, gap: 12 }}>
      <TouchableOpacity 
        onPress={() => setShowSearch(!showSearch)} 
        style={{ backgroundColor: showSearch ? theme.primary : theme.surface, padding: 10, borderRadius: 30, width: 44, alignItems: 'center' }}
        activeOpacity={0.4}
      >
        <Text style={{ fontSize: 20 }}>🔍</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => setShowAddForm(!showAddForm)} 
        style={{ backgroundColor: showAddForm ? theme.primary : theme.surface, padding: 10, borderRadius: 30, width: 44, alignItems: 'center' }}
        activeOpacity={0.4}
      >
        <Text style={{ fontSize: 20 }}>➕</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => setSortModalVisible(true)} 
        style={{ backgroundColor: theme.surface, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 30, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        activeOpacity={0.4}
      >
        <Text style={{ fontSize: 16 }}>🔽</Text>
        <Text style={{ color: theme.textPrimary, fontSize: 13 }}>{t('sort.button') || 'Сортировать'}</Text>
      </TouchableOpacity>
    </View>
  );
}
// src/components/AuthorSelector.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface AuthorSelectorProps {
  selectedAuthor?: string;
  onAuthorChange: (author: string) => void;
  authorsList?: string[];
}

export default function AuthorSelector({ selectedAuthor = '', onAuthorChange, authorsList = [] }: AuthorSelectorProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const [newAuthor, setNewAuthor] = useState('');

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>{t('fields.author') || 'Автор'}</Text>
      
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={{ padding: 12, borderRadius: 12, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }}
      >
        <Text style={{ color: selectedAuthor ? theme.textPrimary : theme.textSecondary }}>
          {selectedAuthor || (t('author.selectButton') || 'Выбрать автора')}
        </Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 20, maxHeight: '80%' }}>
            <Text style={{ color: theme.textPrimary, fontSize: 18, marginBottom: 16, textAlign: 'center' }}>
              {t('author.modalTitle') || 'Выберите автора'}
            </Text>
            
            {authorsList.filter(Boolean).length > 0 ? (
              <FlatList
                data={authorsList.filter(Boolean)}
                keyExtractor={(item, index) => item || index.toString()}
                style={{ maxHeight: 250 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      onAuthorChange(item);
                      setModalVisible(false);
                    }}
                    style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}
                  >
                    <Text style={{ color: theme.textPrimary }}>{item || ''}</Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: theme.textSecondary }}>{t('author.noAuthors') || 'Нет авторов'}</Text>
              </View>
            )}
            
            <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
              <TextInput
                placeholder={t('author.newAuthorPlaceholder') || 'Новый автор'}
                placeholderTextColor={theme.textSecondary}
                value={newAuthor}
                onChangeText={setNewAuthor}
                style={{ flex: 1, backgroundColor: theme.background, color: theme.textPrimary, padding: 12, borderRadius: 8 }}
              />
              <TouchableOpacity
                onPress={() => {
                  if (newAuthor && newAuthor.trim()) {
                    onAuthorChange(newAuthor.trim());
                    setNewAuthor('');
                    setModalVisible(false);
                  }
                }}
                style={{ padding: 12, backgroundColor: theme.primary, borderRadius: 8 }}
              >
                <Text style={{ color: '#FFF' }}>{t('common.add') || 'Добавить'}</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{ marginTop: 16, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}
            >
              <Text style={{ color: theme.textPrimary, textAlign: 'center' }}>{t('common.cancel') || 'Отмена'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
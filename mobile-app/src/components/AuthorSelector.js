import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function AuthorSelector({ selectedAuthor = '', onAuthorChange, authorsList = [], lang }) {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [newAuthor, setNewAuthor] = useState('');

  const strings = {
    ru: { label: 'Автор', selectButton: 'Выбрать автора', modalTitle: 'Выберите автора', newAuthorPlaceholder: 'Новый автор', addButton: 'Добавить', cancel: 'Отмена' },
    en: { label: 'Author', selectButton: 'Select author', modalTitle: 'Select author', newAuthorPlaceholder: 'New author', addButton: 'Add', cancel: 'Cancel' },
    by: { label: 'Аўтар', selectButton: 'Выбраць аўтара', modalTitle: 'Абярыце аўтара', newAuthorPlaceholder: 'Новы аўтар', addButton: 'Дадаць', cancel: 'Адмена' },
    ua: { label: 'Автор', selectButton: 'Вибрати автора', modalTitle: 'Виберіть автора', newAuthorPlaceholder: 'Новий автор', addButton: 'Додати', cancel: 'Скасувати' }
  };

  const t = strings[lang] || strings.ru;

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>{t.label}</Text>
      
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={{ padding: 12, borderRadius: 12, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }}
      >
        <Text style={{ color: selectedAuthor ? theme.textPrimary : theme.textSecondary }}>
          {selectedAuthor || t.selectButton}
        </Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 20, maxHeight: '80%' }}>
            <Text style={{ color: theme.textPrimary, fontSize: 18, marginBottom: 16, textAlign: 'center' }}>{t.modalTitle}</Text>
            
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
                <Text style={{ color: theme.textSecondary }}>Нет авторов</Text>
              </View>
            )}
            
            <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
              <TextInput
                placeholder={t.newAuthorPlaceholder}
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
                <Text style={{ color: '#FFF' }}>{t.addButton}</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{ marginTop: 16, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}
            >
              <Text style={{ color: theme.textPrimary, textAlign: 'center' }}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const PREDEFINED_GENRES = [
  'Фантастика', 'Детектив', 'Роман', 'Поэзия', 'Биография',
  'Научпоп', 'История', 'Философия', 'Триллер', 'Ужасы',
  'Фэнтези', 'Приключения', 'Драма', 'Комедия', 'Саморазвитие'
];

export default function GenreSelector({ selectedGenres = [], onGenresChange, lang }) {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [customGenres, setCustomGenres] = useState([]);
  const allGenres = [...PREDEFINED_GENRES, ...customGenres];

  const toggleGenre = (genre) => {
    if (!genre) return;
    if (selectedGenres.includes(genre)) {
      onGenresChange(selectedGenres.filter(g => g !== genre));
    } else {
      onGenresChange([...selectedGenres, genre]);
    }
    setModalVisible(false);
  };

  const addCustomGenre = (genre) => {
    if (genre && !allGenres.includes(genre)) {
      setCustomGenres([...customGenres, genre]);
      onGenresChange([...selectedGenres, genre]);
    }
    setModalVisible(false);
  };

  const strings = {
    ru: { title: 'Жанры', addButton: '+ Добавить жанр', modalTitle: 'Выберите жанры', customPlaceholder: 'Свой жанр', add: 'Добавить', cancel: 'Отмена' },
    en: { title: 'Genres', addButton: '+ Add genre', modalTitle: 'Select genres', customPlaceholder: 'Custom genre', add: 'Add', cancel: 'Cancel' },
    by: { title: 'Жанры', addButton: '+ Дадаць жанр', modalTitle: 'Абярыце жанры', customPlaceholder: 'Свой жанр', add: 'Дадаць', cancel: 'Адмена' },
    ua: { title: 'Жанри', addButton: '+ Додати жанр', modalTitle: 'Виберіть жанри', customPlaceholder: 'Свій жанр', add: 'Додати', cancel: 'Скасувати' }
  };

  const t = strings[lang] || strings.en;

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: theme.textPrimary, fontSize: 16, marginBottom: 8 }}>{t.title}</Text>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        {selectedGenres.filter(Boolean).map(genre => (
          <TouchableOpacity
            key={genre}
            onPress={() => onGenresChange(selectedGenres.filter(g => g !== genre))}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: theme.primary }}
          >
            <Text style={{ color: '#FFF' }}>{genre} ✕</Text>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed' }}
        >
          <Text style={{ color: theme.primary }}>{t.addButton}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 20, maxHeight: '80%' }}>
            <Text style={{ color: theme.textPrimary, fontSize: 18, marginBottom: 16, textAlign: 'center' }}>{t.modalTitle}</Text>
            
            <FlatList
              data={allGenres.filter(Boolean)}
              keyExtractor={(item, index) => item || index.toString()}
              style={{ maxHeight: 300 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => toggleGenre(item)}
                  style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}
                >
                  <Text style={{ color: theme.textPrimary, fontSize: 16 }}>{item || ''}</Text>
                </TouchableOpacity>
              )}
            />
            
            <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
              <TextInput
                placeholder={t.customPlaceholder}
                placeholderTextColor={theme.textSecondary}
                onSubmitEditing={(e) => addCustomGenre(e.nativeEvent.text)}
                style={{ flex: 1, backgroundColor: theme.background, color: theme.textPrimary, padding: 12, borderRadius: 8 }}
              />
            </View>
            
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 16, padding: 12, backgroundColor: theme.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
              <Text style={{ color: theme.textPrimary, textAlign: 'center' }}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
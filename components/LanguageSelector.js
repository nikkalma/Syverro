import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const PREDEFINED_LANGUAGES = ['Русский', 'English', 'Беларуская', 'Українська', 'Français', 'Deutsch', 'Español', 'Italiano', 'Polski', 'Čeština'];

export default function LanguageSelector({ selectedLanguages = [], onLanguagesChange, lang }) {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [customLanguages, setCustomLanguages] = useState([]);
  const allLanguages = [...PREDEFINED_LANGUAGES, ...customLanguages];

  const toggleLanguage = (language) => {
    if (!language) return;
    if (selectedLanguages.includes(language)) {
      onLanguagesChange(selectedLanguages.filter(l => l !== language));
    } else {
      onLanguagesChange([...selectedLanguages, language]);
    }
    setModalVisible(false);
  };

  const addCustomLanguage = (language) => {
    if (language && !allLanguages.includes(language)) {
      setCustomLanguages([...customLanguages, language]);
      onLanguagesChange([...selectedLanguages, language]);
    }
    setModalVisible(false);
  };

  const strings = {
    ru: { title: 'Язык прочтения', addButton: '+ Добавить язык', modalTitle: 'Выберите язык', customPlaceholder: 'Свой вариант', add: 'Добавить', cancel: 'Отмена' },
    en: { title: 'Reading Language', addButton: '+ Add language', modalTitle: 'Select language', customPlaceholder: 'Custom', add: 'Add', cancel: 'Cancel' },
    by: { title: 'Мова чытання', addButton: '+ Дадаць мову', modalTitle: 'Абярыце мову', customPlaceholder: 'Свой варыянт', add: 'Дадаць', cancel: 'Адмена' },
    ua: { title: 'Мова прочитання', addButton: '+ Додати мову', modalTitle: 'Виберіть мову', customPlaceholder: 'Свій варіант', add: 'Додати', cancel: 'Скасувати' }
  };

  const t = strings[lang] || strings.en;

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: theme.textPrimary, fontSize: 16, marginBottom: 8 }}>{t.title}</Text>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        {selectedLanguages.filter(Boolean).map(language => (
          <TouchableOpacity
            key={language}
            onPress={() => onLanguagesChange(selectedLanguages.filter(l => l !== language))}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: theme.primary }}
          >
            <Text style={{ color: '#FFF' }}>{language} ✕</Text>
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
              data={allLanguages.filter(Boolean)}
              keyExtractor={(item, index) => item || index.toString()}
              style={{ maxHeight: 300 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => toggleLanguage(item)}
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
                onSubmitEditing={(e) => addCustomLanguage(e.nativeEvent.text)}
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
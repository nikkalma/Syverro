import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import useStore from '../store';
import CompactThemeSwitcher from '../components/CompactThemeSwitcher';
import STRINGS from '../locales';

export default function CustomDrawerContent({ navigation, lang, setLocale, locale }) {
  const { theme } = useTheme();
  const { importBooksFromSheets } = useStore();
  const [langModalVisible, setLangModalVisible] = useState(false);
  
  const handleImport = async () => {
    Alert.alert(
      'Подтверждение импорта',
      'Импорт заменит все текущие книги на данные из таблицы. Ваши ручные изменения будут потеряны. Продолжить?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Импортировать', 
          onPress: async () => {
            Alert.alert('Импорт', 'Загружаю книги...');
            const result = await importBooksFromSheets();
            if (result.success) {
              Alert.alert('Готово!', `Импортировано ${result.count} книг`);
            } else {
              Alert.alert('Ошибка', result.error);
            }
          }
        }
      ]
    );
  };
  
  const languageNames = {
    be: 'Беларуская',
    de: 'Deutsch',
    en: 'English',
    fr: 'Français',
    it: 'Italiano',
    ja: '日本語',
    ko: '한국어',
    pl: 'Polski',
    ru: 'Русский',
    ua: 'Українська',
  };
  
  return (
    <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: 50, paddingHorizontal: 16 }}>
      <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>📚 Syverro</Text>
      
      <TouchableOpacity 
        onPress={() => {
          navigation.closeDrawer();
          navigation.navigate('Profile');
        }}
        style={{ 
          paddingVertical: 8,
          paddingHorizontal: 12,
          backgroundColor: theme.surface, 
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.border,
          marginBottom: 12,
        }}
        activeOpacity={0.7}
      >
        <Text style={{ color: theme.textPrimary, fontSize: 15 }}>👤 {lang.menu.profile}</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => {
          navigation.closeDrawer();
          navigation.navigate('Stats');
        }}
        style={{ 
          paddingVertical: 8,
          paddingHorizontal: 12,
          backgroundColor: theme.surface, 
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.border,
          marginBottom: 12,
        }}
        activeOpacity={0.7}
      >
        <Text style={{ color: theme.textPrimary, fontSize: 15 }}>📊 {lang.menu.stats}</Text>
      </TouchableOpacity>
      
            <TouchableOpacity 
        onPress={() => {
          navigation.closeDrawer();
          navigation.navigate('Achievements');
        }}
        style={{ 
          paddingVertical: 8,
          paddingHorizontal: 12,
          backgroundColor: theme.surface, 
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.border,
          marginBottom: 24,
        }}
      >
        <Text style={{ color: theme.textPrimary, fontSize: 15 }}>🏆 {lang.menu.achievements}</Text>
      </TouchableOpacity>

      <View style={{ flex: 1 }} />
      
      <CompactThemeSwitcher lang={lang} />
      
      <TouchableOpacity 
        onPress={() => setLangModalVisible(true)}
        style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          paddingVertical: 8,
          paddingHorizontal: 12,
          backgroundColor: theme.surface, 
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.border,
          marginTop: 12,
        }}
        activeOpacity={0.7}
      >
        <Text style={{ color: theme.textPrimary, fontSize: 13 }}>🌐 {languageNames[locale] || locale}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 10 }}>▼</Text>
      </TouchableOpacity>
      
      {/* ===== КНОПКА ИМПОРТА (только Dev) ===== */}
      {__DEV__ && (
        <TouchableOpacity 
          onPress={handleImport}
          style={{ 
            paddingVertical: 8,
            paddingHorizontal: 12,
            backgroundColor: theme.surface, 
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            marginTop: 12,
          }}
          activeOpacity={0.7}
        >
          <Text style={{ color: theme.textPrimary, fontSize: 13 }}>📥 Импорт (Dev)</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity 
        onPress={() => {
          navigation.closeDrawer();
          navigation.navigate('About');
        }}
        style={{ 
          paddingVertical: 8,
          paddingHorizontal: 12,
          backgroundColor: theme.surface, 
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.border,
          marginTop: 12,
          marginBottom: 20,
        }}
        activeOpacity={0.7}
      >
        <Text style={{ color: theme.textPrimary, fontSize: 13 }}>ℹ️ {lang.menu.about}</Text>
      </TouchableOpacity>
      
      <Modal visible={langModalVisible} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 20 }}>
            <Text style={{ color: theme.textPrimary, fontSize: 18, marginBottom: 16, textAlign: 'center' }}>Выберите язык</Text>
            {Object.keys(STRINGS).map(loc => (
              <TouchableOpacity 
                key={loc} 
                onPress={() => {
                  setLocale(loc);
                  setLangModalVisible(false);
                }}
                style={{ 
                  paddingVertical: 12, 
                  borderBottomWidth: 1, 
                  borderBottomColor: theme.border,
                  backgroundColor: locale === loc ? theme.primary + '20' : 'transparent',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  marginBottom: 4,
                }}
                activeOpacity={0.7}
              >
                <Text style={{ 
                  color: locale === loc ? theme.primary : theme.textPrimary,
                  fontWeight: locale === loc ? 'bold' : 'normal',
                  fontSize: 15
                }}>
                  {languageNames[loc]}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              onPress={() => setLangModalVisible(false)} 
              style={{ marginTop: 16, padding: 12, backgroundColor: theme.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}
              activeOpacity={0.7}
            >
              <Text style={{ color: theme.textPrimary, textAlign: 'center' }}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import CompactThemeSwitcher from '../components/CompactThemeSwitcher';
import useStore from '../store';
import { spacing, radii } from '../theme/spacing';
import STRINGS from '../locales';

export default function SettingsScreen({ navigation, lang, setLocale, locale }) {
  const { theme } = useTheme();
  const { importBooksFromSheets } = useStore();
  const [langModalVisible, setLangModalVisible] = useState(false);

  const languageNames = {
    be: 'Беларуская', de: 'Deutsch', en: 'English', fr: 'Français',
    it: 'Italiano', ja: '日本語', ko: '한국어', pl: 'Polski', ru: 'Русский', ua: 'Українська',
  };

  const handleImport = () => {
    Alert.alert(
      'Подтверждение импорта',
      'Импорт заменит все текущие книги на данные из таблицы. Продолжить?',
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

  const handleResetStats = () => {
    Alert.alert(
      '⚠️ Сброс статистики',
      'ВСЕ сессии чтения будут удалены без возможности восстановления. Книги останутся. Продолжить?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Сбросить',
          style: 'destructive',
          onPress: async () => {
            useStore.setState({ sessions: [], activeSession: null });
            const { books, updateBook } = useStore.getState();
            books.forEach(book => {
              if (book.pagesRead > 0) {
                updateBook(book.id, { ...book, pagesRead: 0, lastSessionDate: null });
              }
            });
            Alert.alert('✅ Готово', 'Статистика чтения сброшена.');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background, padding: spacing.lg }}>
      <Text style={{ color: theme.textPrimary, fontSize: 28, fontWeight: 'bold', marginBottom: spacing.xl, marginTop: 40 }}>
        ⚙️ Настройки
      </Text>

      <View style={{ marginBottom: spacing.xl }}>
        <Text style={{ color: theme.textPrimary, fontSize: 18, marginBottom: spacing.md }}>🌙 Тема</Text>
        <CompactThemeSwitcher lang={lang} />
      </View>

      <View style={{ marginBottom: spacing.xl }}>
        <Text style={{ color: theme.textPrimary, fontSize: 18, marginBottom: spacing.md }}>🌐 Язык</Text>
        <TouchableOpacity
          onPress={() => setLangModalVisible(true)}
          style={{ padding: spacing.md, backgroundColor: theme.surface, borderRadius: radii.lg }}
        >
          <Text style={{ color: theme.textPrimary }}>{languageNames[locale] || locale}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginBottom: spacing.xl }}>
        <Text style={{ color: theme.textPrimary, fontSize: 18, marginBottom: spacing.md }}>📥 Данные</Text>
        <TouchableOpacity
          onPress={handleImport}
          style={{ padding: spacing.md, backgroundColor: theme.surface, borderRadius: radii.lg }}
        >
          <Text style={{ color: theme.primary }}>Импорт из Google Sheets</Text>
        </TouchableOpacity>
      </View>

      {/* КНОПКА СБРОСА СТАТИСТИКИ */}
      <View style={{ marginBottom: spacing.xl }}>
        <Text style={{ color: theme.textPrimary, fontSize: 18, marginBottom: spacing.md }}>🗑️ Очистка</Text>
        <TouchableOpacity
          onPress={handleResetStats}
          style={{ padding: spacing.md, backgroundColor: theme.error, borderRadius: radii.lg }}
        >
          <Text style={{ color: '#FFF', textAlign: 'center', fontWeight: 'bold' }}>Сбросить статистику</Text>
        </TouchableOpacity>
        <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: spacing.sm }}>
          Удалит все сессии чтения. Книги останутся.
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate('About')}
        style={{ padding: spacing.md, backgroundColor: theme.surface, borderRadius: radii.lg }}
      >
        <Text style={{ color: theme.textPrimary }}>ℹ️ О приложении</Text>
      </TouchableOpacity>

      <Modal visible={langModalVisible} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: spacing.lg }}>
          <View style={{ backgroundColor: theme.surface, borderRadius: radii.xl, padding: spacing.lg }}>
            <Text style={{ color: theme.textPrimary, fontSize: 18, marginBottom: spacing.lg, textAlign: 'center' }}>
              Выберите язык
            </Text>
            {Object.keys(STRINGS).map(loc => (
              <TouchableOpacity
                key={loc}
                onPress={() => { setLocale(loc); setLangModalVisible(false); }}
                style={{ paddingVertical: spacing.md, paddingHorizontal: spacing.md, backgroundColor: locale === loc ? theme.primary : theme.surface, borderRadius: radii.md, marginBottom: spacing.sm }}
              >
                <Text style={{ color: locale === loc ? '#FFF' : theme.textPrimary }}>{languageNames[loc]}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setLangModalVisible(false)} style={{ marginTop: spacing.lg, padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: theme.border }}>
              <Text style={{ color: theme.textPrimary, textAlign: 'center' }}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
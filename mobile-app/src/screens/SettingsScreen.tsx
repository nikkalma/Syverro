// src/screens/SettingsScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Alert, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useStore } from '../store';
import packageJson from '../../package.json';

const LANGUAGES = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'be', name: 'Беларуская', flag: '🇧🇾' },
  { code: 'ua', name: 'Українська', flag: '🇺🇦' },
];

interface SettingsScreenProps {
  navigation: any;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { theme, mode, toggleTheme } = useTheme();
  const { locale, setLocale, t } = useLanguage();
  const { deleteAllSessions } = useStore();
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [exporting, setExporting] = useState(false);

  const themeNames = {
    light: t('theme.light') || 'Светлая',
    dark: t('theme.dark') || 'Тёмная',
    system: t('theme.system') || 'Системная',
  };

  const getCurrentThemeName = () => {
    return themeNames[mode as keyof typeof themeNames] || 'Светлая';
  };

  const getCurrentLanguageName = () => {
    const lang = LANGUAGES.find(l => l.code === locale);
    return lang ? `${lang.flag} ${lang.name}` : '🇷🇺 Русский';
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      
      const state = useStore.getState();
      const exportData = {
        metadata: {
          appVersion: packageJson.version,
          exportDate: new Date().toISOString(),
          syverroVersion: 2,
        },
        books: state.books,
        sessions: state.sessions,
        profile: state.profile,
        quotes: state.quotes,
      };
      
      const now = new Date();
      const fileName = `syverro_backup_${now.toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      const jsonString = JSON.stringify(exportData, null, 2);
      await FileSystem.writeAsStringAsync(filePath, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(t('common.error') || 'Ошибка', 'Экспорт недоступен на этом устройстве');
        setExporting(false);
        return;
      }
      
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Сохранить резервную копию',
        UTI: 'public.json',
      });
      
      Alert.alert(t('common.success') || '✅ Успех', 'Данные экспортированы');
    } catch (error) {
      console.error('Export Error:', error);
      Alert.alert(t('common.error') || '❌ Ошибка', 'Не удалось экспортировать данные');
    } finally {
      setExporting(false);
    }
  };

  const handleResetStats = () => {
    Alert.alert(
      'Сброс статистики',
      'Все сессии чтения будут удалены без возможности восстановления. Книги останутся. Продолжить?',
      [
        { text: t('common.cancel') || 'Отмена', style: 'cancel' },
        {
          text: 'Сбросить',
          style: 'destructive',
          onPress: () => {
            deleteAllSessions();
            Alert.alert('Готово', 'Статистика чтения сброшена.');
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          ⚙️ {t('settings.title') || 'Настройки'}
        </Text>

        {/* Внешний вид */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {t('theme.title') || 'Внешний вид'}
          </Text>
          
          <TouchableOpacity
            onPress={() => setThemeModalVisible(true)}
            style={styles.row}
            activeOpacity={0.7}
          >
            <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
              {getCurrentThemeName()}
            </Text>
            <View style={styles.rowValue}>
              <Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Язык */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {t('language.title') || 'Язык'}
          </Text>
          
          <TouchableOpacity
            onPress={() => setLangModalVisible(true)}
            style={styles.row}
            activeOpacity={0.7}
          >
            <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
              {getCurrentLanguageName()}
            </Text>
            <View style={styles.rowValue}>
              <Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Данные */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            📁 {t('settings.data') || 'Данные'}
          </Text>
          
          <TouchableOpacity
            onPress={handleExport}
            style={styles.row}
            activeOpacity={0.7}
            disabled={exporting}
          >
            <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
              {exporting ? '⏳ Экспорт...' : '📤 Экспорт библиотеки'}
            </Text>
            <View style={styles.rowValue}>
              <Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>
            </View>
          </TouchableOpacity>
          <Text style={[styles.rowHint, { color: theme.textMuted }]}>
            Сохранить все книги, сессии, профиль и цитаты в JSON-файл
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Очистка */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            🗑️ {t('settings.clear') || 'Очистка'}
          </Text>
          
          <TouchableOpacity
            onPress={handleResetStats}
            style={styles.dangerRow}
            activeOpacity={0.7}
          >
            <Text style={[styles.dangerLabel, { color: theme.error }]}>
              {t('settings.resetStats') || 'Сбросить статистику'}
            </Text>
            <View style={styles.rowValue}>
              <Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>
            </View>
          </TouchableOpacity>
          <Text style={[styles.rowHint, { color: theme.textMuted }]}>
            Удалит все сессии чтения. Книги останутся.
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* О приложении */}
        <View style={styles.section}>
          <TouchableOpacity
            onPress={() => navigation.navigate('About')}
            style={styles.row}
            activeOpacity={0.7}
          >
            <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
              ℹ️ {t('menu.about') || 'О приложении'}
            </Text>
            <View style={styles.rowValue}>
              <Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Theme Modal */}
      <Modal visible={themeModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              {t('theme.title') || 'Выберите тему'}
            </Text>
            {(['light', 'dark', 'system'] as const).map(themeMode => (
              <TouchableOpacity
                key={themeMode}
                onPress={() => {
                  toggleTheme(themeMode);
                  setThemeModalVisible(false);
                }}
                style={[
                  styles.modalOption,
                  { backgroundColor: mode === themeMode ? theme.primary : 'transparent' }
                ]}
              >
                <Text style={{ color: mode === themeMode ? '#FFF' : theme.textPrimary }}>
                  {themeNames[themeMode]}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setThemeModalVisible(false)}
              style={styles.modalClose}
            >
              <Text style={{ color: theme.textSecondary }}>{t('common.cancel') || 'Отмена'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Language Modal */}
      <Modal visible={langModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              {t('language.title') || 'Выберите язык'}
            </Text>
            {LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang.code}
                onPress={() => {
                  setLocale(lang.code as any);
                  setLangModalVisible(false);
                }}
                style={[
                  styles.modalOption,
                  { backgroundColor: locale === lang.code ? theme.primary : 'transparent' }
                ]}
              >
                <Text style={{ color: locale === lang.code ? '#FFF' : theme.textPrimary }}>
                  {lang.flag} {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setLangModalVisible(false)}
              style={styles.modalClose}
            >
              <Text style={{ color: theme.textSecondary }}>{t('common.cancel') || 'Отмена'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
  
  headerTitle: { fontSize: 28, fontWeight: '300', marginBottom: 24, letterSpacing: -0.5 },
  
  section: { marginBottom: 8 },
  sectionTitle: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, opacity: 0.6 },
  
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 8,
  },
  dangerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowLabel: { fontSize: 16, fontWeight: '400' },
  dangerLabel: { fontSize: 16, fontWeight: '400' },
  rowValue: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chevron: { fontSize: 18, opacity: 0.6 },
  rowHint: { fontSize: 12, marginTop: 2, opacity: 0.6, marginBottom: 4 },
  
  divider: { height: 0.5, marginVertical: 12 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '500', marginBottom: 16, textAlign: 'center' },
  modalOption: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginBottom: 8, alignItems: 'center' },
  modalClose: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
});
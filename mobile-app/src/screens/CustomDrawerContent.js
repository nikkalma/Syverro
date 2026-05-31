// mobile-app/src/screens/CustomDrawerContent.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import useStore from '../store';
import CompactThemeSwitcher from '../components/CompactThemeSwitcher';
import { MenuItem } from '../components/MenuItem';
import STRINGS from '../locales';
import { spacing, radii } from '../theme/spacing';

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
    <View style={{ 
      flex: 1, 
      backgroundColor: theme.background, 
      paddingTop: 50, 
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxxl,
    }}>
      <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: 'bold', marginBottom: spacing.xl }}>📚 Syverro</Text>
    
            <MenuItem 
        icon="👤" 
        title={lang.menu.profile} 
        onPress={() => {
          navigation.closeDrawer();
          navigation.navigate('Profile');
        }}
      />

              <MenuItem 
          icon="⏱️" 
          title="Сессия чтения" 
          onPress={() => {
            navigation.closeDrawer();
            navigation.navigate('Session');
          }}
        />

      <MenuItem 
        icon="📚" 
        title="Библиотека" 
        onPress={() => {
          navigation.closeDrawer();
          navigation.navigate('Library');
        }}
      />

      <MenuItem 
        icon="📊" 
        title="Инсайты" 
        onPress={() => {
          navigation.closeDrawer();
          navigation.navigate('Insights');
        }}
      />

      {__DEV__ && (
        <TouchableOpacity 
          onPress={handleImport}
          style={{ 
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            backgroundColor: theme.surface, 
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: theme.border,
            marginTop: spacing.md,
          }}
          activeOpacity={0.4}
        >
          <Text style={{ color: theme.textPrimary, fontSize: 13 }}>📥 Импорт (Dev)</Text>
        </TouchableOpacity>
      )}
      
      <View style={{ 
        height: 1, 
        backgroundColor: theme.border, 
        marginVertical: spacing.lg,
        marginHorizontal: spacing.md 
      }} />
      
      <TouchableOpacity 
        onPress={() => {
          navigation.closeDrawer();
          navigation.navigate('About');
        }}
        style={{ 
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          backgroundColor: theme.surface, 
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: theme.border,
        }}
        activeOpacity={0.4}
      >
        <Text style={{ color: theme.textPrimary, fontSize: 13 }}>ℹ️ {lang.menu.about}</Text>
      </TouchableOpacity>
      
      <Modal visible={langModalVisible} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: spacing.lg }}>
          <View style={{ backgroundColor: theme.surface, borderRadius: radii.xl, padding: spacing.lg }}>
            <Text style={{ color: theme.textPrimary, fontSize: 18, marginBottom: spacing.lg, textAlign: 'center' }}>Выберите язык</Text>
            {Object.keys(STRINGS).map(loc => (
              <TouchableOpacity 
                key={loc} 
                onPress={() => {
                  setLocale(loc);
                  setLangModalVisible(false);
                }}
                style={{ 
                  paddingVertical: spacing.md, 
                  borderBottomWidth: 1, 
                  borderBottomColor: theme.border,
                  backgroundColor: locale === loc ? theme.primary + '20' : 'transparent',
                  borderRadius: radii.md,
                  paddingHorizontal: spacing.md,
                  marginBottom: spacing.lg,
                }}
                activeOpacity={0.4}
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
              style={{ marginTop: spacing.lg, padding: spacing.md, backgroundColor: theme.surface, borderRadius: radii.md, borderWidth: 1, borderColor: theme.border }}
              activeOpacity={0.4}
            >
              <Text style={{ color: theme.textPrimary, textAlign: 'center' }}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
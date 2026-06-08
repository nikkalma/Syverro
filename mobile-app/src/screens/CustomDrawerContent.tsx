// src/screens/CustomDrawerContent.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import useStore from '../store';
import CompactThemeSwitcher from '../components/CompactThemeSwitcher';
import { MenuItem } from '../components/MenuItem';
import { spacing, radii } from '../theme/spacing';

interface CustomDrawerContentProps {
  navigation: any;
}

export default function CustomDrawerContent({ navigation }: CustomDrawerContentProps) {
  const { theme } = useTheme();
  const { t, locale, setLocale } = useLanguage();
  const { importBooksFromSheets } = useStore();
  const [langModalVisible, setLangModalVisible] = useState(false);
  
  const languageNames: Record<string, string> = {
    be: 'Беларуская',
    en: 'English',
    ru: 'Русский',
    ua: 'Українська',
  };
  
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
  
  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: theme.background, 
      paddingTop: 50, 
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxxl,
    }}>
      <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: 'bold', marginBottom: spacing.xl }}>
        📚 Syverro
      </Text>
    
      <MenuItem 
        icon="👤" 
        title={t('menu.profile')} 
        onPress={() => {
          navigation.closeDrawer();
          navigation.navigate('Profile');
        }}
      />

      <MenuItem 
        icon="⏱️" 
        title={t('session.title') || 'Сессия чтения'} 
        onPress={() => {
          navigation.closeDrawer();
          navigation.navigate('Session');
        }}
      />

      <MenuItem 
        icon="📚" 
        title={t('menu.stats') || 'Библиотека'} 
        onPress={() => {
          navigation.closeDrawer();
          navigation.navigate('Library');
        }}
      />

      <MenuItem 
        icon="📜" 
        title={t('quotes.title') || 'Цитаты'} 
        onPress={() => {
          navigation.closeDrawer();
          navigation.navigate('Quotes');
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
      
      <MenuItem 
        icon="ℹ️" 
        title={t('menu.about')} 
        onPress={() => {
          navigation.closeDrawer();
          navigation.navigate('About');
        }}
      />
      
      <Modal visible={langModalVisible} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: spacing.lg }}>
          <View style={{ backgroundColor: theme.surface, borderRadius: radii.xl, padding: spacing.lg }}>
            <Text style={{ color: theme.textPrimary, fontSize: 18, marginBottom: spacing.lg, textAlign: 'center' }}>
              {t('language.title') || 'Выберите язык'}
            </Text>
            {Object.keys(languageNames).map(loc => (
              <TouchableOpacity 
                key={loc} 
                onPress={() => {
                  setLocale(loc as any);
                  setLangModalVisible(false);
                }}
                style={{ 
                  paddingVertical: spacing.md, 
                  borderBottomWidth: 1, 
                  borderBottomColor: theme.border,
                  backgroundColor: locale === loc ? theme.primary + '20' : 'transparent',
                  borderRadius: radii.md,
                  paddingHorizontal: spacing.md,
                  marginBottom: spacing.sm,
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
              <Text style={{ color: theme.textPrimary, textAlign: 'center' }}>{t('common.cancel') || 'Отмена'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
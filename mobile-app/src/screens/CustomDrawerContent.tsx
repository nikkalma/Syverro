import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function CustomDrawerContent(props: any) {
  const { theme } = useTheme();
  const { language, setLanguage, t } = useLanguage();  // ← используем language

  const languages = [
    { code: 'ru' as const, name: 'Русский', flag: '🇷🇺' },
    { code: 'en' as const, name: 'English', flag: '🇬🇧' },
    { code: 'be' as const, name: 'Беларуская', flag: '🇧🇾' },
    { code: 'ua' as const, name: 'Українська', flag: '🇺🇦' },
  ];

  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: theme.background }}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {t('app.title') || 'Syverro'}
        </Text>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {t('language.title') || 'Язык'}
          </Text>
          
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              onPress={() => setLanguage(lang.code)}
              style={[
                styles.languageOption,
                { backgroundColor: language === lang.code ? theme.primary : 'transparent' }
              ]}
            >
              <Text style={{ color: language === lang.code ? '#FFF' : theme.textPrimary }}>
                {lang.flag} {lang.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 24, fontWeight: '300', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, textTransform: 'uppercase', marginBottom: 12, opacity: 0.6 },
  languageOption: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 8 },
});
// src/screens/AboutScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Linking, Share, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import packageJson from '../../package.json';

interface AboutScreenProps {
  navigation: any;
}

export default function AboutScreen({ navigation }: AboutScreenProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const appVersion = packageJson.version;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Syverro — ${t('about.tagline')}\nВерсия ${appVersion}\n${t('about.shareMessage') || 'Чтение как часть интеллектуальной истории'}`,
        title: 'Поделиться Syverro',
      });
    } catch (error) {
      console.log('Ошибка шаринга:', error);
    }
  };

  const handleEmail = () => {
    Linking.openURL('mailto:syverro.ris@gmail.com?subject=Syverro%20Feedback&body=');
  };

  const handleGitHub = () => {
    Linking.openURL('https://github.com/yourusername/Syverro');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background, paddingHorizontal: 20 }}>
      {/* Кнопка назад */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 50, marginBottom: 30 }}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={{ marginRight: 15 }}
          activeOpacity={0.4}
        >
          <Text style={{ color: theme.textPrimary, fontSize: 28 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: theme.textPrimary, fontSize: 28, fontWeight: 'bold' }}>
          {t('about.title') || 'О Syverro'}
        </Text>
      </View>

      {/* Hero */}
      <View style={{ alignItems: 'center', marginBottom: 30 }}>
        <Text style={{ color: theme.textPrimary, fontSize: 32, fontWeight: '300', letterSpacing: -0.5 }}>
          Syverro
        </Text>
        <Text
          style={{
            color: theme.textSecondary,
            fontSize: 14,
            marginTop: 8,
            textAlign: 'center',
            opacity: 0.7,
          }}
        >
          {t('about.tagline') || 'Тихое пространство для чтения и размышлений'}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 12 }}>
          {t('about.version') || 'Версия'} {appVersion}
        </Text>
      </View>

      {/* Philosophy Card */}
      <View
        style={{
          backgroundColor: theme.surface,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          borderWidth: 0.5,
          borderColor: theme.border,
        }}
      >
        <Text
          style={{
            color: theme.textPrimary,
            fontSize: 16,
            fontWeight: '500',
            marginBottom: 12,
            letterSpacing: 0.3,
          }}
        >
          {t('about.philosophyTitle') || 'Философия'}
        </Text>
        <Text
          style={{
            color: theme.textSecondary,
            fontSize: 14,
            lineHeight: 22,
            opacity: 0.9,
          }}
        >
          {t('about.description') || 'Syverro — это не просто каталог прочитанных книг. Это пространство, где чтение становится частью личной интеллектуальной истории. Сохраняйте книги, мысли и наблюдения, замечайте собственные паттерны и постепенно формируйте библиотеку идей.'}
        </Text>
      </View>

      {/* RIS Card */}
      <View
        style={{
          backgroundColor: theme.surface,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          borderWidth: 0.5,
          borderColor: theme.border,
        }}
      >
        <Text
          style={{
            color: theme.textPrimary,
            fontSize: 16,
            fontWeight: '500',
            marginBottom: 12,
            letterSpacing: 0.3,
          }}
        >
          {t('about.risTitle') || 'Reading Intelligence System'}
        </Text>
        <Text
          style={{
            color: theme.textSecondary,
            fontSize: 14,
            lineHeight: 22,
            opacity: 0.9,
          }}
        >
          {t('about.risDescription') || 'RIS рассматривает чтение как процесс формирования мышления. Книги — это не отдельные элементы списка, а взаимосвязанные точки на карте знаний, интересов и опыта. Syverro помогает увидеть эти связи и сохранить их.'}
        </Text>
      </View>

      {/* Contact Card */}
      <View
        style={{
          backgroundColor: theme.surface,
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          borderWidth: 0.5,
          borderColor: theme.border,
        }}
      >
        <Text
          style={{
            color: theme.textPrimary,
            fontSize: 16,
            fontWeight: '500',
            marginBottom: 12,
            letterSpacing: 0.3,
          }}
        >
          {t('about.contactTitle') || 'Связаться'}
        </Text>
        <TouchableOpacity onPress={handleEmail} activeOpacity={0.7}>
          <Text
            style={{
              color: theme.primary,
              fontSize: 14,
              lineHeight: 22,
            }}
          >
            syverro.ris@gmail.com
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={{ marginBottom: 40 }}>
        <Text
          style={{
            color: theme.textMuted,
            fontSize: 11,
            textAlign: 'center',
            letterSpacing: 0.5,
          }}
        >
          Reading Intelligence System
        </Text>
        <Text
          style={{
            color: theme.textMuted,
            fontSize: 11,
            textAlign: 'center',
            marginTop: 6,
            opacity: 0.6,
          }}
        >
          © 2026 Syverro
        </Text>
      </View>
    </ScrollView>
  );
}
import React from 'react';
import { View, Text, TouchableOpacity, Linking, Share, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import packageJson from '../../package.json';

export default function AboutScreen({ navigation, lang }) {
  const { theme } = useTheme();

  const appVersion = packageJson.version;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `📚 Evebrary — трекер книг с душой!\nВерсия ${appVersion}\nСкачай: [ссылка на скачивание]`,
        title: 'Поделиться Evebrary',
      });
    } catch (error) {
      console.log('Ошибка шаринга:', error);
    }
  };

  const handleEmail = () => {
    Linking.openURL('mailto:nikkalma@example.com?subject=Evebrary%20Feedback&body=Здравствуйте!%20Хочу%20поделиться%20мыслями%20о%20приложении...');
  };

  const handleGitHub = () => {
    Linking.openURL('https://github.com/yourusername/everbrary');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background, paddingHorizontal: 20 }}>
      {/* Шапка с кнопкой назад */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 50, marginBottom: 30 }}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={{ marginRight: 15 }}
          activeOpacity={0.4}
        >
          <Text style={{ color: theme.textPrimary, fontSize: 28 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: theme.textPrimary, fontSize: 28, fontWeight: 'bold' }}>О приложении</Text>
      </View>

      {/* Логотип и название */}
      <View style={{ alignItems: 'center', marginBottom: 30 }}>
        <Text style={{ fontSize: 64, marginBottom: 10 }}>📚</Text>
        <Text style={{ color: theme.textPrimary, fontSize: 28, fontWeight: 'bold' }}>Evebrary</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 5 }}>Версия {appVersion}</Text>
      </View>

      {/* Описание */}
      <View style={{ marginBottom: 30 }}>
        <Text style={{ color: theme.textPrimary, fontSize: 16, lineHeight: 24, textAlign: 'center' }}>
          Evebrary — это минималистичный трекер книг для тех, кто хочет систематизировать свою библиотеку, 
          отслеживать прогресс и не отвлекаться на лишнее. Никакой аналитики, только книги и ты.
        </Text>
      </View>

      {/* Карточка автора */}
      <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: theme.border }}>
        <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>🧑‍💻 Автор</Text>
        <Text style={{ color: theme.textPrimary, fontSize: 15, marginBottom: 5 }}>Ника Кальма</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>INTP · Занзибар · One Piece fan</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 5 }}>«Порядок в книгах — порядок в голове»</Text>
      </View>

      {/* Кнопки действий */}
      <View style={{ gap: 12, marginBottom: 30 }}>
        <TouchableOpacity
          onPress={handleShare}
          style={{ backgroundColor: theme.primary, padding: 14, borderRadius: 12, alignItems: 'center' }}
          activeOpacity={0.4}
        >
          <Text style={{ color: '#FFF', fontWeight: 'bold' }}>📤 Поделиться</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleEmail}
          style={{ backgroundColor: theme.surface, padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}
          activeOpacity={0.4}
        >
          <Text style={{ color: theme.textPrimary }}>✉️ Написать разработчику</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleGitHub}
          style={{ backgroundColor: theme.surface, padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}
          activeOpacity={0.4}
        >
          <Text style={{ color: theme.textPrimary }}>🐙 GitHub</Text>
        </TouchableOpacity>
      </View>

      {/* Благодарности */}
      <View style={{ marginBottom: 40 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 12, textAlign: 'center' }}>
          Собрано на React Native · Expo · Zustand
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 5 }}>
          © 2026 Evebrary · Сделано с ☕ и 📚
        </Text>
      </View>
    </ScrollView>
  );
}
// src/screens/InsightsScreen.js
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import useStore from '../store';
import { spacing } from '../theme/spacing';

export default function InsightsScreen({ navigation, lang }) {
  const { theme } = useTheme();
  const { books, getTotalStats } = useStore();
  const stats = getTotalStats();

  // Fallback на случай, если lang.insights не существует
  const t = lang?.insights || {
    title: 'Инсайты',
    progress: 'Прогресс чтения',
    finished: 'Прочитано',
    total: 'Всего',
    topGenres: 'Топ-3 жанра',
    noGenreData: 'Нет данных',
    books: 'кн.',
    addFirstBook: 'Добавьте первую книгу',
    justStarted: 'Вы только начали',
    goodStart: 'Отличный старт',
    bookworm: 'Книжный червь',
    bookKing: 'Книжный король',
  };

    // Подсчёт жанров ТОЛЬКО для прочитанных книг
  const genreCount = {};
  const finishedBooksList = books.filter(book => book.status === 'completed');
  
  finishedBooksList.forEach(book => {
    if (book.genres && Array.isArray(book.genres)) {
      book.genres.forEach(genre => {
        if (genre) {
          genreCount[genre] = (genreCount[genre] || 0) + 1;
        }
      });
    }
  });
  
  const topGenres = Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const totalBooks = books.length;
  const finishedBooks = books.filter(b => b.status === 'completed').length;
  const readingBooks = books.filter(b => b.status === 'reading').length;

  // Определение уровня читателя
  let readerLevel = t.justStarted;
  if (finishedBooks >= 100) readerLevel = t.bookKing;
  else if (finishedBooks >= 50) readerLevel = t.bookworm;
  else if (finishedBooks >= 25) readerLevel = t.goodStart;
  else if (finishedBooks >= 10) readerLevel = t.bookworm;
  else if (finishedBooks >= 5) readerLevel = t.goodStart;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background, padding: spacing.lg }}>
      <Text style={{ color: theme.textPrimary, fontSize: 28, fontWeight: 'bold', marginBottom: spacing.xl, marginTop: 40 }}>
        📊 {t.title}
      </Text>

      {/* Общая статистика */}
      <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: spacing.lg, marginBottom: spacing.xl }}>
        <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: spacing.md }}>
          {t.progress}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{t.total}</Text>
            <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: 'bold' }}>{totalBooks}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{t.finished}</Text>
            <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: 'bold' }}>{finishedBooks}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Сессий</Text>
            <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: 'bold' }}>{stats.totalSessions}</Text>
          </View>
        </View>
      </View>

      {/* Уровень читателя */}
      <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: spacing.lg, marginBottom: spacing.xl, alignItems: 'center' }}>
        <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>Ваш уровень</Text>
        <Text style={{ color: theme.primary, fontSize: 24, fontWeight: 'bold' }}>{readerLevel}</Text>
        <View style={{ width: '100%', height: 8, backgroundColor: theme.background, borderRadius: 4, marginTop: 12, overflow: 'hidden' }}>
          <View style={{ width: `${Math.min((finishedBooks / 100) * 100, 100)}%`, height: '100%', backgroundColor: theme.primary }} />
        </View>
        <Text style={{ color: theme.textSecondary, fontSize: 10, marginTop: 4 }}>{finishedBooks} / 100 книг</Text>
      </View>

      {/* Топ жанров */}
      <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: spacing.lg }}>
        <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: spacing.md }}>
          {t.topGenres}
        </Text>
        {topGenres.length > 0 ? (
          topGenres.map(([genre, count], index) => (
            <View key={genre} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <Text style={{ color: theme.textPrimary }}>{index + 1}. {genre}</Text>
              <Text style={{ color: theme.textSecondary }}>{count} {t.books}</Text>
            </View>
          ))
        ) : (
          <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: spacing.md }}>
            {t.noGenreData}
          </Text>
        )}
      </View>

      {/* Сообщение, если нет книг */}
      {totalBooks === 0 && (
        <View style={{ marginTop: spacing.xl, alignItems: 'center' }}>
          <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>{t.addFirstBook}</Text>
        </View>
      )}
    </ScrollView>
  );
}
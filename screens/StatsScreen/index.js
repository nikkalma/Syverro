// SYVERRO-STATS-SCREEN-FINAL-001
import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import useStore from '../../store';
import ProgressBar from './ProgressBar';
import TopGenres from './TopGenres';
import StatCards from './StatCards';
import MotivationCard from './MotivationCard';

export default function StatsScreen({ navigation, lang }) {
  const { theme } = useTheme();
  const { books } = useStore();

  const stats = useMemo(() => {
    const totalBooks = books.length;
    const finishedBooks = books.filter(b => b.status === 'finished');
    const finishedCount = finishedBooks.length;
    const readingBooks = books.filter(b => b.status === 'reading');
    const totalPages = books.reduce((sum, b) => sum + (b.pages || 0), 0);
    
    const avgRating = finishedBooks.length > 0
      ? (finishedBooks.reduce((sum, b) => sum + (b.rating || 0), 0) / finishedBooks.length).toFixed(1)
      : 0;

    const genreCount = {};
    finishedBooks.forEach(book => {
      (book.genres || []).forEach(genre => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });
    const topGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    const percentRead = totalBooks > 0 ? Math.round((finishedCount / totalBooks) * 100) : 0;

    return {
      totalBooks,
      finishedCount,
      readingCount: readingBooks.length,
      totalPages,
      avgRating: avgRating === '0.0' ? '—' : avgRating,
      topGenres,
      percentRead,
    };
  }, [books]);

  if (!books) return null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background, paddingHorizontal: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 50, marginBottom: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 15 }} activeOpacity={0.7}>
          <Text style={{ color: theme.textPrimary, fontSize: 28 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: theme.textPrimary, fontSize: 28, fontWeight: 'bold' }}>{lang.stats?.title || 'Статистика'}</Text>
      </View>

      <ProgressBar stats={stats} lang={lang} theme={theme} />
      <TopGenres stats={stats} lang={lang} theme={theme} />
      <StatCards stats={stats} lang={lang} theme={theme} />
      <MotivationCard stats={stats} lang={lang} theme={theme} />
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
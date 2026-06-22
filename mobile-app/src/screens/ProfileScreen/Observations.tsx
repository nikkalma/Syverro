// src/screens/ProfileScreen/Observations.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStore } from '../../store';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';
import type { Book } from '../../types/book';
import type { ReadingSession } from '../../types/session.types';

interface Props {
  theme: any;
  books: Book[];
  sessions: ReadingSession[];
}

export default function Observations({ theme, books, sessions }: Props) {
  const { t, locale } = useLanguage();
  const typography = getTypography(locale);
  const { quotes } = useStore();
  
  const [renderKey, setRenderKey] = useState(Date.now());
  
  useEffect(() => {
    setRenderKey(Date.now());
  }, [books?.length, sessions?.length, quotes?.length]);
  
  const quoteOfDay = useMemo(() => {
    if (!quotes || quotes.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  }, [quotes, renderKey]);
  
  const insights = useMemo(() => {
    const pool: string[] = [];
    const relevantStatuses = ['finished', 'reading', 'rereading'];
    const activeBooks = books.filter(book => relevantStatuses.includes(book.status));
    
    if (activeBooks.length === 0 && (!sessions || sessions.length === 0)) return [];
    
    // 1. Формат чтения
    const textBooks = activeBooks.filter(b => b.readingFormat === 'reading' || !b.readingFormat);
    const audioBooks = activeBooks.filter(b => b.readingFormat === 'listening');
    const totalFormat = textBooks.length + audioBooks.length;
    
    if (totalFormat > 0) {
      const audioPercent = (audioBooks.length / totalFormat) * 100;
      if (audioPercent > 60) {
        pool.push(locale === 'ru' 
          ? `🎧 Ты предпочитаешь аудиокниги — ${Math.round(audioPercent)}% твоего чтения в аудиоформате.`
          : `🎧 You prefer audiobooks — ${Math.round(audioPercent)}% of your reading is audio.`);
      } else if (audioPercent < 20 && textBooks.length > 0) {
        pool.push(locale === 'ru'
          ? `📖 Ты остаёшься верен тексту — аудиокниги занимают лишь ${Math.round(audioPercent)}%.`
          : `📖 You stay true to text — audiobooks make up only ${Math.round(audioPercent)}%.`);
      } else if (textBooks.length > 0 && audioBooks.length > 0) {
        pool.push(locale === 'ru'
          ? `⚖️ Ты балансируешь между текстом и аудио — почти поровну.`
          : `⚖️ You balance between text and audio — almost evenly.`);
      }
    }
    
    // 2. Страна-лидер
    const countryMap = new Map<string, number>();
    activeBooks.forEach(book => {
      if (book.authorCountry && book.authorCountry.trim()) {
        const country = book.authorCountry.trim();
        countryMap.set(country, (countryMap.get(country) || 0) + 1);
      }
    });
    
    if (countryMap.size > 0) {
      const maxCount = Math.max(...countryMap.values());
      const leaderCountries = Array.from(countryMap.entries())
        .filter(([_, count]) => count === maxCount)
        .map(([country]) => country);
      
      if (leaderCountries.length === 1) {
        pool.push(locale === 'ru'
          ? `🌍 Твоя главная литературная страна — ${leaderCountries[0]}. ${maxCount} ${maxCount === 1 ? 'книга' : 'книг'} оттуда.`
          : `🌍 Your main literary country is ${leaderCountries[0]}. ${maxCount} book(s) from there.`);
      } else if (leaderCountries.length > 1) {
        pool.push(locale === 'ru'
          ? `🌍 Твои литературные фавориты: ${leaderCountries.join(', ')} — ${maxCount} книг из каждого места.`
          : `🌍 Your literary favorites: ${leaderCountries.join(', ')} — ${maxCount} book(s) from each.`);
      }
    }
    
    // 3. Длинные vs короткие книги
    const longBooks = activeBooks.filter(b => (b.totalPages || 0) > 500);
    const shortBooks = activeBooks.filter(b => (b.totalPages || 0) > 0 && (b.totalPages || 0) <= 300);
    
    if (longBooks.length > shortBooks.length && longBooks.length > 0) {
      pool.push(locale === 'ru'
        ? `📖 Ты любишь масштабные истории — ${Math.round((longBooks.length / activeBooks.length) * 100)}% книг длиннее 500 страниц.`
        : `📖 You love large-scale stories — ${Math.round((longBooks.length / activeBooks.length) * 100)}% of your books are longer than 500 pages.`);
    } else if (shortBooks.length > longBooks.length && shortBooks.length > 0) {
      pool.push(locale === 'ru'
        ? `📖 Ты ценишь камерность — ${Math.round((shortBooks.length / activeBooks.length) * 100)}% книг короче 300 страниц.`
        : `📖 You appreciate intimacy — ${Math.round((shortBooks.length / activeBooks.length) * 100)}% of your books are shorter than 300 pages.`);
    }
    
    // 4. Статистика по сессиям
    if (sessions && sessions.length > 0) {
      // Среднее время сессии
      const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      const avgDuration = totalDuration / sessions.length;
      const avgMinutes = Math.round(avgDuration / 60);
      if (avgMinutes > 0) {
        pool.push(locale === 'ru'
          ? `⏱ Твоя средняя сессия чтения длится ${avgMinutes} минут.`
          : `⏱ Your average reading session lasts ${avgMinutes} minutes.`);
      }
      
     // Самая быстрая книга
let fastestBookTitle: string = '';
let fastestBookSpeed: number = 0;

sessions.forEach((session: ReadingSession) => {
  const pagesRead = session.pagesRead || 0;
  const durationMinutes = (session.duration || 0) / 60;
  if (durationMinutes > 0 && pagesRead > 0) {
    const speed = pagesRead / durationMinutes;
    if (speed > fastestBookSpeed) {
      fastestBookSpeed = speed;
      fastestBookTitle = session.bookTitle;
    }
  }
});

if (fastestBookTitle) {
  const roundedSpeed = Math.round(fastestBookSpeed * 10) / 10;
  pool.push(locale === 'ru'
    ? `⚡ Самый быстрый темп: «${fastestBookTitle}» — ${roundedSpeed} стр./мин.`
    : `⚡ Fastest pace: "${fastestBookTitle}" — ${roundedSpeed} pages/min.`);
}
      
      // Любимый день недели
      const dayCount = [0, 0, 0, 0, 0, 0, 0];
      sessions.forEach((session: ReadingSession) => {
        if (session.startTime) {
          const day = new Date(session.startTime).getDay();
          dayCount[day]++;
        }
      });
      const maxDayIndex = dayCount.indexOf(Math.max(...dayCount));
      const dayNames = locale === 'ru'
        ? ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
        : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      if (maxDayIndex !== -1 && dayCount[maxDayIndex] > 0) {
        pool.push(locale === 'ru'
          ? `📅 Твой читательский день — ${dayNames[maxDayIndex]}.`
          : `📅 Your reading day is ${dayNames[maxDayIndex]}.`);
      }
      
      // Хронотип (время дня)
      const hourCount = Array(24).fill(0);
      sessions.forEach((session: ReadingSession) => {
        if (session.startTime) {
          const hour = new Date(session.startTime).getHours();
          hourCount[hour]++;
        }
      });
      let maxHour = 0;
      let maxHourCount = 0;
      for (let i = 0; i < 24; i++) {
        if (hourCount[i] > maxHourCount) {
          maxHourCount = hourCount[i];
          maxHour = i;
        }
      }
      if (maxHourCount > 0) {
        let timeOfDay = '';
        if (maxHour >= 5 && maxHour < 12) timeOfDay = locale === 'ru' ? 'утро' : 'morning';
        else if (maxHour >= 12 && maxHour < 17) timeOfDay = locale === 'ru' ? 'день' : 'afternoon';
        else if (maxHour >= 17 && maxHour < 22) timeOfDay = locale === 'ru' ? 'вечер' : 'evening';
        else timeOfDay = locale === 'ru' ? 'ночь' : 'night';
        
        pool.push(locale === 'ru'
          ? `🌙 Ты чаще читаешь ${timeOfDay === 'утро' ? 'по утрам' : timeOfDay === 'день' ? 'днём' : timeOfDay === 'вечер' ? 'вечером' : 'ночью'}.`
          : `🌙 You usually read in the ${timeOfDay}.`);
      }
      
      // Общее количество сессий
      if (sessions.length > 10) {
        pool.push(locale === 'ru'
          ? `📚 У тебя уже ${sessions.length} читательских сессий! Отличный прогресс.`
          : `📚 You already have ${sessions.length} reading sessions! Great progress.`);
      } else if (sessions.length > 5) {
        pool.push(locale === 'ru'
          ? `📚 ${sessions.length} сессий чтения — ты на хорошем пути!`
          : `📚 ${sessions.length} reading sessions — you're on the right track!`);
      }
    }
    
    // Перемешиваем и выбираем 2-3 инсайта
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 3);
  }, [books, sessions, locale, renderKey]);
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };
  
  const formatSessionTime = (minutes: number | null) => {
    if (!minutes && minutes !== 0) return null;
    if (minutes < 60) return `${minutes} ${locale === 'ru' ? 'мин' : 'min'}`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ч ${mins} мин`;
  };
  
  return (
    <View style={styles.container}>
      {/* Цитата дня */}
      {quoteOfDay && (
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={[typography.secondary, { color: theme.textMuted, marginBottom: spacing.sm }]}>
            📜 {t('quotes.quoteOfDay')}
          </Text>
          <View style={{
            backgroundColor: theme.surface,
            borderRadius: 16,
            padding: spacing.md,
            borderWidth: 0.5,
            borderColor: theme.border,
          }}>
            <Text style={[typography.body, { color: theme.textPrimary, fontStyle: 'italic', lineHeight: 22 }]}>
              «{quoteOfDay.text}»
            </Text>
            <Text style={[typography.caption, { color: theme.primary, marginTop: spacing.sm }]}>
              {quoteOfDay.bookTitle} — {quoteOfDay.bookAuthor}
            </Text>
            <Text style={[typography.caption, { color: theme.textMuted, marginTop: 4 }]}>
              {formatDate(quoteOfDay.createdAt)}
            </Text>
            {quoteOfDay.sessionTime !== null && quoteOfDay.sessionTime !== undefined && (
              <Text style={[typography.caption, { color: theme.textMuted, marginTop: 4 }]}>
                ⏱️ {formatSessionTime(quoteOfDay.sessionTime)} {locale === 'ru' ? 'чтения' : 'of reading'}
              </Text>
            )}
          </View>
        </View>
      )}
      
      {/* Заголовок инсайтов */}
      <Text style={[typography.secondary, { color: theme.textMuted, marginBottom: spacing.md }]}>
        💭 {t('insights.title')}
      </Text>
      
      {/* Инсайты */}
      {insights.length === 0 ? (
        <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'center' }]}>
          {locale === 'ru' 
            ? 'Добавь больше книг и проведи несколько сессий чтения, чтобы увидеть персональную статистику.'
            : 'Add more books and complete a few reading sessions to see personal statistics.'}
        </Text>
      ) : (
        insights.map((insight, index) => (
          <View key={index} style={styles.insightRow}>
            <Text style={[typography.body, { color: theme.textSecondary, lineHeight: 22 }]}>
              {insight}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xl },
  insightRow: { paddingVertical: spacing.xs, marginBottom: spacing.sm },
});
// src/screens/BookDetailsScreen/ViewMode.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useStore } from '../../store';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import type { Book } from '../../types/book.types';

interface ViewModeProps {
  bookId: string;
  onEdit: () => void;
}

export default function ViewMode({ bookId, onEdit }: ViewModeProps) {
  const { books } = useStore();
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  const book = books.find((b: Book) => b.id === bookId);
  
  if (!book) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.textPrimary }}>{t('bookDetails.notFound') || 'Книга не найдена'}</Text>
      </View>
    );
  }
  
  const displayRating = book.rating ? book.rating.toFixed(1) : 0;
  const ratingOutOf = 5;
  
  const statusLabels: Record<string, string> = {
    planned: t('status.planned') || 'в планах',
    reading: t('status.reading') || 'читаю',
    finished: t('status.finished') || 'прочитано',
    postponed: t('status.postponed') || 'отложено',
    abandoned: t('status.abandoned') || 'брошено',
    rereading: t('status.rereading') || 'перечитываю',
  };
  
  const readingFormatLabels: Record<string, string> = {
    reading: '📖 Читаю',
    listening: '🎧 Слушаю',
  };

  const isImageCover = book.cover && typeof book.cover === 'string' && book.cover.startsWith('file://');
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      
      {isImageCover && (
        <View style={styles.coverContainer}>
          <Image source={{ uri: book.cover }} style={styles.cover} />
        </View>
      )}
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{book.title || 'Без названия'}</Text>
        <Text style={[styles.author, { color: theme.textSecondary }]}>{book.author || 'Неизвестный автор'}</Text>
      </View>
      
      <View style={styles.infoCard}>
        
        {book.readingFormat && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{t('fields.readingFormat') || 'Формат'}</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
              {readingFormatLabels[book.readingFormat] || '📖 Читаю'}
            </Text>
          </View>
        )}
        
        {book.status && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{t('bookDetails.status') || 'Статус'}</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
              {statusLabels[book.status] || book.status}
            </Text>
          </View>
        )}
        
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{t('bookDetails.progress') || 'Прогресс'}</Text>
          <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
            {book.status === 'finished' 
              ? `${book.totalPages || 0} / ${book.totalPages || 0} ${t('bookDetails.pages') || 'стр.'}`
              : `${book.currentPage || 0} / ${book.totalPages || 0} ${t('bookDetails.pages') || 'стр.'}`}
          </Text>
        </View>
        
        {book.rating && book.rating > 0 && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{t('bookDetails.rating') || 'Оценка'}</Text>
            <Text style={[styles.infoValue, { color: theme.primary }]}>
              {displayRating} / {ratingOutOf} ⭐
            </Text>
          </View>
        )}
        
        {book.genres && book.genres.length > 0 && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{t('fields.genres') || 'Жанры'}</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
              {Array.isArray(book.genres) ? book.genres.join(', ') : book.genres}
            </Text>
          </View>
        )}
        
        {book.languages && book.languages.length > 0 && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{t('fields.languages') || 'Язык'}</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
              {Array.isArray(book.languages) ? book.languages.join(', ') : book.languages}
            </Text>
          </View>
        )}
        
        {book.authorCountry && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{t('fields.authorCountry') || 'Страна автора'}</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
              {book.authorCountry}
            </Text>
          </View>
        )}
        
        {book.originalYear && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{t('fields.originalYear') || 'Год оригинала'}</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
              {book.originalYear}
            </Text>
          </View>
        )}
        
        {book.series && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{t('fields.series') || 'Серия'}</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
              {book.series}{book.seriesPosition ? ` (книга ${book.seriesPosition})` : ''}
            </Text>
          </View>
        )}
        
        {book.startDate && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{t('fields.startDate') || 'Дата начала'}</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
              {book.startDate}
            </Text>
          </View>
        )}
        
        {book.endDate && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{t('fields.endDate') || 'Дата окончания'}</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
              {book.endDate}
            </Text>
          </View>
        )}
        
        {book.review ? (
          <View style={styles.infoBlock}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{t('fields.review') || 'Рецензия'}</Text>
            <Text style={[styles.reviewText, { color: theme.textSecondary }]}>
              {book.review}
            </Text>
          </View>
        ) : null}
        
        {book.notes ? (
          <View style={styles.infoBlock}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{t('fields.notes') || 'Заметки'}</Text>
            <Text style={[styles.notesText, { color: theme.textMuted }]}>
              {book.notes}
            </Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  coverContainer: { alignItems: 'center', marginTop: 20, marginBottom: 10 },
  cover: { width: 120, height: 180, borderRadius: 8, resizeMode: 'cover' },
  header: { alignItems: 'center', marginBottom: 30, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  author: { fontSize: 16 },
  infoCard: { backgroundColor: 'transparent', borderRadius: 12, padding: 16, marginBottom: 20, marginHorizontal: 16, borderWidth: 0.5, borderColor: 'rgba(140, 170, 200, 0.2)' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(140, 170, 200, 0.1)' },
  infoBlock: { marginTop: 12, paddingTop: 8 },
  infoLabel: { fontSize: 13, fontWeight: '500', width: '35%' },
  infoValue: { fontSize: 13, fontWeight: '400', flex: 1, textAlign: 'right' },
  reviewText: { fontSize: 14, lineHeight: 20, marginTop: 6, fontStyle: 'italic' },
  notesText: { fontSize: 13, lineHeight: 18, marginTop: 6 },
});
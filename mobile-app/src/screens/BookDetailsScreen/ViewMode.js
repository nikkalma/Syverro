// mobile-app/src/screens/BookDetailsScreen/ViewMode.js
import React from 'react';
import { View, Text } from 'react-native';
import { spacing, radii } from '../../theme/spacing';

export default function ViewMode({ book, lang, theme }) {
  const fields = lang?.fields || {
    author: 'Автор',
    languages: 'Язык прочтения',
    status: 'Статус',
    rating: 'Оценка',
    genres: 'Жанры',
    pages: 'Страницы',
    startDate: 'Дата начала',
    endDate: 'Дата окончания',
    notes: 'Заметки',
    review: 'Отзыв',
    authorCountry: 'Страна автора',
    series: 'Серия',
    seriesPosition: 'Номер в серии',
    originalYear: 'Год оригинала',
  };

  const statusText = lang?.status?.[book.status] || book.status;

  return (
    <>
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4, opacity: 0.7 }}>
          {fields.author}
        </Text>
        <Text style={{ color: theme.textPrimary, fontSize: 16, opacity: 0.9 }}>
          {book.author || '—'}
        </Text>
      </View>

      {book.authorCountry ? (
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4, opacity: 0.7 }}>
            {fields.authorCountry}
          </Text>
          <Text style={{ color: theme.textPrimary, fontSize: 16, opacity: 0.9 }}>{book.authorCountry}</Text>
        </View>
      ) : null}

      {book.series ? (
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4, opacity: 0.7 }}>
            {fields.series}
          </Text>
          <Text style={{ color: theme.textPrimary, fontSize: 16, opacity: 0.9 }}>
            {book.series} {book.seriesPosition ? `(#${book.seriesPosition})` : ''}
          </Text>
        </View>
      ) : null}

      {book.originalYear ? (
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4, opacity: 0.7 }}>
            {fields.originalYear}
          </Text>
          <Text style={{ color: theme.textPrimary, fontSize: 16, opacity: 0.9 }}>{book.originalYear}</Text>
        </View>
      ) : null}

      {book.languages && book.languages.length > 0 && (
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4, opacity: 0.7 }}>
            {fields.languages}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {book.languages.filter(Boolean).map(language => (
              <View key={language} style={{ paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radii.md, backgroundColor: theme.primary }}>
                <Text style={{ color: '#FFF', opacity: 0.9 }}>{language}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={{ marginBottom: spacing.lg }}>
        <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4, opacity: 0.7 }}>
          {fields.status}
        </Text>
        <Text style={{ color: theme.status, fontSize: 16, opacity: 0.9 }}>
          {statusText}
        </Text>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4, opacity: 0.7 }}>
          {fields.rating}
        </Text>
        <Text style={{ color: theme.textPrimary, fontSize: 16, opacity: 0.9 }}>
          {book.rating ? `${book.rating}/5` : 'Нет оценки'}
        </Text>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4, opacity: 0.7 }}>
          {fields.genres}
        </Text>
        <Text style={{ color: theme.textPrimary, fontSize: 16, opacity: 0.9 }}>
          {Array.isArray(book.genres) && book.genres.length > 0 ? book.genres.join(', ') : '—'}
        </Text>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4, opacity: 0.7 }}>
          {fields.pages}
        </Text>
        <Text style={{ color: theme.textPrimary, fontSize: 16, opacity: 0.9 }}>{book.pages || '—'}</Text>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4, opacity: 0.7 }}>
          {fields.startDate}
        </Text>
        <Text style={{ color: theme.textPrimary, fontSize: 16, opacity: 0.9 }}>{book.startDate || '—'}</Text>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4, opacity: 0.7 }}>
          {fields.endDate}
        </Text>
        <Text style={{ color: theme.textPrimary, fontSize: 16, opacity: 0.9 }}>{book.endDate || '—'}</Text>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4, opacity: 0.7 }}>
          {fields.notes}
        </Text>
        <Text style={{ color: theme.textPrimary, fontSize: 16, opacity: 0.9 }}>{book.notes || '—'}</Text>
      </View>

      {book.review && book.review.length > 0 && (
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4, opacity: 0.7 }}>
            📝 {fields.review}
          </Text>
          <Text style={{ color: theme.textPrimary, fontSize: 15, lineHeight: 22, opacity: 0.9 }}>
            {book.review}
          </Text>
        </View>
      )}
    </>
  );
}
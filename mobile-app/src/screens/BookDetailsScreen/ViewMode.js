import React from 'react';
import { View, Text } from 'react-native';

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
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4 }}>
          {fields.author}
        </Text>
        <Text style={{ color: theme.textPrimary, fontSize: 16 }}>
          {book.author || '—'}
        </Text>
      </View>

      {book.authorCountry ? (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4 }}>
            {fields.authorCountry}
          </Text>
          <Text style={{ color: theme.textPrimary, fontSize: 16 }}>{book.authorCountry}</Text>
        </View>
      ) : null}

      {book.series ? (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4 }}>
            {fields.series}
          </Text>
          <Text style={{ color: theme.textPrimary, fontSize: 16 }}>
            {book.series} {book.seriesPosition ? `(#${book.seriesPosition})` : ''}
          </Text>
        </View>
      ) : null}

      {book.originalYear ? (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4 }}>
            {fields.originalYear}
          </Text>
          <Text style={{ color: theme.textPrimary, fontSize: 16 }}>{book.originalYear}</Text>
        </View>
      ) : null}

      {book.languages && book.languages.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4 }}>
            {fields.languages}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {book.languages.filter(Boolean).map(language => (
              <View key={language} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: theme.primary }}>
                <Text style={{ color: '#FFF' }}>{language}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4 }}>
          {fields.status}
        </Text>
        <Text style={{ color: theme.status, fontSize: 16 }}>
          {statusText}
        </Text>
      </View>

       {book.rating && (() => {
  const ratingNum = Number(book.rating);
  console.log(`📊 Книга: ${book.title}, рейтинг: ${book.rating} (тип: ${typeof book.rating}), после Number: ${ratingNum}`);
  if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
    console.log(`❌ Ошибка: рейтинг вне диапазона 0-5: ${ratingNum}`);
    return null;
  }
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4 }}>
        {fields.rating}
      </Text>
      <Text style={{ color: theme.textPrimary, fontSize: 16 }}>
        {'⭐'.repeat(ratingNum)}{'☆'.repeat(5 - ratingNum)}
      </Text>
    </View>
  );
})()}

      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4 }}>
          {fields.genres}
        </Text>
        <Text style={{ color: theme.textPrimary, fontSize: 16 }}>
          {Array.isArray(book.genres) && book.genres.length > 0 ? book.genres.join(', ') : '—'}
        </Text>
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4 }}>
          {fields.pages}
        </Text>
        <Text style={{ color: theme.textPrimary, fontSize: 16 }}>{book.pages || '—'}</Text>
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4 }}>
          {fields.startDate}
        </Text>
        <Text style={{ color: theme.textPrimary, fontSize: 16 }}>{book.startDate || '—'}</Text>
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4 }}>
          {fields.endDate}
        </Text>
        <Text style={{ color: theme.textPrimary, fontSize: 16 }}>{book.endDate || '—'}</Text>
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4 }}>
          {fields.notes}
        </Text>
        <Text style={{ color: theme.textPrimary, fontSize: 16 }}>{book.notes || '—'}</Text>
      </View>

      {book.review && book.review.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4 }}>
            📝 {fields.review}
          </Text>
          <Text style={{ color: theme.textPrimary, fontSize: 15, lineHeight: 22 }}>
            {book.review}
          </Text>
        </View>
      )}
    </>
  );
}
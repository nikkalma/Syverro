import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useStore } from '../../store';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export default function ViewMode({ bookId, onEdit }) {
  const { books } = useStore();
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  const book = books.find(b => b.id === bookId);
  
  if (!book) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Книга не найдена</Text>
      </View>
    );
  }
  
  // Преобразование рейтинга (если 10-балльный -> в 5-балльный для отображения)
  const displayRating = book.rating ? (book.rating / 2).toFixed(1) : 0;
  const ratingOutOf = book.rating ? 5 : 0;
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{book.title}</Text>
        <Text style={[styles.author, { color: theme.secondaryText }]}>{book.author}</Text>
      </View>
      
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.secondaryText }]}>
            {t('bookDetails.status') || 'Статус'}:
          </Text>
          <Text style={[styles.infoValue, { color: theme.text }]}>{book.status}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.secondaryText }]}>
            {t('bookDetails.progress') || 'Прогресс'}:
          </Text>
          <Text style={[styles.infoValue, { color: theme.text }]}>
            {book.currentPage || 0} / {book.totalPages || 0} {t('bookDetails.pages') || 'стр.'}
          </Text>
        </View>
        
        {book.rating > 0 && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.secondaryText }]}>
              {t('bookDetails.rating') || 'Оценка'}:
            </Text>
            <Text style={[styles.infoValue, { color: theme.primary }]}>
              {displayRating} / {ratingOutOf}
            </Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.primary }]} onPress={onEdit}>
        <Text style={styles.editButtonText}>{t('common.edit') || 'Редактировать'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  author: { fontSize: 16, marginTop: 5 },
  infoCard: { backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 12, padding: 16, marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '500' },
  editButton: { padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  editButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
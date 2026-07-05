// src/screens/QuotesScreen.tsx
import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, Alert, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useStore } from '../store';
import { spacing, radii } from '../theme/spacing';
import type { Quote } from '../store/slices/quotesSlice';
import type { Book } from '../types/book.types';

interface QuotesScreenProps {
  navigation: any;
}

export default function QuotesScreen({ navigation }: QuotesScreenProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { quotes, books, updateQuoteNote, deleteQuote } = useStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [editNote, setEditNote] = useState('');
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  
  const booksWithQuotes = useMemo(() => {
    const bookIds = [...new Set(quotes.map((q: Quote) => q.bookId))];
    return bookIds.map(id => books.find((b: Book) => b.id === id)).filter(Boolean) as Book[];
  }, [quotes, books]);
  
  const filteredQuotes = useMemo(() => {
    let filtered = [...quotes];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((q: Quote) => q.text.toLowerCase().includes(query));
    }
    
    if (selectedBookId) {
      filtered = filtered.filter((q: Quote) => q.bookId === selectedBookId);
    }
    
    filtered.sort((a, b) => b.createdAt - a.createdAt);
    
    return filtered;
  }, [quotes, searchQuery, selectedBookId]);
  
  const handleEditNote = (quote: Quote) => {
    setEditingQuote(quote);
    setEditNote(quote.note || '');
    setNoteModalVisible(true);
  };
  
  const handleSaveNote = () => {
    if (editingQuote) {
      updateQuoteNote(editingQuote.id, editNote);
      setNoteModalVisible(false);
      setEditingQuote(null);
      setEditNote('');
    }
  };
  
  const handleDeleteQuote = (quoteId: string) => {
    Alert.alert(
      t('quotes.deleteConfirm') || 'Удалить цитату?',
      t('quotes.deleteConfirmMessage') || 'Это действие нельзя отменить',
      [
        { text: t('common.cancel') || 'Отмена', style: 'cancel' },
        { text: t('common.delete') || 'Удалить', style: 'destructive', onPress: () => deleteQuote(quoteId) }
      ]
    );
  };
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };
  
  const formatSessionTime = (minutes: number | null) => {
    if (!minutes && minutes !== 0) return null;
    if (minutes < 60) return `${minutes} ${t('session.pagesRead') || 'мин'}`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ч ${mins} мин`;
  };
  
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 50, paddingHorizontal: 24, marginBottom: 20 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 15 }} activeOpacity={0.4}>
          <Text style={{ color: theme.textPrimary, fontSize: 28 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: theme.textPrimary, fontSize: 28, fontWeight: 'bold' }}>📜 {t('quotes.title')}</Text>
      </View>
      
      <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
        <TextInput
          style={{
            backgroundColor: theme.surface,
            color: theme.textPrimary,
            padding: 12,
            borderRadius: 30,
            borderWidth: 0.5,
            borderColor: theme.border,
          }}
          placeholder={`🔍 ${t('common.search') || 'Поиск...'}`}
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {booksWithQuotes.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 24, marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => setSelectedBookId(null)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: !selectedBookId ? theme.primary : theme.surface,
              marginRight: 8,
              borderWidth: 0.5,
              borderColor: theme.border,
            }}
          >
            <Text style={{ color: !selectedBookId ? '#FFF' : theme.textPrimary }}>{t('filters.all') || 'Все'}</Text>
          </TouchableOpacity>
          {booksWithQuotes.map(book => (
            <TouchableOpacity
              key={book.id}
              onPress={() => setSelectedBookId(book.id)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: selectedBookId === book.id ? theme.primary : theme.surface,
                marginRight: 8,
                borderWidth: 0.5,
                borderColor: theme.border,
              }}
            >
              <Text style={{ color: selectedBookId === book.id ? '#FFF' : theme.textPrimary }} numberOfLines={1}>
                {book.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      
      <FlatList
        data={filteredQuotes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: theme.textSecondary, fontSize: 16 }}>{t('quotes.emptyTitle')}</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 8 }}>{t('quotes.emptyMessage')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{
            backgroundColor: theme.surface,
            borderRadius: radii.lg,
            padding: spacing.lg,
            marginBottom: spacing.md,
            borderWidth: 0.5,
            borderColor: theme.border,
          }}>
            <Text style={{ color: theme.textPrimary, fontSize: 16, lineHeight: 24, fontStyle: 'italic' }}>
              «{item.text}»
            </Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md }}>
              <Text style={{ color: theme.primary, fontSize: 12 }}>
                {item.bookTitle}
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                {formatDate(item.createdAt)}
              </Text>
            </View>
            
            {item.page && (
              <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: spacing.xs }}>
                📖 {t('quotes.page')} {item.page}
              </Text>
            )}
            
            {item.sessionTime !== null && item.sessionTime !== undefined && (
              <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: spacing.xs }}>
                ⏱️ {formatSessionTime(item.sessionTime)} {t('quotes.readingTime')}
              </Text>
            )}
            
            {item.note && (
              <View style={{ marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 0.5, borderTopColor: theme.border }}>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                  💭 {item.note}
                </Text>
              </View>
            )}
            
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.lg, marginTop: spacing.md }}>
              <TouchableOpacity onPress={() => handleEditNote(item)}>
                <Text style={{ color: theme.primary, fontSize: 12 }}>✏️ {t('quotes.editNote')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteQuote(item.id)}>
                <Text style={{ color: theme.error, fontSize: 12 }}>🗑️ {t('quotes.delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      
      <Modal visible={noteModalVisible} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: theme.surface, borderRadius: radii.xl, padding: spacing.xl }}>
            <Text style={{ color: theme.textPrimary, fontSize: 18, marginBottom: spacing.lg, textAlign: 'center' }}>
              {t('quotes.editNote')}
            </Text>
            
            <TextInput
              style={{
                backgroundColor: theme.background,
                color: theme.textPrimary,
                padding: spacing.md,
                borderRadius: radii.md,
                borderWidth: 0.5,
                borderColor: theme.border,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
              placeholder={t('quotes.notePlaceholder')}
              placeholderTextColor={theme.textMuted}
              value={editNote}
              onChangeText={setEditNote}
              multiline
            />
            
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }}>
              <TouchableOpacity
                onPress={() => setNoteModalVisible(false)}
                style={{ flex: 1, padding: spacing.md, borderRadius: radii.full, borderWidth: 0.5, borderColor: theme.border, alignItems: 'center' }}
              >
                <Text style={{ color: theme.textSecondary }}>{t('common.cancel') || 'Отмена'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveNote}
                style={{ flex: 1, padding: spacing.md, borderRadius: radii.full, backgroundColor: theme.primary, alignItems: 'center' }}
              >
                <Text style={{ color: '#FFF' }}>{t('common.save') || 'Сохранить'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
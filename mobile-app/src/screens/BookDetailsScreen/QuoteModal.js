import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import useStore from '../../store';        // ← ЭТОТ ИМПОРТ ОБЯЗАТЕЛЕН
import { spacing, radii } from '../../theme/spacing';

console.log('useStore:', useStore);

export default function QuoteModal({ visible, bookId, onClose }) {
  const { theme } = useTheme();
  const { quotes, addQuote, deleteQuote, getQuotesByBook } = useStore();
  const [newQuoteText, setNewQuoteText] = useState('');
  
  const bookQuotes = getQuotesByBook(bookId);

  const handleAddQuote = () => {
    if (!newQuoteText.trim()) {
      Alert.alert('Ошибка', 'Введите текст цитаты');
      return;
    }
    addQuote(bookId, newQuoteText);
    setNewQuoteText('');
  };

  const handleDeleteQuote = (quoteId) => {
    Alert.alert(
      'Удалить цитату?',
      'Это действие нельзя отменить',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Удалить', style: 'destructive', onPress: () => deleteQuote(quoteId) }
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' }}>
        <View style={{ flex: 1, backgroundColor: theme.background, marginTop: 50, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          <View style={{ padding: spacing.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
              <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: 'bold' }}>📝 Цитаты</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={{ color: theme.primary, fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Поле добавления */}
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl }}>
              <TextInput
                value={newQuoteText}
                onChangeText={setNewQuoteText}
                placeholder="Введите цитату..."
                placeholderTextColor={theme.textMuted}
                multiline
                style={{
                  flex: 1,
                  backgroundColor: theme.surface,
                  color: theme.textPrimary,
                  padding: spacing.md,
                  borderRadius: radii.md,
                  minHeight: 60,
                }}
              />
              <TouchableOpacity
                onPress={handleAddQuote}
                style={{
                  backgroundColor: theme.primary,
                  paddingHorizontal: spacing.md,
                  borderRadius: radii.md,
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 24 }}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Список цитат */}
            <FlatList
              data={bookQuotes}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={{
                  backgroundColor: theme.surface,
                  borderRadius: radii.lg,
                  padding: spacing.md,
                  marginBottom: spacing.md,
                }}>
                  <Text style={{ color: theme.textPrimary, fontSize: 15, lineHeight: 22 }}>
                    ❝ {item.text} ❞
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteQuote(item.id)}
                    style={{ alignSelf: 'flex-end', marginTop: spacing.sm }}
                  >
                    <Text style={{ color: theme.error, fontSize: 14 }}>🗑 Удалить</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 40 }}>
                  Нет цитат. Добавьте первую ✨
                </Text>
              }
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
// src/screens/LibraryScreen.tsx
import React, { useState, useMemo, useRef } from 'react';
import {
  View, FlatList, Dimensions, TouchableOpacity, TextInput,
  Modal, StyleSheet, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useStore } from '../store';
import { useLanguage } from '../context/LanguageContext';
import BookCover from '../components/BookCover';
import { Text } from '../components/Text';
import { spacing, radii } from '../theme/spacing';
import type { Book } from '../types/book.types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 32) / 3;

interface AnimatedBookCardProps {
  item: Book;
  onPress: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  theme: any;
}

const AnimatedBookCard = ({ item, onPress, onToggleFavorite, theme }: AnimatedBookCardProps) => {
  const coverOpacity = useRef(new Animated.Value(1)).current;
  const titleOpacity = useRef(new Animated.Value(1)).current;
  const authorOpacity = useRef(new Animated.Value(0.9)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(coverOpacity, { toValue: 0.6, duration: 120, useNativeDriver: true }),
      Animated.timing(titleOpacity, { toValue: 0.7, duration: 120, useNativeDriver: true }),
      Animated.timing(authorOpacity, { toValue: 0.6, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(coverOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.timing(titleOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.timing(authorOpacity, { toValue: 0.9, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  return (
    <TouchableOpacity
      onPress={() => onPress(item.id)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ width: CARD_WIDTH, marginBottom: spacing.lg }}
      activeOpacity={1}
    >
      <View style={{ position: 'relative' }}>
        <BookCover
          coverUrl={item.cover}
          title={item.title}
          width={CARD_WIDTH}
          height={CARD_WIDTH * 1.4}
          opacity={coverOpacity as any}
        />
        
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onToggleFavorite(item.id);
          }}
          style={{
            position: 'absolute',
            top: spacing.sm,
            right: spacing.sm,
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: radii.full,
            padding: spacing.xs,
            zIndex: 10,
          }}
        >
          <Text style={{ fontSize: 12, color: item.favorite ? '#FF6B6B' : '#FFF' }}>
            {item.favorite ? '❤️' : '♡'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={{ marginTop: spacing.sm, paddingHorizontal: spacing.xs }}>
        <Animated.Text
          numberOfLines={1}
          style={{ 
            color: theme.textPrimary,
            fontSize: 13,
            fontWeight: '500',
            opacity: titleOpacity,
          }}
        >
          {item.title || 'Без названия'}
        </Animated.Text>
        <Animated.Text
          numberOfLines={1}
          style={{ 
            color: theme.textSecondary,
            fontSize: 11,
            opacity: authorOpacity,
            marginTop: 2,
          }}
        >
          {item.author || 'Неизвестный автор'}
        </Animated.Text>
        {item.rating ? (
          <Text style={{ color: theme.warning, fontSize: 10, marginTop: 4, opacity: 0.7 }}>
            {item.rating}/5
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

export default function LibraryScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { books, addBook, toggleFavorite } = useStore();

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');

  const STATUSES = [
    { key: 'all', label: t('filters.all') || 'Все книги' },
    { key: 'reading', label: t('status.reading') || 'Читаю' },
    { key: 'finished', label: t('status.finished') || 'Прочитано' },
    { key: 'planned', label: t('status.planned') || 'В планах' },
    { key: 'rereading', label: t('status.rereading') || 'Перечитываю' },
    { key: 'postponed', label: t('status.postponed') || 'Отложено' },
    { key: 'abandoned', label: t('status.abandoned') || 'Брошено' },
  ];

  const SORT_OPTIONS = [
    { key: 'date', label: t('sort.byDate') || 'По дате добавления', icon: 'calendar-outline' },
    { key: 'title', label: t('sort.byTitle') || 'По названию', icon: 'text-outline' },
    { key: 'author', label: t('sort.byAuthor') || 'По автору', icon: 'person-outline' },
    { key: 'rating', label: t('sort.byRating') || 'По рейтингу', icon: 'star-outline' },
    { key: 'progress', label: t('sort.byProgress') || 'По прогрессу', icon: 'trending-up-outline' },
  ];

  const filteredByStatus = useMemo(() => {
    if (selectedStatus === 'all') return books;
    return books.filter((book: Book) => book.status === selectedStatus);
  }, [books, selectedStatus]);

  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return filteredByStatus;
    const query = searchQuery.toLowerCase().trim();
    return filteredByStatus.filter((book: Book) => {
      const titleMatch = book.title?.toLowerCase().includes(query);
      const authorMatch = book.author?.toLowerCase().includes(query);
      const genresMatch = book.genres?.some(g => g.toLowerCase().includes(query));
      return titleMatch || authorMatch || genresMatch;
    });
  }, [filteredByStatus, searchQuery]);

  const sortedBooks = useMemo(() => {
    const booksCopy = [...filteredBySearch];
    switch (sortBy) {
      case 'date':
        return booksCopy.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      case 'title':
        return booksCopy.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      case 'author':
        return booksCopy.sort((a, b) => (a.author || '').localeCompare(b.author || ''));
      case 'rating':
        return booksCopy.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'progress':
        return booksCopy.sort((a, b) => {
          const progressA = (a.currentPage || 0) / (a.totalPages || 1);
          const progressB = (b.currentPage || 0) / (b.totalPages || 1);
          return progressB - progressA;
        });
      default:
        return booksCopy;
    }
  }, [filteredBySearch, sortBy]);

  const getStatusLabel = () => {
    const found = STATUSES.find(s => s.key === selectedStatus);
    return found ? found.label : 'Все книги';
  };

  const getEmptyStateText = () => {
    if (searchQuery) return t('common.notFound') || 'Ничего не найдено';
    if (selectedStatus !== 'all') return `${t('common.noBooksWithStatus') || 'Нет книг со статусом'} "${getStatusLabel()}"`;
    return t('empty.title') || 'В библиотеке пока нет книг';
  };

  const handleBookPress = (bookId: string) => {
    navigation.navigate('BookDetails', { bookId });
  };

  const handleAddBook = async () => {
    if (!newBookTitle.trim()) {
      alert(t('errors.emptyFields') || 'Введите название книги');
      return;
    }

    const newBook: Omit<Book, 'id' | 'createdAt'> = {
      title: newBookTitle.trim(),
      author: newBookAuthor.trim() || t('common.unknownAuthor') || 'Неизвестный автор',
      status: 'planned',
      rating: null,
      cover: null,
      section: null,
      genres: [],
      totalPages: 0,
      currentPage: 0,
      startDate: null,
      endDate: null,
      notes: '',
      languages: [],
      review: '',
      favorite: false,
      authorCountry: null,
      series: null,
      seriesPosition: null,
      originalYear: null,
      readingFormat: 'reading',
      lastRead: null,
    };

    await addBook(newBook);
    setNewBookTitle('');
    setNewBookAuthor('');
    setAddModalVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t('library.title') || 'Библиотека'}</Text>

      <View style={styles.controlsRow}>
        <TouchableOpacity onPress={() => setShowSearch(!showSearch)} style={styles.iconButton} activeOpacity={0.7}>
          <Ionicons name="search-outline" size={22} color={theme.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={styles.iconButton} activeOpacity={0.7}>
          <Ionicons name="options-outline" size={22} color={theme.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setSortModalVisible(true)} style={styles.iconButton} activeOpacity={0.7}>
          <Ionicons name="funnel-outline" size={22} color={theme.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setAddModalVisible(true)} style={[styles.addButton, { backgroundColor: theme.primary }]}>
          <Ionicons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {showSearch && (
        <TextInput
          style={[styles.searchInput, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
          placeholder={`🔍 ${t('placeholders.search') || 'Поиск...'}`}
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
      )}

      <Text style={[styles.resultsCount, { color: theme.textMuted }]}>
        {t('common.found') || 'Найдено'}: {sortedBooks.length} {t('books.count') || 'книг'}
      </Text>

      <FlatList
        data={sortedBooks}
        keyExtractor={item => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <AnimatedBookCard 
            item={item} 
            onPress={handleBookPress}
            onToggleFavorite={toggleFavorite}
            theme={theme}
          />
        )}
        columnWrapperStyle={{ justifyContent: 'space-between', gap: spacing.sm }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>{getEmptyStateText()}</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
      />

      {/* Add Book Modal */}
      <Modal visible={addModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{t('buttons.addBook') || 'Добавить книгу'}</Text>
            
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.border }]}
              placeholder={t('placeholders.title') || 'Название книги *'}
              placeholderTextColor={theme.textMuted}
              value={newBookTitle}
              onChangeText={setNewBookTitle}
              autoFocus
            />
            
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.border }]}
              placeholder={t('placeholders.author') || 'Автор'}
              placeholderTextColor={theme.textMuted}
              value={newBookAuthor}
              onChangeText={setNewBookAuthor}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setAddModalVisible(false)} style={[styles.modalButton, styles.cancelButton]}>
                <Text style={{ color: theme.textSecondary }}>{t('common.cancel') || 'Отмена'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddBook} style={[styles.modalButton, styles.saveButton, { backgroundColor: theme.primary }]}>
                <Text style={{ color: '#FFF' }}>{t('common.save') || 'Добавить'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal visible={filterModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{t('filters.title') || 'Фильтр'}</Text>
            {STATUSES.map(status => (
              <TouchableOpacity
                key={status.key}
                onPress={() => { setSelectedStatus(status.key); setFilterModalVisible(false); }}
                style={[styles.modalOption, { backgroundColor: selectedStatus === status.key ? theme.primary : 'transparent' }]}
              >
                <Text style={{ color: selectedStatus === status.key ? '#FFF' : theme.textPrimary }}>{status.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={styles.modalClose}>
              <Text style={{ color: theme.textSecondary }}>{t('common.cancel') || 'Отмена'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal visible={sortModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{t('sort.title') || 'Сортировка'}</Text>
            {SORT_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.key}
                onPress={() => { setSortBy(option.key); setSortModalVisible(false); }}
                style={[styles.modalOption, { backgroundColor: sortBy === option.key ? theme.primary : 'transparent' }]}
              >
                <Ionicons name={option.icon as any} size={18} color={sortBy === option.key ? '#FFF' : theme.textPrimary} />
                <Text style={{ color: sortBy === option.key ? '#FFF' : theme.textPrimary, marginLeft: spacing.sm }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setSortModalVisible(false)} style={styles.modalClose}>
              <Text style={{ color: theme.textSecondary }}>{t('common.cancel') || 'Отмена'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.xxl, paddingTop: 60 },
  headerTitle: { fontSize: 28, fontWeight: '300', marginBottom: spacing.xxl, letterSpacing: -0.5 },
  
  controlsRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xs,
  },
  
  iconButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  
  addButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  
  searchInput: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radii.full, marginBottom: spacing.lg, borderWidth: 0.5, fontSize: 15 },
  resultsCount: { fontSize: 12, marginBottom: spacing.lg, opacity: 0.6 },
  emptyState: { paddingVertical: 60, alignItems: 'center' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xxl },
  modalContent: { borderRadius: radii.xl, padding: spacing.xl },
  modalTitle: { fontSize: 18, fontWeight: '500', marginBottom: spacing.lg, textAlign: 'center' },
  modalInput: { borderWidth: 0.5, borderRadius: radii.md, padding: spacing.md, fontSize: 16, marginBottom: spacing.md },
  modalButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  modalButton: { flex: 1, paddingVertical: spacing.md, borderRadius: radii.full, alignItems: 'center' },
  cancelButton: { borderWidth: 0.5, borderColor: 'rgba(140, 170, 200, 0.3)' },
  saveButton: {},
  
  modalOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radii.md, marginBottom: spacing.sm },
  modalClose: { marginTop: spacing.md, paddingVertical: spacing.md, alignItems: 'center' },
});
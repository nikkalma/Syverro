// src/screens/BookDetailsScreen/index.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useStore } from '../../store';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import ViewMode from './ViewMode';
import EditMode from './EditMode';
import type { Book } from '../../types/book';

interface BookDetailsScreenProps {
  route: any;
  navigation: any;
}

export default function BookDetailsScreen({ route, navigation }: BookDetailsScreenProps) {
  const { bookId } = route.params || {};
  const { books, updateBook, deleteBook, setActiveBook, activeBookId } = useStore();
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  
  const book = books.find((b: Book) => b.id === bookId);
  
  if (!book) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.textPrimary, textAlign: 'center', marginTop: 50 }}>
          {t('bookDetails.notFound') || 'Книга не найдена'}
        </Text>
      </View>
    );
  }
  
  const isActiveBook = activeBookId === book.id;
  
  const initializeEditData = () => ({
    title: book.title || '',
    author: book.author || '',
    status: book.status || 'planned',
    rating: book.rating || 0,
    genres: Array.isArray(book.genres) ? book.genres : (book.genres ? [book.genres] : []),
    languages: Array.isArray(book.languages) ? book.languages : (book.languages ? [book.languages] : []),
    pages: book.totalPages?.toString() || '',
    currentPage: book.currentPage?.toString() || '',
    startDate: book.startDate || '',
    endDate: book.endDate || '',
    notes: book.notes || '',
    review: book.review || '',
    authorCountry: book.authorCountry || '',
    series: book.series || '',
    seriesPosition: book.seriesPosition?.toString() || '',
    originalYear: book.originalYear?.toString() || '',
    activeBookId: isActiveBook,
    readingFormat: book.readingFormat || 'reading',
  });
  
  const handleSave = async (updatedBook: Book) => {
    await updateBook(book.id, updatedBook);
    
    if (updatedBook.activeBookId && !isActiveBook) {
      setActiveBook(book.id);
    } else if (!updatedBook.activeBookId && isActiveBook) {
      setActiveBook(null);
    }
    
    setIsEditing(false);
  };
  
  const handleDelete = () => {
    Alert.alert(
      t('common.confirm') || 'Подтверждение',
      t('bookDetails.deleteConfirm') || 'Вы уверены, что хотите удалить эту книгу?',
      [
        { text: t('common.cancel') || 'Отмена', style: 'cancel' },
        {
          text: t('common.delete') || 'Удалить',
          style: 'destructive',
          onPress: async () => {
            await deleteBook(book.id);
            navigation.goBack();
          }
        }
      ]
    );
  };
  
  const handleSetActive = async () => {
    if (isActiveBook) {
      setActiveBook(null);
    } else {
      setActiveBook(book.id);
      
      if (book.status !== 'reading') {
        await updateBook(book.id, { status: 'reading' });
      }
    }
  };
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerActions}>
        {!isEditing && (
          <>
            <TouchableOpacity onPress={() => {
              setEditData(initializeEditData());
              setIsEditing(true);
            }} style={styles.actionButton}>
              <Ionicons name="pencil" size={22} color={theme.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleSetActive} style={styles.actionButton}>
              <Ionicons 
                name={isActiveBook ? "bookmark" : "bookmark-outline"} 
                size={22} 
                color={isActiveBook ? theme.primary : theme.textPrimary} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
              <Ionicons name="trash-outline" size={22} color="#f44336" />
            </TouchableOpacity>
          </>
        )}
      </View>
      
      {!isEditing ? (
        <ViewMode bookId={book.id} onEdit={() => {
          setEditData(initializeEditData());
          setIsEditing(true);
        }} />
      ) : (
        <EditMode 
          book={book}
          books={books}
          editData={editData}
          setEditData={setEditData}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  actionButton: {
    padding: 8,
    marginLeft: 12,
  },
});
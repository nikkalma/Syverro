import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView
} from 'react-native';
import { useStore } from '../store';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function SessionScreen({ navigation, route }) {
  // 🔥 ПОЛУЧАЕМ АКТИВНУЮ КНИГУ ИЗ STORE
  const { books, activeBookId, addSession, updateBookProgress, setActiveBook } = useStore();
  const { t } = useLanguage();
  const { theme } = useTheme();
  
  // Находим активную книгу
  const book = books.find(b => b.id === activeBookId);
  
  const [currentPage, setCurrentPage] = useState(book?.currentPage?.toString() || '');
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Проверка наличия активной книги
  useEffect(() => {
    if (!activeBookId || !book) {
      Alert.alert(
        t('session.noActiveBookTitle') || 'Нет активной книги',
        t('session.noActiveBookMessage') || 'Пожалуйста, выберите книгу для чтения',
        [{ text: t('common.ok') || 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [activeBookId, book]);

  // Таймер
  useEffect(() => {
    let interval;
    if (isActive && startTime) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, startTime]);

  if (!book) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Загрузка...</Text>
      </View>
    );
  }

  const handleStartSession = () => {
    const page = parseInt(currentPage);
    if (isNaN(page) || page < book.currentPage || page > book.totalPages) {
      Alert.alert(
        t('common.error') || 'Ошибка',
        t('session.invalidPage', { current: book.currentPage, total: book.totalPages }) ||
        `Введите страницу от ${book.currentPage} до ${book.totalPages}`
      );
      return;
    }
    setIsActive(true);
    setStartTime(Date.now());
    setActiveBook(book.id);
  };

  const handleEndSession = async () => {
    if (!isActive) return;
    
    const endPage = parseInt(currentPage);
    const pagesRead = endPage - book.currentPage;
    const durationMinutes = Math.floor(elapsedSeconds / 60);
    
    if (pagesRead <= 0) {
      Alert.alert(t('common.error') || 'Ошибка', 'Вы не прочитали ни одной страницы');
      return;
    }
    
    const newSession = {
      id: Date.now().toString(),
      bookId: book.id,
      startPage: book.currentPage,
      endPage: endPage,
      pagesRead: pagesRead,
      duration: elapsedSeconds,
      startTime: startTime,
      endTime: Date.now(),
      date: new Date().toISOString()
    };
    
    await addSession(newSession);
    await updateBookProgress(book.id, {
      currentPage: endPage,
      lastRead: new Date().toISOString()
    });
    
    setIsActive(false);
    Alert.alert(
      t('common.success') || 'Успех!',
      t('session.sessionComplete', { pages: pagesRead, minutes: durationMinutes }) ||
      `Прочитано ${pagesRead} страниц за ${durationMinutes} мин.`
    );
    navigation.goBack();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{book.title}</Text>
        <Text style={[styles.author, { color: theme.secondaryText }]}>{book.author}</Text>
      </View>

      <View style={styles.progressContainer}>
        <Text style={[styles.label, { color: theme.text }]}>
          {t('session.currentPage') || 'Текущая страница'}
        </Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          keyboardType="numeric"
          value={currentPage}
          onChangeText={setCurrentPage}
          editable={!isActive}
        />
        <Text style={[styles.totalPages, { color: theme.secondaryText }]}>
          {t('session.ofPages') || 'из'} {book.totalPages}
        </Text>
      </View>

      {isActive && (
        <View style={styles.timerContainer}>
          <Text style={[styles.timer, { color: theme.primary }]}>
            {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, '0')}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, isActive ? styles.stopButton : styles.startButton]}
        onPress={isActive ? handleEndSession : handleStartSession}
      >
        <Text style={styles.buttonText}>
          {isActive ? (t('session.endSession') || 'Завершить') : (t('session.startSession') || 'Начать')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { alignItems: 'center', marginBottom: 30, marginTop: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  author: { fontSize: 16, marginTop: 5 },
  progressContainer: { marginBottom: 30 },
  label: { fontSize: 16, marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 18, textAlign: 'center' },
  totalPages: { textAlign: 'center', marginTop: 8 },
  timerContainer: { alignItems: 'center', marginBottom: 30 },
  timer: { fontSize: 48, fontWeight: 'bold' },
  button: { padding: 16, borderRadius: 12, alignItems: 'center', marginHorizontal: 20 },
  startButton: { backgroundColor: '#4CAF50' },
  stopButton: { backgroundColor: '#f44336' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
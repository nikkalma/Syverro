// mobile-app/src/screens/SessionScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import useStore from '../store';
import { spacing, radii } from '../theme/spacing';

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins} мин ${secs} сек`;
};

export default function SessionScreen({ navigation, lang }) {
  const { theme } = useTheme();
  const store = useStore();

  const [selectedBookId, setSelectedBookId] = useState(null);
  const [pageInput, setPageInput] = useState('');
  const [timer, setTimer] = useState(0);
  const timerInterval = useRef(null);

  const books = store.books;
  const sessions = store.sessions;
  const activeSession = store.activeSession;
  const startSession = store.startSession;
  const updateSessionPage = store.updateSessionPage;
  const endSession = store.endSession;
  const getBookStats = store.getBookStats;
  const getActiveBook = store.getActiveBook;

  const activeBook = getActiveBook();
  const readingBooks = books.filter(b => b.status === 'reading');

  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (selectedBookId) {
      const newStats = getBookStats(selectedBookId);
      setStats(newStats);
    }
  }, [selectedBookId, sessions]);

  useEffect(() => {
    if (activeSession) {
      setSelectedBookId(activeSession.bookId);
      setTimer(Math.floor((Date.now() - activeSession.startTime) / 1000));
    } else if (activeBook) {
      setSelectedBookId(activeBook.id);
      const book = books.find(b => b.id === activeBook.id);
      setPageInput(book?.pagesRead?.toString() || '0');
    }
  }, [activeSession, activeBook, books]);

  useEffect(() => {
    if (activeSession) {
      timerInterval.current = setInterval(() => {
        setTimer(Math.floor((Date.now() - activeSession.startTime) / 1000));
      }, 1000);
    } else if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [activeSession]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!selectedBookId) {
      Alert.alert('Ошибка', 'Выберите книгу для чтения');
      return;
    }
    const book = books.find(b => b.id === selectedBookId);
    const startPage = book?.manualStartPage || parseInt(pageInput) || 0;
    startSession(selectedBookId, startPage);
  };

  const handleStop = () => {
    if (!activeSession) return;

    const endPage = parseInt(pageInput) || activeSession.startPage;
    const completed = endSession(endPage);

    if (completed) {
      Alert.alert(
        '✅ Сессия завершена',
        `Прочитано: ${completed.pagesRead} стр.\nВремя: ${formatDuration(completed.duration)}`
      );
    }
  };

  const handlePageChange = (text) => {
    const num = parseInt(text) || 0;
    setPageInput(num.toString());
    if (activeSession) {
      updateSessionPage(num);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: 60 }}
    >
      <Text style={{ color: theme.textPrimary, fontSize: 28, fontWeight: 'bold', marginBottom: spacing.md }}>
        📖 Сессия чтения
      </Text>

      <View style={{ marginBottom: spacing.xl }}>
        <Text style={{ color: theme.textSecondary, marginBottom: spacing.sm }}>
          Выберите книгу:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {readingBooks.map(book => (
            <TouchableOpacity
              key={book.id}
              onPress={() => setSelectedBookId(book.id)}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                backgroundColor: selectedBookId === book.id ? theme.primary : theme.surface,
                borderRadius: radii.lg,
                marginRight: spacing.sm,
              }}
            >
              <Text style={{ color: selectedBookId === book.id ? '#FFF' : theme.textPrimary }}>
                {book.title.length > 20 ? book.title.slice(0, 20) + '…' : book.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {selectedBookId && (
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: 'bold' }}>
            {books.find(b => b.id === selectedBookId)?.title}
          </Text>
          <Text style={{ color: theme.textSecondary }}>
            {books.find(b => b.id === selectedBookId)?.author}
          </Text>
        </View>
      )}

      <View style={{ marginBottom: spacing.xl }}>
        <Text style={{ color: theme.textSecondary, marginBottom: spacing.sm }}>
          📍 Страница:
        </Text>
        <TextInput
          value={pageInput}
          onChangeText={handlePageChange}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={theme.textMuted}
          style={{
            padding: spacing.md,
            borderRadius: radii.md,
            backgroundColor: theme.surface,
            color: theme.textPrimary,
            fontSize: 18,
            textAlign: 'center',
          }}
        />
      </View>

      {activeSession && (
        <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
          <Text style={{ color: theme.textPrimary, fontSize: 48, fontWeight: 'bold' }}>
            {formatTime(timer)}
          </Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl }}>
        <TouchableOpacity
          onPress={handleStart}
          disabled={!!activeSession}
          style={{
            flex: 1,
            padding: spacing.md,
            borderRadius: radii.lg,
            backgroundColor: activeSession ? theme.surface : theme.success,
            alignItems: 'center',
            opacity: activeSession ? 0.5 : 1,
          }}
        >
          <Text style={{ color: activeSession ? theme.textSecondary : '#FFF', fontWeight: 'bold' }}>
            ▶️ Старт
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleStop}
          disabled={!activeSession}
          style={{
            flex: 1,
            padding: spacing.md,
            borderRadius: radii.lg,
            backgroundColor: activeSession ? theme.error : theme.surface,
            alignItems: 'center',
            opacity: !activeSession ? 0.5 : 1,
          }}
        >
          <Text style={{ color: activeSession ? '#FFF' : theme.textSecondary, fontWeight: 'bold' }}>
            ⏹️ Стоп
          </Text>
        </TouchableOpacity>
      </View>

      {stats && stats.totalSessions > 0 && (
        <View style={{ padding: spacing.md, backgroundColor: theme.surface, borderRadius: radii.xl }}>
          <Text style={{ color: theme.textPrimary, fontWeight: 'bold', marginBottom: spacing.sm }}>
            📊 Статистика
          </Text>
          <Text style={{ color: theme.textSecondary }}>
            Всего сессий: {stats.totalSessions}
          </Text>
          <Text style={{ color: theme.textSecondary }}>
            Всего страниц: {stats.totalPagesRead}
          </Text>
          <Text style={{ color: theme.textSecondary }}>
            Общее время: {formatDuration(stats.totalTimeSeconds)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
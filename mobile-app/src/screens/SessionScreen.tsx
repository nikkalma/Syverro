// src/screens/SessionScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Modal
} from 'react-native';
import { useStore } from '../store';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import * as Speech from 'expo-speech';

export default function SessionScreen() {
  const { 
    books, 
    activeBookId, 
    sessions, 
    addSession, 
    updateBookProgress, 
    setActiveBook, 
    addQuote,
    deleteSession,
    deleteSessionsByBook
  } = useStore();
  const { t } = useLanguage();
  const { theme } = useTheme();

  const readingBooks = books.filter(b => b.status === 'reading');
  const [selectedBookId, setSelectedBookId] = useState(activeBookId || readingBooks[0]?.id || null);
  const book = books.find(b => b.id === selectedBookId);

  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pausedDuration, setPausedDuration] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const [quoteModalVisible, setQuoteModalVisible] = useState(false);
  const [quoteText, setQuoteText] = useState('');
  const [quotePage, setQuotePage] = useState('');
  const [quoteNote, setQuoteNote] = useState('');
  const [isListening, setIsListening] = useState(false);

  const bookSessions = sessions.filter(s => s.bookId === selectedBookId).slice(0, 10);

  useEffect(() => {
    if (book) {
      setStartPage(book.currentPage?.toString() || '1');
      setEndPage('');
    }
  }, [selectedBookId, book]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && !isPaused && startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime - pausedDuration) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused, startTime, pausedDuration]);

  if (readingBooks.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centerContent}>
          <Text style={{ color: theme.textPrimary, fontSize: 18, marginBottom: 12 }}>
            {t('session.noActiveBookTitle')}
          </Text>
          <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>
            {t('session.noActiveBookMessage')}
          </Text>
        </View>
      </View>
    );
  }

  const handleStartSession = () => {
    if (!book) return;
    
    const page = parseInt(startPage);
    if (isNaN(page) || page < 1 || page > book.totalPages) {
      Alert.alert(t('common.error'), t('session.invalidPage', { current: 1, total: book.totalPages }));
      return;
    }
    
    setActiveBook(book.id);
    setIsActive(true);
    setIsPaused(false);
    setStartTime(Date.now());
    setPausedDuration(0);
    setElapsedSeconds(0);
    setEndPage('');
  };

  const handlePauseSession = () => {
    if (!isActive) return;
    if (isPaused) {
      const now = Date.now();
      setPausedDuration(prev => prev + (now - (startTime || 0) - pausedDuration - elapsedSeconds * 1000));
      setIsPaused(false);
    } else {
      setIsPaused(true);
    }
  };

  const handleEndSession = async () => {
    if (!isActive || !book) return;
    
    const finalEndPage = parseInt(endPage);
    const currentStartPage = parseInt(startPage);
    
    if (isNaN(finalEndPage)) {
      Alert.alert(t('common.error'), t('session.enterEndPageError'));
      return;
    }
    
    if (finalEndPage <= currentStartPage) {
      Alert.alert(t('common.error'), t('session.endPageMustBeGreater', { start: currentStartPage }));
      return;
    }
    
    if (finalEndPage > book.totalPages) {
      Alert.alert(t('common.error'), t('session.invalidPage', { current: 1, total: book.totalPages }));
      return;
    }
    
    const pagesRead = finalEndPage - currentStartPage;
    const durationMinutes = Math.floor(elapsedSeconds / 60);
    
    const newSession = {
      id: Date.now().toString(),
      bookId: book.id,
      bookTitle: book.title,
      bookAuthor: book.author,
      startPage: currentStartPage,
      endPage: finalEndPage,
      pagesRead: pagesRead,
      duration: elapsedSeconds,
      startTime: startTime,
      endTime: Date.now(),
      date: new Date().toISOString(),
      status: 'completed' as const
    };
    
    await addSession(newSession);
    await updateBookProgress(book.id, {
      currentPage: finalEndPage,
      lastRead: new Date().toISOString()
    });
    
    setIsActive(false);
    setIsPaused(false);
    setEndPage('');
    setStartPage(finalEndPage.toString());
    
    Alert.alert(
      t('common.success'),
      t('session.sessionComplete', { pages: pagesRead, minutes: durationMinutes })
    );
  };

  const handleAddQuote = () => {
    if (!quoteText.trim()) {
      Alert.alert(t('common.error'), t('quotes.enterQuoteText'));
      return;
    }
    
    const sessionMinutes = Math.floor(elapsedSeconds / 60);
    
    addQuote({
      text: quoteText.trim(),
      bookId: book!.id,
      bookTitle: book!.title,
      bookAuthor: book!.author,
      sessionId: isActive ? 'active_' + Date.now() : null,
      sessionTime: isActive ? sessionMinutes : null,
      page: quotePage ? parseInt(quotePage) : null,
      note: quoteNote.trim() || null,
    });
    
    setQuoteText('');
    setQuotePage('');
    setQuoteNote('');
    setQuoteModalVisible(false);
    Alert.alert(t('common.success'), t('quotes.quoteSaved'));
  };

  const startVoiceInput = () => {
    setIsListening(true);
    Alert.alert(t('quotes.voiceInput'), t('quotes.voiceInputDeveloping'));
    setIsListening(false);
  };

  const handleDeleteSession = (sessionId: string) => {
    Alert.alert(
      t('session.deleteSession') || 'Удалить сессию?',
      t('session.deleteSessionConfirm') || 'Это действие нельзя отменить.',
      [
        { text: t('common.cancel') || 'Отмена', style: 'cancel' as const },
        { text: t('common.delete') || 'Удалить', style: 'destructive' as const, onPress: () => deleteSession(sessionId) }
      ]
    );
  };

  const handleClearBookHistory = () => {
    if (!book) return;
    Alert.alert(
      t('session.clearHistory') || 'Очистить историю?',
      (t('session.clearHistoryMessage') || 'Все сессии для книги "{title}" будут удалены.').replace('{title}', book.title),
      [
        { text: t('common.cancel') || 'Отмена', style: 'cancel' as const },
        { text: t('common.clear') || 'Очистить', style: 'destructive' as const, onPress: () => deleteSessionsByBook(selectedBookId) }
      ]
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const selectBook = (bookId: string) => {
    setSelectedBookId(bookId);
    setActiveBook(bookId);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {t('session.selectBook') || 'Выберите книгу'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bookList}>
            {readingBooks.map(b => (
              <TouchableOpacity
                key={b.id}
                onPress={() => selectBook(b.id)}
                style={[
                  styles.bookChip,
                  { 
                    backgroundColor: selectedBookId === b.id ? theme.primary : theme.surface,
                    borderColor: theme.border,
                  }
                ]}
              >
                <Text style={{ 
                  color: selectedBookId === b.id ? '#FFF' : theme.textPrimary,
                  fontWeight: selectedBookId === b.id ? '500' : '400'
                }}>
                  {b.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {book && (
          <>
            <View style={styles.section}>
              <Text style={[styles.bookTitle, { color: theme.textPrimary }]}>{book.title}</Text>
              <Text style={[styles.bookAuthor, { color: theme.textSecondary }]}>{book.author}</Text>
              <Text style={[styles.bookProgress, { color: theme.textMuted }]}>
                {t('bookDetails.progress')}: {book.currentPage || 0} / {book.totalPages || 0} {t('bookDetails.pages')}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                {isActive ? t('session.currentPage') : t('session.startPage')}
              </Text>
              <View style={styles.pageRow}>
                <TextInput
                  style={[styles.pageInput, { color: theme.textPrimary, borderBottomColor: theme.border }]}
                  keyboardType="numeric"
                  value={startPage}
                  onChangeText={setStartPage}
                  editable={!isActive}
                />
                <Text style={[styles.ofPages, { color: theme.textMuted }]}>
                  / {book.totalPages}
                </Text>
              </View>
            </View>

            {isActive && (
              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  {t('session.endPage')}
                </Text>
                <View style={styles.pageRow}>
                  <TextInput
                    style={[styles.pageInput, { color: theme.textPrimary, borderBottomColor: theme.border }]}
                    keyboardType="numeric"
                    value={endPage}
                    onChangeText={setEndPage}
                    placeholder={t('session.enterEndPage')}
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              </View>
            )}

            {isActive && (
              <View style={styles.timerSection}>
                <Text style={[styles.timer, { color: theme.primary }]}>
                  {formatDuration(elapsedSeconds)}
                </Text>
                {isPaused && (
                  <Text style={[styles.pausedLabel, { color: theme.warning }]}>
                    {t('session.paused')}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.buttonRow}>
              {!isActive ? (
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={handleStartSession}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonText}>{t('session.startSession')}</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, isPaused ? styles.resumeButton : styles.pauseButton]}
                    onPress={handlePauseSession}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.buttonText}>
                      {isPaused ? t('session.resume') : t('session.pause')}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.quoteButton]}
                    onPress={() => setQuoteModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.buttonText}>📜</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.stopButton]}
                    onPress={handleEndSession}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.buttonText}>{t('session.endSession')}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.section}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                  {t('session.history')}
                </Text>
                {bookSessions.length > 0 && (
                  <TouchableOpacity onPress={handleClearBookHistory}>
                    <Text style={{ color: theme.error, fontSize: 12 }}>🗑 {t('session.clearHistory') || 'Очистить историю'}</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {bookSessions.length === 0 ? (
                <Text style={{ color: theme.textMuted, textAlign: 'center', paddingVertical: 20 }}>
                  Нет завершённых сессий
                </Text>
              ) : (
                bookSessions.map(s => (
                  <View key={s.id} style={styles.historyItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.historyDate, { color: theme.textMuted }]}>
                        {formatDate(s.startTime)}
                      </Text>
                      <Text style={[styles.historyPages, { color: theme.textPrimary }]}>
                        {s.pagesRead} {t('session.pagesRead')} • {formatDuration(s.duration)}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteSession(s.id)}>
                      <Text style={{ color: theme.error, fontSize: 14 }}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={quoteModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              {t('quotes.addButton')}
            </Text>
            
            <TouchableOpacity
              style={[styles.voiceButton, { backgroundColor: theme.primary }]}
              onPress={startVoiceInput}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#FFF', fontSize: 20 }}>🎤</Text>
              <Text style={{ color: '#FFF', marginLeft: 8 }}>{t('quotes.voiceInput')}</Text>
            </TouchableOpacity>
            
            <Text style={[styles.modalLabel, { color: theme.textSecondary, marginTop: 12 }]}>
              {t('quotes.quotePlaceholder')} *
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.border }]}
              placeholder={t('quotes.quotePlaceholder')}
              placeholderTextColor={theme.textMuted}
              value={quoteText}
              onChangeText={setQuoteText}
              multiline
              numberOfLines={3}
            />
            
            <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>
              {t('quotes.pagePlaceholder')}
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.border }]}
              placeholder={t('quotes.pagePlaceholder')}
              placeholderTextColor={theme.textMuted}
              value={quotePage}
              onChangeText={setQuotePage}
              keyboardType="numeric"
            />
            
            <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>
              {t('quotes.notePlaceholder')}
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.border }]}
              placeholder={t('quotes.notePlaceholder')}
              placeholderTextColor={theme.textMuted}
              value={quoteNote}
              onChangeText={setQuoteNote}
              multiline
              numberOfLines={2}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setQuoteModalVisible(false)} style={[styles.modalButton, styles.cancelButton]}>
                <Text style={{ color: theme.textSecondary }}>{t('quotes.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddQuote} style={[styles.modalButton, styles.saveButton, { backgroundColor: theme.primary }]}>
                <Text style={{ color: '#FFF' }}>{t('quotes.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 60 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  
  bookList: { flexDirection: 'row', marginBottom: 8 },
  bookChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 12 },
  
  bookTitle: { fontSize: 22, fontWeight: '300', lineHeight: 30, marginBottom: 6 },
  bookAuthor: { fontSize: 15, opacity: 0.7, marginBottom: 4 },
  bookProgress: { fontSize: 13, opacity: 0.6 },
  
  divider: { height: 0.5, marginVertical: 20 },
  
  label: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  
  pageRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  pageInput: { flex: 1, fontSize: 20, paddingVertical: 8, borderBottomWidth: 0.5, textAlign: 'center' },
  ofPages: { fontSize: 16, opacity: 0.6, width: 50 },
  
  timerSection: { alignItems: 'center', marginVertical: 20, marginBottom: 28 },
  timer: { fontSize: 52, fontWeight: '300', fontFamily: 'monospace', letterSpacing: 2 },
  pausedLabel: { fontSize: 13, marginTop: 6 },
  
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 20 },
  startButton: { flex: 1, backgroundColor: '#4A5A6A', paddingVertical: 14, borderRadius: 30, alignItems: 'center' },
  actionButton: { flex: 1, paddingVertical: 14, borderRadius: 30, alignItems: 'center' },
  pauseButton: { backgroundColor: '#D4A76A' },
  resumeButton: { backgroundColor: '#6B8F7A' },
  quoteButton: { backgroundColor: '#7A9BC4' },
  stopButton: { backgroundColor: '#C47A7A' },
  buttonText: { color: '#FFF', fontSize: 15, fontWeight: '500', letterSpacing: 0.3 },
  
  historyItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(140, 170, 200, 0.1)',
  },
  historyDate: { fontSize: 12 },
  historyPages: { fontSize: 14, marginTop: 2 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: '500', marginBottom: 16, textAlign: 'center' },
  modalLabel: { fontSize: 12, marginBottom: 6, marginTop: 8 },
  modalInput: { borderWidth: 0.5, borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 8 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 30, alignItems: 'center' },
  cancelButton: { borderWidth: 0.5, borderColor: 'rgba(140, 170, 200, 0.3)' },
  saveButton: {},
  voiceButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 30, marginBottom: 8 },
});
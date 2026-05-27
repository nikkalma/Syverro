import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import useStore from '../../store';
import ViewMode from './ViewMode';
import EditMode from './EditMode';

export default function BookDetailsScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { books, updateBook } = useStore();
  const { bookId, lang } = route.params;
  const book = route.params.book || books?.find(b => b.id === bookId);
  const scrollViewRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [editAuthorCountry, setEditAuthorCountry] = useState(book?.authorCountry || '');
  const [editSeries, setEditSeries] = useState(book?.series || '');
  const [editSeriesPosition, setEditSeriesPosition] = useState(book?.seriesPosition?.toString() || '');
  const [editOriginalYear, setEditOriginalYear] = useState(book?.originalYear?.toString() || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editLanguages, setEditLanguages] = useState(book?.languages || []);
  const [editStatus, setEditStatus] = useState(book?.status || 'planned');
  const [editRating, setEditRating] = useState(book?.rating || '');
  const [editAuthor, setEditAuthor] = useState(book?.author || '');
  const [editGenresArray, setEditGenresArray] = useState(book?.genres || []);
  const [editPages, setEditPages] = useState(book?.pages?.toString() || '');
  const [editStartDate, setEditStartDate] = useState(book?.startDate || '');
  const [editEndDate, setEditEndDate] = useState(book?.endDate || '');
  const [editNotes, setEditNotes] = useState(book?.notes || '');
  const [editReview, setEditReview] = useState(book?.review || '');

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const saveChanges = () => {
    const updatedBook = {
      ...book,
      author: editAuthor,
      status: editStatus,
      rating: editRating ? Number(editRating) : null,
      genres: editGenresArray,
      pages: editPages ? parseInt(editPages) : null,
      startDate: editStartDate,
      endDate: editEndDate,
      notes: editNotes,
      review: editReview,
      languages: editLanguages,
      authorCountry: editAuthorCountry,
      authorCountry: editAuthorCountry,
      series: editSeries,
      seriesPosition: editSeriesPosition ? parseInt(editSeriesPosition) : null,
      originalYear: editOriginalYear ? parseInt(editOriginalYear) : null,    };

    updateBook(bookId, updatedBook);
    navigation.setParams({ book: updatedBook });
    setIsEditing(false);
    Keyboard.dismiss();
    setKeyboardHeight(0);
    setTimeout(() => scrollViewRef.current?.scrollTo({ y: 0, animated: true }), 100);
  };

  if (!book || !theme) {
    return (
      <View style={{ flex: 1, backgroundColor: '#121C24', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#FFF' }}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <ScrollView
          keyboardDismissMode="on-drag"
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: Platform.OS === 'android' ? 50 : 30,
              paddingBottom: isEditing ? (keyboardHeight > 0 ? keyboardHeight + 0 : 0) : 40,
            }}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* Шапка */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.4}>
                <Text style={{ color: theme.textPrimary, fontSize: 28 }}>←</Text>
              </TouchableOpacity>
              <Text style={{ color: theme.textPrimary, fontSize: 22, flex: 1, marginLeft: 10, fontWeight: 'bold' }} numberOfLines={2}>
                {book.title}
              </Text>
              {!isEditing && (
                <TouchableOpacity onPress={() => setIsEditing(true)} style={{ padding: 8 }} activeOpacity={0.4}>
                  <Text style={{ color: theme.primary, fontSize: 24 }}>✏️</Text>
                </TouchableOpacity>
              )}
            </View>

            {!isEditing ? (
              <ViewMode book={book} lang={lang} theme={theme} />
            ) : (
              <EditMode
                book={book}
                books={books}
                editAuthor={editAuthor}
                setEditAuthor={setEditAuthor}
                editStatus={editStatus}
                setEditStatus={setEditStatus}
                editRating={editRating}
                setEditRating={setEditRating}
                editGenresArray={editGenresArray}
                setEditGenresArray={setEditGenresArray}
                editLanguages={editLanguages}
                setEditLanguages={setEditLanguages}
                editPages={editPages}
                setEditPages={setEditPages}
                editStartDate={editStartDate}
                setEditStartDate={setEditStartDate}
                editEndDate={editEndDate}
                setEditEndDate={setEditEndDate}
                editNotes={editNotes}
                setEditNotes={setEditNotes}
                editReview={editReview}
                setEditReview={setEditReview}
                saveChanges={saveChanges}
                setIsEditing={setIsEditing}
                setKeyboardHeight={setKeyboardHeight}
                scrollViewRef={scrollViewRef}
                lang={lang}
                theme={theme}
                editAuthorCountry={editAuthorCountry}
                setEditAuthorCountry={setEditAuthorCountry}
                editSeries={editSeries}
                setEditSeries={setEditSeries}
                editSeriesPosition={editSeriesPosition}
                setEditSeriesPosition={setEditSeriesPosition}
                editOriginalYear={editOriginalYear}
                setEditOriginalYear={setEditOriginalYear}
                
              />
            )}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}
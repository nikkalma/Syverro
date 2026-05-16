import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useState } from 'react';

export default function BookDetailsScreen({ route, navigation }) {
  const { bookId, books, setBooks } = route.params;
  const book = books.find(b => b.id === bookId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState(book.status);
  const [editRating, setEditRating] = useState(book.rating);
  const [editSection, setEditSection] = useState(book.section || '');
  const [editGenres, setEditGenres] = useState(book.genres?.join(', ') || '');
  const [editPages, setEditPages] = useState(book.pages?.toString() || '');
  const [editStartDate, setEditStartDate] = useState(book.startDate || '');
  const [editEndDate, setEditEndDate] = useState(book.endDate || '');
  const [editNotes, setEditNotes] = useState(book.notes || '');
  
  const langStatus = {
    planned: '📌 в планах', reading: '📖 читаю', finished: '✅ прочитано',
    postponed: '⏸ отложено', abandoned: '❌ брошено', rereading: '🔄 перечитываю',
  };
  const statusOptions = ['planned', 'reading', 'finished', 'postponed', 'abandoned', 'rereading'];
  
  const saveChanges = () => {
    const genresArray = editGenres.split(',').map(g => g.trim()).filter(g => g);
    setBooks(prevBooks => prevBooks.map(b =>
      b.id === bookId ? { 
        ...b, status: editStatus, rating: editRating, section: editSection,
        genres: genresArray, pages: editPages ? parseInt(editPages) : null,
        startDate: editStartDate, endDate: editEndDate, notes: editNotes,
      } : b
    ));
    setIsEditing(false);
    Keyboard.dismiss();
  };
  
  if (!book) {
    return (
      <View style={{ flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white' }}>Книга не найдена</Text>
      </View>
    );
  }
  
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        style={{ flex: 1, backgroundColor: '#111' }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 90 }}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          {/* Шапка */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: 'white', fontSize: 28, flex: 1 }}>📖 {book.title}</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)} style={{ padding: 8 }}>
                <Text style={{ color: '#4CAF50', fontSize: 24 }}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Автор */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#aaa', fontSize: 14, marginBottom: 4 }}>Автор</Text>
            <Text style={{ color: 'white', fontSize: 16 }}>{book.author}</Text>
          </View>
          
          {isEditing ? (
            <>
              <Text style={{ color: '#aaa', marginBottom: 5 }}>Статус</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 }}>
                {statusOptions.map(opt => (
                  <TouchableOpacity key={opt} onPress={() => setEditStatus(opt)} style={{
                    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20,
                    backgroundColor: editStatus === opt ? '#4CAF50' : '#333',
                    marginRight: 8, marginBottom: 8,
                  }}>
                    <Text style={{ color: 'white' }}>{langStatus[opt]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={{ color: '#aaa', marginBottom: 5 }}>Оценка (0-10)</Text>
              <TextInput 
                value={String(editRating)} 
                onChangeText={text => setEditRating(Number(text))} 
                keyboardType="numeric"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                style={styles.input}
              />
              
              <Text style={{ color: '#aaa', marginBottom: 5 }}>Раздел (Страна, век)</Text>
              <TextInput 
                value={editSection} 
                onChangeText={setEditSection} 
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                style={styles.input}
              />
              
              <Text style={{ color: '#aaa', marginBottom: 5 }}>Жанры (через запятую)</Text>
              <TextInput 
                value={editGenres} 
                onChangeText={setEditGenres} 
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                style={styles.input}
              />
              
              <Text style={{ color: '#aaa', marginBottom: 5 }}>Количество страниц</Text>
              <TextInput 
                value={editPages} 
                onChangeText={setEditPages} 
                keyboardType="numeric"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                style={styles.input}
              />
              
              <Text style={{ color: '#aaa', marginBottom: 5 }}>Дата начала (ГГГГ-ММ-ДД)</Text>
              <TextInput 
                value={editStartDate} 
                onChangeText={setEditStartDate} 
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                style={styles.input}
              />
              
              <Text style={{ color: '#aaa', marginBottom: 5 }}>Дата окончания (ГГГГ-ММ-ДД)</Text>
              <TextInput 
                value={editEndDate} 
                onChangeText={setEditEndDate} 
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                style={styles.input}
              />
              
              <Text style={{ color: '#aaa', marginBottom: 5 }}>Заметки / отзыв</Text>
              <TextInput 
                value={editNotes} 
                onChangeText={setEditNotes} 
                multiline 
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                style={[styles.input, { minHeight: 80 }]} 
              />
              
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 30 }}>
                <TouchableOpacity onPress={saveChanges} style={[styles.button, { backgroundColor: '#4CAF50', flex: 1 }]}>
                  <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>💾 Сохранить</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  setIsEditing(false);
                  Keyboard.dismiss();
                }} style={[styles.button, { backgroundColor: '#ff4444', flex: 1 }]}>
                  <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>✖️ Отмена</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: '#aaa', fontSize: 14, marginBottom: 4 }}>Статус</Text>
                <Text style={{ color: '#7dd3fc', fontSize: 16 }}>{langStatus[book.status]}</Text>
              </View>
              
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: '#aaa', fontSize: 14, marginBottom: 4 }}>Оценка</Text>
                <Text style={{ color: 'white', fontSize: 16 }}>★ {book.rating} / 10</Text>
              </View>
              
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: '#aaa', fontSize: 14, marginBottom: 4 }}>Раздел</Text>
                <Text style={{ color: 'white', fontSize: 16 }}>{book.section || '—'}</Text>
              </View>
              
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: '#aaa', fontSize: 14, marginBottom: 4 }}>Жанры</Text>
                <Text style={{ color: 'white', fontSize: 16 }}>{book.genres?.join(', ') || '—'}</Text>
              </View>
              
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: '#aaa', fontSize: 14, marginBottom: 4 }}>Страниц</Text>
                <Text style={{ color: 'white', fontSize: 16 }}>{book.pages || '—'}</Text>
              </View>
              
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: '#aaa', fontSize: 14, marginBottom: 4 }}>Даты чтения</Text>
                <Text style={{ color: 'white', fontSize: 16 }}>
                  {book.startDate && book.endDate ? `${book.startDate} → ${book.endDate}` : book.startDate || book.endDate || '—'}
                </Text>
              </View>
              
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: '#aaa', fontSize: 14, marginBottom: 4 }}>Заметки</Text>
                <Text style={{ color: 'white', fontSize: 16 }}>{book.notes || '—'}</Text>
              </View>
              
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 30, padding: 14, backgroundColor: '#333', borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ color: 'white' }}>← Назад</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = {
  input: {
    backgroundColor: '#1c1c1e',
    color: 'white',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
  },
  button: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
};
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, TextInput } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import BookDetailsScreen from './screens/BookDetailsScreen';

// ========== ВСЕ ПЕРЕВОДЫ ==========
const STRINGS = {
  ru: {
    app: { title: 'Ивотека' },
    buttons: { addBook: '+ Добавить книгу' },
    placeholders: {
      title: 'Название',
      author: 'Автор',
      section: 'Раздел (Страна, век)',
      genres: 'Жанры через запятую',
      pages: 'Количество страниц',
      startDate: 'Дата начала (ДД-ММ-ГГГГ)',
      endDate: 'Дата окончания (ДД-ММ-ГГГГ)',
      notes: 'Заметки / отзыв',
    },
    fields: {
      section: 'Раздел (Страна, век)',
      genres: 'Жанры',
      pages: 'Страниц',
      startDate: 'Дата начала',
      endDate: 'Дата окончания',
      notes: 'Заметки',
    },
    status: {
      planned: 'в планах', reading: 'читаю', finished: 'прочитано',
      postponed: 'отложено', abandoned: 'брошено', rereading: 'перечитываю',
    },
    errors: { emptyFields: 'Заполните обязательные поля' },
  },
  en: {
    app: { title: 'Evebrary' },
    buttons: { addBook: '+ Add Book' },
    placeholders: {
      title: 'Title',
      author: 'Author',
      section: 'Section (Country, Century)',
      genres: 'Genres (comma separated)',
      pages: 'Pages count',
      startDate: 'Start date (DD-MM-YYYY)',
      endDate: 'End date (DD-MM-YYYY)',
      notes: 'Notes / Review',
    },
    fields: {
      section: 'Section',
      genres: 'Genres',
      pages: 'Pages',
      startDate: 'Start date',
      endDate: 'End date',
      notes: 'Notes',
    },
    status: {
      planned: 'planned', reading: 'reading', finished: 'finished',
      postponed: 'postponed', abandoned: 'abandoned', rereading: 'rereading',
    },
    errors: { emptyFields: 'Please fill required fields' },
  },
  by: {
    app: { title: 'Еватэка' },
    buttons: { addBook: '+ Дадаць кнігу' },
    placeholders: {
      title: 'Назва',
      author: 'Аўтар',
      section: 'Раздзел (Краіна, стагоддзе)',
      genres: 'Жанры праз коску',
      pages: 'Колькасць старонак',
      startDate: 'Дата пачатку (ДД-ММ-ГГГГ)',
      endDate: 'Дата заканчэння (ДД-ММ-ГГГГ)',
      notes: 'Нотаткі / водгук',
    },
    fields: {
      section: 'Раздзел',
      genres: 'Жанры',
      pages: 'Старонак',
      startDate: 'Дата пачатку',
      endDate: 'Дата заканчэння',
      notes: 'Нотаткі',
    },
    status: {
      planned: 'у планах', reading: 'чытаю', finished: 'прачытана',
      postponed: 'адкладзена', abandoned: 'кінута', rereading: 'перачытваю',
    },
    errors: { emptyFields: 'Запоўніце абавязковыя палі' },
  },
  ua: {
    app: { title: 'Єватека' },
    buttons: { addBook: '+ Додати книгу' },
    placeholders: {
      title: 'Назва',
      author: 'Автор',
      section: 'Розділ (Країна, століття)',
      genres: 'Жанри через кому',
      pages: 'Кількість сторінок',
      startDate: 'Дата початку (ДД-ММ-РРРР)',
      endDate: 'Дата закінчення (ДД-ММ-РРРР)',
      notes: 'Нотатки / відгук',
    },
    fields: {
      section: 'Розділ',
      genres: 'Жанри',
      pages: 'Сторінок',
      startDate: 'Дата початку',
      endDate: 'Дата закінчення',
      notes: 'Нотатки',
    },
    status: {
      planned: 'у планах', reading: 'читаю', finished: 'прочитано',
      postponed: 'відкладено', abandoned: 'кинуто', rereading: 'перечитую',
    },
    errors: { emptyFields: "Будь ласка, заповніть обов'язкові поля" },
  },
};

const LOCALE_NAMES = { ru: 'Русский', en: 'English', by: 'Беларуская', ua: 'Українська' };
const Stack = createStackNavigator();

function HomeScreen({ navigation, books, setBooks, lang, title, setTitle, author, setAuthor, status, setStatus, showForm, setShowForm }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#111', paddingTop: 60, paddingHorizontal: 16 }}>
      <Text style={{ color: 'white', fontSize: 28, marginBottom: 20 }}>{lang.app.title}</Text>
      
      <TouchableOpacity onPress={() => setShowForm(!showForm)} style={{ padding: 14, backgroundColor: showForm ? '#2a2a2a' : '#4CAF50', borderRadius: 12, marginBottom: 12, alignItems: 'center' }}>
        <Text style={{ color: 'white', fontWeight: '600' }}>{showForm ? '− Скрыть форму' : '+ Добавить книгу'}</Text>
      </TouchableOpacity>
      
      {showForm && (
        <View style={{ marginBottom: 12 }}>
          <TextInput placeholder={lang.placeholders.title} placeholderTextColor="#777" value={title} onChangeText={setTitle} style={{ backgroundColor: '#1c1c1e', color: 'white', padding: 14, borderRadius: 12, marginBottom: 10 }} />
          <TextInput placeholder={lang.placeholders.author} placeholderTextColor="#777" value={author} onChangeText={setAuthor} style={{ backgroundColor: '#1c1c1e', color: 'white', padding: 14, borderRadius: 12, marginBottom: 12 }} />
          <TouchableOpacity onPress={() => {
            if (!title.trim() || !author.trim()) return;
            setBooks(prev => [...prev, { id: Date.now().toString(), title, author, status: 'planned', rating: 0, cover: 'https://picsum.photos/200/300' }]);
            setTitle(''); setAuthor(''); setShowForm(false);
          }} style={{ padding: 14, backgroundColor: '#2a2a2a', borderRadius: 12, alignItems: 'center' }}>
            <Text style={{ color: 'white', fontWeight: '600' }}>{lang.buttons.addBook}</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <FlatList data={books} keyExtractor={item => item.id} renderItem={({ item }) => (
        <TouchableOpacity onPress={() => navigation.navigate('Details', {
          bookId: item.id,
          books: books,
          setBooks: setBooks,
        })} style={{ flexDirection: 'row', backgroundColor: '#1c1c1e', marginBottom: 12, borderRadius: 12, overflow: 'hidden', alignItems: 'center' }}>
          <Image source={{ uri: item.cover }} style={{ width: 80, height: 120 }} />
          <View style={{ padding: 10, flex: 1 }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>{item.title}</Text>
            <Text style={{ color: '#aaa' }}>{item.author}</Text>
            <Text style={{ color: '#7dd3fc' }}>{lang.status[item.status]} • ★ {item.rating}</Text>
          </View>
          <TouchableOpacity onPress={() => setBooks(prev => prev.filter(b => b.id !== item.id))} style={{ paddingRight: 10 }}>
            <Text style={{ color: '#ff4444', fontSize: 24 }}>🗑️</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )} />
    </View>
  );
}  // ← ЭТА СКОБКА БЫЛА ПРОПУЩЕНА

export default function App() {
  const [books, setBooks] = useState([
  { 
    id: '1', 
    title: 'Убить пересмешника', 
    author: 'Харпер Ли', 
    status: 'finished', 
    rating: 10, 
    cover: 'https://picsum.photos/200/300',
    section: 'США, XX век',
    genres: ['роман воспитания', 'южная готика'],
    pages: 416,
    startDate: '2024-11-13',
    endDate: '2025-01-31',
    notes: 'Глава 24 (Чаепитие женщин); Артур Рэдли'
  },
  { 
    id: '2', 
    title: 'Гордость и предубеждение', 
    author: 'Джейн Остин', 
    status: 'finished', 
    rating: 9, 
    cover: 'https://picsum.photos/200/301',
    section: 'Великобритания, XIX век',
    genres: ['эпоха регенства', 'любовный роман'],
    pages: 480,
    startDate: '2025-01-30',
    endDate: '2025-02-02',
    notes: ''
  },
  { 
    id: '3', 
    title: 'Дневник Анны Франк', 
    author: 'Анна Франк', 
    status: 'finished', 
    rating: 10, 
    cover: 'https://picsum.photos/200/302',
    section: 'Нидерланды, XX век',
    genres: ['автобиография', 'еврейская литература'],
    pages: 320,
    startDate: '2025-02-02',
    endDate: '2025-02-04',
    notes: ''
  },
]);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('planned');
  const [locale, setLocale] = useState('ru');
  const [showForm, setShowForm] = useState(false);
  const lang = STRINGS[locale];

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const saved = await AsyncStorage.getItem('books');
        if (saved) setBooks(JSON.parse(saved));
      } catch (e) { console.error(e); }
    };
    loadBooks();
  }, []);

  useEffect(() => {
    const saveBooks = async () => {
      try {
        await AsyncStorage.setItem('books', JSON.stringify(books));
      } catch (e) { console.error(e); }
    };
    if (books.length > 0) saveBooks();
  }, [books]);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#111' }, headerTintColor: 'white' }}>
        <Stack.Screen name="Home">
          {props => <HomeScreen {...props} books={books} setBooks={setBooks} lang={lang} title={title} setTitle={setTitle} author={author} setAuthor={setAuthor} status={status} setStatus={setStatus} showForm={showForm} setShowForm={setShowForm} />}
        </Stack.Screen>
        <Stack.Screen name="Details" component={BookDetailsScreen} options={{ title: 'Детали книги' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
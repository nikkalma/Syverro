import React, { useState } from 'react';
import { View, FlatList, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import useStore from '../../store';
import Header from './Header';
import ActionButtons from './ActionButtons';
import SortModal from './SortModal';
import AddBookForm from './AddBookForm';
import SearchInput from './SearchInput';
import StatusFilters from './StatusFilters';
import BookCard from './BookCard';
import EmptyState from './EmptyState';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function HomeScreen({ navigation, lang }) {
  const { theme } = useTheme();
  const { books } = useStore();
  
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredAndSortedBooks = books
    .filter(book => {
      const matchesSearch = searchQuery === '' ? true :
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (book.genres && book.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase())));
      const matchesStatus = activeStatusFilter === 'all' ? true : book.status === activeStatusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'author') return a.author.localeCompare(b.author);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'date') return (b.createdAt || 0) - (a.createdAt || 0);
      return 0;
    });

  const counts = {
    all: books.length,
    finished: books.filter(b => b.status === 'finished').length,
    reading: books.filter(b => b.status === 'reading').length,
    planned: books.filter(b => b.status === 'planned').length,
  };

  const renderBookCard = ({ item }) => (
    <BookCard 
      item={item} 
      width={CARD_WIDTH} 
      navigation={navigation} 
      lang={lang} 
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, paddingHorizontal: 16 }}>
      <Header navigation={navigation} lang={lang} booksCount={books.length} />
      
      <ActionButtons 
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        showAddForm={showAddForm}
        setShowAddForm={setShowAddForm}
        setSortModalVisible={setSortModalVisible}
        lang={lang}
      />
      
      <SortModal 
        visible={sortModalVisible}
        setVisible={setSortModalVisible}
        sortBy={sortBy}
        setSortBy={setSortBy}
        lang={lang}
      />
      
      <AddBookForm 
        visible={showAddForm}
        onClose={() => setShowAddForm(false)}
        lang={lang}
      />
      
      <SearchInput 
        visible={showSearch}
        value={searchQuery}
        onChange={setSearchQuery}
        lang={lang}
      />
      
      <StatusFilters 
        activeFilter={activeStatusFilter}
        setActiveFilter={setActiveStatusFilter}
        counts={counts}
        lang={lang}
      />
      
      {filteredAndSortedBooks.length === 0 ? (
        <EmptyState lang={lang} />
      ) : (
        <FlatList 
          data={filteredAndSortedBooks} 
          keyExtractor={item => item.id} 
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          renderItem={renderBookCard}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
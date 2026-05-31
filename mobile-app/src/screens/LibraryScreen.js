// mobile-app/src/screens/LibraryScreen.js
import React, { useState } from 'react';
import { View, FlatList, Dimensions, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import useStore from '../store';
import BookCover from '../components/BookCover';
import { Text } from '../components/Text';
import { spacing, radii } from '../theme/spacing';
import OrbBackground from '../components/OrbBackground';
import GlassCard from '../components/GlassCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 32) / 3;

export default function LibraryScreen({ navigation, lang }) {
  const { theme } = useTheme();
  const { books } = useStore();

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('title');

  const statuses = [
    { key: 'all', label: 'Все книги' },
    { key: 'reading', label: 'Читаю' },
    { key: 'finished', label: 'Прочитано' },
    { key: 'planned', label: 'В планах' },
    { key: 'rereading', label: 'Перечитываю' },
    { key: 'postponed', label: 'Отложено' },
    { key: 'abandoned', label: 'Брошено' },
  ];

  const filteredBooks = books.filter(book => {
    if (selectedStatus === 'all') return true;
    return book.status === selectedStatus;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'date') return (b.createdAt || 0) - (a.createdAt || 0);
    return 0;
  });

  const renderBookCard = ({ item }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('BookDetails', { bookId: item.id, lang: lang })} 
      style={{ width: CARD_WIDTH, marginBottom: spacing.md }}
      activeOpacity={0.7}
    >
      <BookCover 
        coverUrl={item.cover} 
        title={item.title} 
        width={CARD_WIDTH} 
        height={CARD_WIDTH * 1.4} 
      />
      <Text variant="secondary" numberOfLines={1} style={{ marginTop: spacing.xs }}>
        {item.title}
      </Text>
      <Text variant="caption" numberOfLines={1}>{item.author}</Text>
      {item.rating ? (
        <Text variant="caption" style={{ color: theme.warning, marginTop: 2 }}>
          ★ {item.rating}/5
        </Text>
      ) : null}
    </TouchableOpacity>
  );

  const getStatusLabel = () => {
    const found = statuses.find(s => s.key === selectedStatus);
    return found ? found.label : 'Все книги';
  };

  const getSortLabel = () => {
    if (sortBy === 'title') return 'По названию';
    if (sortBy === 'rating') return 'По оценке';
    if (sortBy === 'date') return 'По дате';
    return 'По названию';
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <OrbBackground size={350} />
      
      <ScrollView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: 60 }}>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
            <Text variant="h1" style={{ color: theme.textPrimary }}> Библиотека</Text>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl }}>
            <TouchableOpacity 
              onPress={() => setFilterModalVisible(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
            >
              <Text style={{ color: theme.primary, fontSize: 13 }}>📌 {getStatusLabel()}</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 10 }}>▼</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => {
                const next = sortBy === 'title' ? 'rating' : sortBy === 'rating' ? 'date' : 'title';
                setSortBy(next);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
            >
              <Text style={{ color: theme.primary, fontSize: 13 }}>📊 {getSortLabel()}</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 10 }}>⟳</Text>
            </TouchableOpacity>
          </View>
          
          <Text variant="body" style={{ marginBottom: spacing.xl, color: theme.textSecondary }}>
            Найдено: {sortedBooks.length} книг
          </Text>
          
          {sortedBooks.length > 0 ? (
            <FlatList 
              data={sortedBooks}
              keyExtractor={item => item.id}
              numColumns={3}
              renderItem={renderBookCard}
              scrollEnabled={false}
              columnWrapperStyle={{ justifyContent: 'space-between', gap: 8 }}
            />
          ) : (
            <View style={{ padding: spacing.xl, alignItems: 'center' }}>
              <Text variant="body" style={{ textAlign: 'center' }}>Нет книг с выбранным статусом</Text>
            </View>
          )}
          
          <View style={{ height: spacing.xl }} />
        </View>
      </ScrollView>

      <Modal visible={filterModalVisible} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: spacing.lg }}>
          <GlassCard style={{ padding: spacing.lg }}>
            <Text style={{ color: theme.textPrimary, fontSize: 18, marginBottom: spacing.lg, textAlign: 'center' }}>
              Фильтр по статусу
            </Text>
            {statuses.map(status => (
              <TouchableOpacity 
                key={status.key}
                onPress={() => {
                  setSelectedStatus(status.key);
                  setFilterModalVisible(false);
                }}
                style={{ 
                  paddingVertical: spacing.md, 
                  paddingHorizontal: spacing.md,
                  backgroundColor: selectedStatus === status.key ? theme.primary : theme.surface,
                  borderRadius: radii.md,
                  marginBottom: spacing.sm,
                }}
                activeOpacity={0.4}
              >
                <Text style={{ 
                  color: selectedStatus === status.key ? '#FFF' : theme.textPrimary,
                  fontWeight: selectedStatus === status.key ? 'bold' : 'normal',
                }}>
                  {status.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              onPress={() => setFilterModalVisible(false)} 
              style={{ marginTop: spacing.lg, padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: theme.border }}
              activeOpacity={0.4}
            >
              <Text style={{ color: theme.textPrimary, textAlign: 'center' }}>Закрыть</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}
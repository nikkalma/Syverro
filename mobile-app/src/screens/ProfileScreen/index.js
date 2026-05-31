import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import useStore from '../../store';

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins} мин ${secs} сек`;
};

export default function ProfileScreen({ navigation, lang }) {
  const { theme } = useTheme();
  const { books, getTotalStats } = useStore();
  const stats = getTotalStats();
  
  const [userName, setUserName] = useState('Читатель');
  const [avatarEmoji, setAvatarEmoji] = useState('📚');
  const [registerDate, setRegisterDate] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const savedName = await AsyncStorage.getItem('userName');
        const savedAvatar = await AsyncStorage.getItem('userAvatar');
        const savedDate = await AsyncStorage.getItem('registerDate');
        
        if (savedName) setUserName(savedName);
        if (savedAvatar) setAvatarEmoji(savedAvatar);
        
        if (!savedDate) {
          const now = new Date().toISOString().split('T')[0];
          await AsyncStorage.setItem('registerDate', now);
          setRegisterDate(now);
        } else {
          setRegisterDate(savedDate);
        }
      } catch (error) {
        console.log('Ошибка загрузки профиля:', error);
      }
    };
    loadProfile();
  }, []);

  const finishedBooks = books.filter(b => b.status === 'completed').length;
  const totalPages = books.reduce((sum, b) => sum + (b.pages || 0), 0);
  const avgRating = finishedBooks > 0 
    ? (books.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.rating || 0), 0) / finishedBooks).toFixed(1)
    : 0;
  
  const favoriteBooks = books.filter(b => b.favorite === true);

  const saveName = async () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
      await AsyncStorage.setItem('userName', tempName.trim());
    }
    setIsEditingName(false);
  };

  const getReaderLevel = () => {
    if (finishedBooks >= 100) return { name: '🏆 Магистр Книг', color: '#FFD700' };
    if (finishedBooks >= 50) return { name: '📖 Библиотекарь', color: '#C0C0C0' };
    if (finishedBooks >= 25) return { name: '🐛 Книжный червь', color: '#CD7F32' };
    if (finishedBooks >= 10) return { name: '📚 Читатель', color: theme.primary };
    if (finishedBooks >= 5) return { name: '🌱 Начинающий', color: theme.textSecondary };
    return { name: '🍼 Новичок', color: theme.textSecondary };
  };
  
  const level = getReaderLevel();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 50, marginBottom: 20 }}>
        <Text style={{ color: theme.textPrimary, fontSize: 28, fontWeight: 'bold' }}>👤 Профиль</Text>
      </View>

      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <TouchableOpacity 
          onPress={() => {}} 
          style={{ 
            width: 100, height: 100, borderRadius: 50, backgroundColor: theme.surface,
            borderWidth: 2, borderColor: theme.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12,
          }}
          activeOpacity={0.4}
        >
          <Text style={{ fontSize: 48 }}>{avatarEmoji}</Text>
        </TouchableOpacity>
        
        {isEditingName ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              value={tempName}
              onChangeText={setTempName}
              style={{ backgroundColor: theme.surface, color: theme.textPrimary, padding: 8, borderRadius: 8, minWidth: 150, textAlign: 'center', borderWidth: 1, borderColor: theme.border }}
              autoFocus
              onSubmitEditing={saveName}
            />
            <TouchableOpacity onPress={saveName} activeOpacity={0.4}><Text style={{ color: theme.primary, fontSize: 20 }}>✅</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setIsEditingName(false)} activeOpacity={0.4}><Text style={{ color: '#ff4444', fontSize: 20 }}>❌</Text></TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => { setTempName(userName); setIsEditingName(true); }} activeOpacity={0.4}>
            <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: 'bold' }}>{userName} ✏️</Text>
          </TouchableOpacity>
        )}
        
        <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>Читатель с {registerDate}</Text>
      </View>

      {/* Статистика СЕССИЙ (новая) */}
      <View style={{ backgroundColor: theme.surface, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: theme.border }}>
        <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>📊 Статистика чтения</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Сессий</Text>
            <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: 'bold' }}>{stats.totalSessions}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Страниц</Text>
            <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: 'bold' }}>{stats.totalPagesRead}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Время</Text>
            <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: 'bold' }}>{formatDuration(stats.totalTimeSeconds)}</Text>
          </View>
        </View>
      </View>

      <View style={{ backgroundColor: theme.surface, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}>
        <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>Ваш уровень</Text>
        <Text style={{ color: level.color, fontSize: 20, fontWeight: 'bold' }}>{level.name}</Text>
        <View style={{ width: '100%', height: 8, backgroundColor: theme.background, borderRadius: 4, marginTop: 12, overflow: 'hidden' }}>
          <View style={{ width: `${Math.min((finishedBooks / 100) * 100, 100)}%`, height: '100%', backgroundColor: theme.primary }} />
        </View>
        <Text style={{ color: theme.textSecondary, fontSize: 10, marginTop: 4 }}>{finishedBooks} / 100 книг до Магистра</Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, marginBottom: 20 }}>
        <View style={{ width: '31%', backgroundColor: theme.surface, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
          <Text style={{ fontSize: 22, marginBottom: 4 }}>📚</Text>
          <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: 'bold' }}>{books.length}</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 10 }}>всего книг</Text>
        </View>
        <View style={{ width: '31%', backgroundColor: theme.surface, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
          <Text style={{ fontSize: 22, marginBottom: 4 }}>✅</Text>
          <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: 'bold' }}>{finishedBooks}</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 10 }}>прочитано</Text>
        </View>
        <View style={{ width: '31%', backgroundColor: theme.surface, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
          <Text style={{ fontSize: 22, marginBottom: 4 }}>📄</Text>
          <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: 'bold' }}>{totalPages}</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 10 }}>страниц</Text>
        </View>
        <View style={{ width: '31%', backgroundColor: theme.surface, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
          <Text style={{ fontSize: 22, marginBottom: 4 }}>⭐</Text>
          <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: 'bold' }}>{avgRating}</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 10 }}>средняя</Text>
        </View>
        <View style={{ width: '31%', backgroundColor: theme.surface, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
          <Text style={{ fontSize: 22, marginBottom: 4 }}>❤️</Text>
          <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: 'bold' }}>{favoriteBooks.length}</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 10 }}>любимых</Text>
        </View>
      </View>

      <TouchableOpacity 
        onPress={() => navigation.navigate('FavoriteBooks')}
        style={{ backgroundColor: theme.primary, padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 16 }}
        activeOpacity={0.4}
      >
        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>❤️ Мои любимые книги</Text>
      </TouchableOpacity>

      {/* Кнопка ИНСАЙТЫ */}
      <TouchableOpacity 
        onPress={() => navigation.navigate('Insights')}
        style={{ backgroundColor: theme.primary, padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 30 }}
        activeOpacity={0.4}
      >
        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>📈 Инсайты</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
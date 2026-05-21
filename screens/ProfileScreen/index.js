import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import useStore from '../../store';
import ProfileHeader from './ProfileHeader';
import ReaderLevel from './ReaderLevel';
import ProfileStats from './ProfileStats';
import AvatarModal from './AvatarModal';

export default function ProfileScreen({ navigation, lang }) {
  const { theme } = useTheme();
  const { books } = useStore();
  
  const [userName, setUserName] = useState('Читатель');
  const [avatarEmoji, setAvatarEmoji] = useState('📚');
  const [registerDate, setRegisterDate] = useState('');
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // Загрузка профиля
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

  // Статистика
  const finishedBooks = books.filter(b => b.status === 'finished').length;
  const totalPages = books.reduce((sum, b) => sum + (b.pages || 0), 0);
  const avgRating = finishedBooks > 0 
    ? (books.filter(b => b.status === 'finished').reduce((sum, b) => sum + (b.rating || 0), 0) / finishedBooks).toFixed(1)
    : 0;
  
  const favoriteBooks = books.filter(b => b.favorite === true);

  // Сохранение имени
  const saveName = async () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
      await AsyncStorage.setItem('userName', tempName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background, paddingHorizontal: 16 }}>
      {/* Шапка */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 50, marginBottom: 20 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 15 }} activeOpacity={0.7}>
          <Text style={{ color: theme.textPrimary, fontSize: 28 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: theme.textPrimary, fontSize: 28, fontWeight: 'bold' }}>Мой профиль</Text>
      </View>

      <ProfileHeader 
        avatarEmoji={avatarEmoji}
        userName={userName}
        registerDate={registerDate}
        isEditingName={isEditingName}
        tempName={tempName}
        setTempName={setTempName}
        setIsEditingName={setIsEditingName}
        saveName={saveName}
        onAvatarPress={() => setAvatarModalVisible(true)}
        theme={theme}
      />

      <ReaderLevel finishedBooks={finishedBooks} theme={theme} />

      <ProfileStats 
        books={books}
        finishedBooks={finishedBooks}
        totalPages={totalPages}
        avgRating={avgRating}
        favoriteCount={favoriteBooks.length}
        theme={theme}
        navigation={navigation}
      />

      <AvatarModal 
        visible={avatarModalVisible}
        onClose={() => setAvatarModalVisible(false)}
        onSelectAvatar={setAvatarEmoji}
        currentAvatar={avatarEmoji}
        theme={theme}
      />
    </ScrollView>
  );
}
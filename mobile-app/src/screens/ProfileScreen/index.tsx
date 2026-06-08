import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../store';
import { spacing } from '../../theme/spacing';
import ProfileHeader from './ProfileHeader';
import ReadingProgress from './ReadingProgress';
import TopGenres from './TopGenres';
import Observations from './Observations';
import AvatarModal from './AvatarModal';
import { useProfileStats } from './useProfileStats';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import WeeklyActivity from './WeeklyActivity';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function ProfileScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { locale } = useLanguage();
  const { profile, updateProfile, books, sessions } = useStore();
  const stats = useProfileStats();
  
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile?.name || 'Читатель');
  
  const saveName = () => {
    if (tempName.trim()) {
      updateProfile({ name: tempName.trim() });
      setIsEditingName(false);
    }
  };
  
  const handleAvatarSelect = (avatar: string | null) => {
    updateProfile({ avatar });
    setAvatarModalVisible(false);
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ProfileHeader
          avatarEmoji={profile?.avatar || '👤'}
          userName={profile?.name || 'Читатель'}
          registerDate="2026-05-20"
          isEditingName={isEditingName}
          tempName={tempName}
          setTempName={setTempName}
          setIsEditingName={setIsEditingName}
          saveName={saveName}
          onAvatarPress={() => setAvatarModalVisible(true)}
          theme={theme}
        />
        
        <ReadingProgress
          theme={theme}
          totalBooks={stats.totalBooks}
          finishedBooks={stats.finishedBooks}
          completionPercentage={stats.completionPercentage}
          locale={locale}
        />
        
        <TopGenres
          theme={theme}
          books={books}
          locale={locale}
        />
        
        <WeeklyActivity
          theme={theme}
          weekdayActivity={stats.weekdayActivity}
          maxActivity={Math.max(...stats.weekdayActivity)}
          weekdays={locale === 'ru' ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
          locale={locale}
        />

        <Observations
          theme={theme}
          books={books}
          sessions={sessions}
        />
      </ScrollView>
      
      <AvatarModal
        visible={avatarModalVisible}
        onClose={() => setAvatarModalVisible(false)}
        onSelectAvatar={handleAvatarSelect}
        currentAvatar={profile?.avatar || null}
        theme={theme}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
});
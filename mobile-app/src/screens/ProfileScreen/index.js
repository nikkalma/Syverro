import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../store';
import { spacing } from '../../theme/spacing';
import OrbBackground from '../../components/OrbBackground';

// Компоненты (все в той же папке)
import ProfileHeader from './ProfileHeader';
import ProfileStats from './ProfileStats';
import ReadingProgress from './ReadingProgress';
import WeeklyActivity from './WeeklyActivity';
import KeyMetrics from './KeyMetrics';
import TopGenres from './TopGenres';
import Observations from './Observations';
import AvatarModal from './AvatarModal';

// Хук
import { useProfileStats } from './useProfileStats';


export default function ProfileScreen({ navigation }) {
  const { theme } = useTheme();
  const { locale } = useLanguage();
  const { profile, updateProfile } = useStore();
  
  // Статистика из хука
  const stats = useProfileStats();
  
  // Состояния для редактирования
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile?.name || 'Читатель');
  
  // Данные для компонентов
  const weekdays = locale === 'ru' 
    ? ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const maxActivity = Math.max(...stats.weekdayActivity, 1);
  const observations = stats.getObservations(locale);
  
  const saveName = () => {
    if (tempName.trim()) {
      updateProfile({ name: tempName.trim() });
      setIsEditingName(false);
    }
  };
  
  const handleAvatarSelect = (avatar) => {
    updateProfile({ avatar });
    setAvatarModalVisible(false);
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <OrbBackground />
      
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
        
        <WeeklyActivity
          theme={theme}
          weekdayActivity={stats.weekdayActivity}
          maxActivity={maxActivity}
          weekdays={weekdays}
          locale={locale}
        />
        
        <KeyMetrics
          theme={theme}
          finishedBooks={stats.finishedBooks}
          totalPagesRead={stats.totalPagesRead}
          averageRatingFinished={stats.averageRatingFinished}
          locale={locale}
        />
        
        <TopGenres
          theme={theme}
          topGenres={stats.topGenres}
          locale={locale}
        />
        
        <Observations
          theme={theme}
          observations={observations}
          locale={locale}
        />
      </ScrollView>
      
      <AvatarModal
        visible={avatarModalVisible}
        onClose={() => setAvatarModalVisible(false)}
        onSelectAvatar={handleAvatarSelect}
        theme={theme}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingTop: spacing.xxxl, paddingBottom: spacing.xxxl },
});
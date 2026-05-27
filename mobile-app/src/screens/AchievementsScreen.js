// SYVERRO-ACHIEVEMENTS-SCREEN-FULL-001
import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import useStore from '../store';
import { ACHIEVEMENTS_LIST } from '../store/achievements';

export default function AchievementsScreen({ navigation, lang }) {
  const { theme } = useTheme();
  const { achievements } = useStore();
  const unlockedIds = achievements?.unlocked || [];
  const newlyUnlockedId = achievements?.newlyUnlocked;
  
  const [showNotification, setShowNotification] = React.useState(false);
  const [notificationAchievement, setNotificationAchievement] = React.useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  // Очищаем флаг новой ачивки при открытии экрана
  useEffect(() => {
    if (achievements.newlyUnlocked) {
      const timer = setTimeout(() => {
        useStore.setState(state => ({
          achievements: { ...state.achievements, newlyUnlocked: null }
        }));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [achievements.newlyUnlocked]);

  // Отслеживаем новые ачивки
  useEffect(() => {
    if (newlyUnlockedId && !showNotification) {
      const ach = ACHIEVEMENTS_LIST.find(a => a.id === newlyUnlockedId);
      if (ach) {
        setNotificationAchievement(ach);
        setShowNotification(true);
        
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 80,
            friction: 12,
            useNativeDriver: true,
          }),
        ]).start();
        
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setShowNotification(false);
            setNotificationAchievement(null);
          });
        }, 3000);
      }
    }
  }, [newlyUnlockedId]);

  const getProgress = (ach) => {
    if (!ach.progressMax) return null;
    const progress = achievements?.progress?.[ach.id];
    if (progress === undefined) return null;
    return { current: Math.min(progress, ach.progressMax), max: ach.progressMax };
  };

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: theme.background, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 50, marginBottom: 20 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 15 }} activeOpacity={0.4}>
            <Text style={{ color: theme.textPrimary, fontSize: 28 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ color: theme.textPrimary, fontSize: 28, fontWeight: 'bold' }}>🏆 Достижения</Text>
        </View>

        {ACHIEVEMENTS_LIST.map(ach => {
          const isUnlocked = unlockedIds.includes(ach.id);
          const progress = getProgress(ach);
          const progressPercent = progress ? (progress.current / progress.max) * 100 : 0;
          
          return (
            <View key={ach.id} style={{
              backgroundColor: theme.surface,
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: isUnlocked ? theme.primary : theme.border,
              opacity: isUnlocked ? 1 : 0.7,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 32 }}>{ach.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: 'bold' }}>{ach.title}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{ach.description}</Text>
                  {progress && (
                    <View style={{ marginTop: 8 }}>
                      <View style={{ height: 4, backgroundColor: theme.border, borderRadius: 2, overflow: 'hidden' }}>
                        <View style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: theme.primary }} />
                      </View>
                      <Text style={{ color: theme.textSecondary, fontSize: 10, marginTop: 4 }}>
                        {progress.current} / {progress.max}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 24 }}>{isUnlocked ? '🏆' : '🔒'}</Text>
              </View>
            </View>
          );
        })}
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Уведомление о новой ачивке */}
      {showNotification && notificationAchievement && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 60,
            left: 20,
            right: 20,
            backgroundColor: theme.primary,
            borderRadius: 16,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            zIndex: 1000,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Text style={{ fontSize: 32 }}>{notificationAchievement.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold' }}>
              🏆 Достижение разблокировано!
            </Text>
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>
              {notificationAchievement.title}
            </Text>
            <Text style={{ color: '#FFF', fontSize: 12, opacity: 0.9 }}>
              {notificationAchievement.description}
            </Text>
          </View>
        </Animated.View>
      )}
    </>
  );
}
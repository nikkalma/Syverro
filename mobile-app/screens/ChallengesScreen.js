// EVEBRARY-CHALLENGES-SCREEN-001
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import useStore from '../store';

export default function ChallengesScreen({ navigation, lang }) {
  const { theme } = useTheme();
  const { challenges } = useStore();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '🟢';
    }
  };

  const getProgressPercent = (challenge) => {
    return (challenge.progress / challenge.target) * 100;
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background, paddingHorizontal: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 50, marginBottom: 20 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 15 }} activeOpacity={0.7}>
          <Text style={{ color: theme.textPrimary, fontSize: 28 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: theme.textPrimary, fontSize: 28, fontWeight: 'bold' }}>🏆 Челленджи</Text>
      </View>

      {challenges.map(challenge => {
        const percent = getProgressPercent(challenge);
        const isCompleted = challenge.status === 'completed';
        
        return (
          <View key={challenge.id} style={{
            backgroundColor: theme.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: isCompleted ? theme.primary : theme.border,
            opacity: isCompleted ? 1 : 0.8,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 32 }}>{challenge.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: 'bold' }}>
                  {challenge.title}
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                  {challenge.description}
                </Text>
                <View style={{ marginTop: 8 }}>
                  <View style={{ height: 4, backgroundColor: theme.border, borderRadius: 2, overflow: 'hidden' }}>
                    <View style={{ width: `${percent}%`, height: '100%', backgroundColor: theme.primary }} />
                  </View>
                  <Text style={{ color: theme.textSecondary, fontSize: 10, marginTop: 4 }}>
                    {challenge.progress} / {challenge.target} {challenge.unit}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 24 }}>{getStatusIcon(challenge.status)}</Text>
            </View>
          </View>
        );
      })}
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
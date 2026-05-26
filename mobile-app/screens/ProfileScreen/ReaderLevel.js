import React from 'react';
import { View, Text } from 'react-native';

export default function ReaderLevel({ finishedBooks, theme }) {
  const getReaderLevel = () => {
    if (finishedBooks >= 100) return { name: '🏆 Магистр Книг', color: '#FFD700' };
    if (finishedBooks >= 50) return { name: '📖 Библиотекарь', color: '#C0C0C0' };
    if (finishedBooks >= 25) return { name: '🐛 Книжный червь', color: '#CD7F32' };
    if (finishedBooks >= 10) return { name: '📚 Читатель', color: theme.primary };
    if (finishedBooks >= 5) return { name: '🌱 Начинающий', color: theme.textSecondary };
    return { name: '🍼 Новичок', color: theme.textSecondary };
  };
  
  const level = getReaderLevel();
  const progress = Math.min((finishedBooks / 100) * 100, 100);

  return (
    <View style={{ 
      backgroundColor: theme.surface, 
      borderRadius: 12, 
      padding: 16, 
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
    }}>
      <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>Ваш уровень</Text>
      <Text style={{ color: level.color, fontSize: 20, fontWeight: 'bold' }}>{level.name}</Text>
      <View style={{ 
        width: '100%', 
        height: 8, 
        backgroundColor: theme.background, 
        borderRadius: 4, 
        marginTop: 12,
        overflow: 'hidden',
      }}>
        <View style={{ width: `${progress}%`, height: '100%', backgroundColor: theme.primary }} />
      </View>
      <Text style={{ color: theme.textSecondary, fontSize: 10, marginTop: 4 }}>
        {finishedBooks} / 100 книг до Магистра
      </Text>
    </View>
  );
}
import React from 'react';
import { View, Text } from 'react-native';

export default function MotivationCard({ stats, lang, theme }) {
  let message = '';
  
  if (stats.totalBooks === 0) {
    message = '✨ ' + (lang.insights?.addFirstBook || 'Добавьте первую книгу, чтобы увидеть статистику');
  } else if (stats.finishedCount === 0) {
    message = '🔥 ' + (lang.insights?.justStarted || 'Вы только начали. Первая прочитанная книга уже близко!');
  } else if (stats.finishedCount < 10) {
    message = '📖 ' + (lang.insights?.goodStart || 'Отличный старт! Продолжайте в том же духе.');
  } else if (stats.finishedCount < 30) {
    message = '🏆 ' + (lang.insights?.bookworm || 'Вы настоящий книжный червь!');
  } else {
    message = '👑 ' + (lang.insights?.bookKing || 'Книжный король / королева! Браво!');
  }

  return (
    <View style={{ 
      backgroundColor: theme.surface, 
      borderRadius: 12, 
      padding: 14, 
      marginBottom: 30, 
      borderWidth: 1, 
      borderColor: theme.border,
    }}>
      <Text style={{ color: theme.textPrimary, fontSize: 13, textAlign: 'center' }}>
        {message}
      </Text>
    </View>
  );
}
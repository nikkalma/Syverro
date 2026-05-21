import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function RatingStars({ rating, onRatingChange, theme, lang }) {
  // Защита от undefined lang
  const ratingLabel = lang?.fields?.rating || 'Оценка';
  
  return (
    <>
      <Text style={{ color: theme.textSecondary, marginBottom: 8 }}>{ratingLabel}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => onRatingChange(star)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 30,
              backgroundColor: rating >= star ? theme.primary : theme.surface,
              borderWidth: rating >= star ? 0 : 1,
              borderColor: theme.border,
            }}
            activeOpacity={0.7}
          >
            <Text style={{ 
              color: rating >= star ? '#FFF' : theme.textPrimary,
              fontSize: 18
            }}>
              {'⭐'.repeat(star)}{'☆'.repeat(5 - star)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}
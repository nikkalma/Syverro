// SYVERRO-STARS-FIX-001
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function RatingStars({ rating, onRatingChange, theme, lang }) {
  const ratingLabel = lang?.fields?.rating || 'Оценка';
  
  return (
    <>
      <Text style={{ color: theme.textSecondary, marginBottom: 8 }}>{ratingLabel}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => onRatingChange(star)}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 10,
              marginHorizontal: 4,
              borderRadius: 30,
              backgroundColor: rating === star ? theme.primary : theme.surface,
              borderWidth: rating === star ? 0 : 1,
              borderColor: theme.border,
            }}
            activeOpacity={0.4}
          >
            <Text style={{ 
              color: rating === star ? '#FFF' : theme.textPrimary,
              fontSize: 14,
            }}>
              {star} ⭐
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}
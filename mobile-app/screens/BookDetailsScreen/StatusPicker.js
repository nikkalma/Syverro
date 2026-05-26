import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const statusOptions = ['planned', 'reading', 'finished', 'postponed', 'abandoned', 'rereading'];

export default function StatusPicker({ selectedStatus, onStatusChange, lang, theme }) {
  // Защита от undefined lang
  const statusLabel = lang?.fields?.status || 'Статус';
  const statusLabels = lang?.status || {
    planned: 'в планах',
    reading: 'читаю',
    finished: 'прочитано',
    postponed: 'отложено',
    abandoned: 'брошено',
    rereading: 'перечитываю',
  };

  return (
    <>
      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>{statusLabel}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 }}>
        {statusOptions.map(opt => (
          <TouchableOpacity 
            key={opt} 
            onPress={() => onStatusChange(opt)} 
            style={{
              paddingVertical: 6, 
              paddingHorizontal: 12, 
              borderRadius: 20,
              backgroundColor: selectedStatus === opt ? theme.primary : theme.surface,
              marginRight: 8, 
              marginBottom: 8,
            }}
            activeOpacity={0.7}
          >
            <Text style={{ color: selectedStatus === opt ? '#FFF' : theme.textPrimary }}>
              {statusLabels[opt] || opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}
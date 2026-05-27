import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';

export default function ProfileHeader({ 
  avatarEmoji, 
  userName, 
  registerDate, 
  isEditingName, 
  tempName, 
  setTempName, 
  setIsEditingName, 
  saveName, 
  onAvatarPress,
  theme 
}) {
  return (
    <View style={{ alignItems: 'center', marginBottom: 24 }}>
      <TouchableOpacity 
        onPress={onAvatarPress} 
        style={{ 
          width: 100, 
          height: 100, 
          borderRadius: 50, 
          backgroundColor: theme.surface,
          borderWidth: 2,
          borderColor: theme.primary,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 12,
        }}
        activeOpacity={0.4}
      >
        <Text style={{ fontSize: 48 }}>{avatarEmoji}</Text>
      </TouchableOpacity>
      
      {isEditingName ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TextInput
            value={tempName}
            onChangeText={setTempName}
            style={{ 
              backgroundColor: theme.surface, 
              color: theme.textPrimary, 
              padding: 8, 
              borderRadius: 8, 
              minWidth: 150,
              textAlign: 'center',
              borderWidth: 1,
              borderColor: theme.border,
            }}
            autoFocus
            onSubmitEditing={saveName}
          />
          <TouchableOpacity onPress={saveName} activeOpacity={0.4}>
            <Text style={{ color: theme.primary, fontSize: 20 }}>✅</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsEditingName(false)} activeOpacity={0.4}>
            <Text style={{ color: '#ff4444', fontSize: 20 }}>❌</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={() => { setTempName(userName); setIsEditingName(true); }} activeOpacity={0.4}>
          <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: 'bold' }}>
            {userName} ✏️
          </Text>
        </TouchableOpacity>
      )}
      
      <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
        Читатель с {registerDate}
      </Text>
    </View>
  );
}
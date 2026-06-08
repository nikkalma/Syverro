import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Image } from 'react-native';
import { spacing } from '../../theme/spacing';

interface Props {
  avatarEmoji: string;
  userName: string;
  registerDate: string;
  isEditingName: boolean;
  tempName: string;
  setTempName: (name: string) => void;
  setIsEditingName: (editing: boolean) => void;
  saveName: () => void;
  onAvatarPress: () => void;
  theme: any;
}

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
}: Props) {
  const isImageAvatar = avatarEmoji && typeof avatarEmoji === 'string' && avatarEmoji.startsWith('file://');

  return (
    <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
      <TouchableOpacity 
        onPress={onAvatarPress} 
        style={{ 
          width: 100, 
          height: 100, 
          borderRadius: 50, 
          backgroundColor: 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: spacing.md,
          overflow: 'hidden',
        }}
        activeOpacity={0.7}
      >
        {isImageAvatar ? (
          <Image source={{ uri: avatarEmoji }} style={{ width: 100, height: 100, borderRadius: 50 }} />
        ) : (
          <Text style={{ fontSize: 52 }}>{avatarEmoji || '👤'}</Text>
        )}
      </TouchableOpacity>
      
      {isEditingName ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <TextInput
            value={tempName}
            onChangeText={setTempName}
            style={{ 
              backgroundColor: 'transparent', 
              color: theme.textPrimary, 
              padding: spacing.sm, 
              minWidth: 150,
              textAlign: 'center',
              borderBottomWidth: 1,
              borderBottomColor: theme.primary,
              fontSize: 20,
              fontWeight: '300',
            }}
            autoFocus
            onSubmitEditing={saveName}
          />
        </View>
      ) : (
        <TouchableOpacity onPress={() => { setTempName(userName); setIsEditingName(true); }} activeOpacity={0.7}>
          <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: '300' }}>
            {userName}
          </Text>
        </TouchableOpacity>
      )}
      
      <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: spacing.xs }}>
        Читатель с {registerDate}
      </Text>
    </View>
  );
}
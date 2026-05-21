import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';

const EMOJI_AVATARS = ['📚', '🐉', '⚓', '👑', '🐺', '🦁', '🐦‍⬛', '⭐', '🔥', '🌊', '🍖', '🎩'];

export default function AvatarModal({ visible, onClose, onSelectAvatar, currentAvatar, theme }) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 20 }}>
          <Text style={{ color: theme.textPrimary, fontSize: 18, marginBottom: 16, textAlign: 'center' }}>
            Выбери аватар
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
            {EMOJI_AVATARS.map(emoji => (
              <TouchableOpacity
                key={emoji}
                onPress={() => {
                  onSelectAvatar(emoji);
                  onClose();
                }}
                style={{ 
                  width: 60, 
                  height: 60, 
                  borderRadius: 30, 
                  backgroundColor: currentAvatar === emoji ? theme.primary : theme.surface,
                  borderWidth: currentAvatar === emoji ? 0 : 1,
                  borderColor: theme.border,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 32 }}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity 
            onPress={onClose} 
            style={{ marginTop: 16, padding: 12, backgroundColor: theme.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}
            activeOpacity={0.7}
          >
            <Text style={{ color: theme.textPrimary, textAlign: 'center' }}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
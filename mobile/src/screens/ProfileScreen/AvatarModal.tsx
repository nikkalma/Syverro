import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { File, Directory, Paths } from 'expo-file-system';
import { useLanguage } from '../../context/LanguageContext';

const EMOJI_AVATARS = ['👤', '📚', '🌟', '🌙', '🪐', '🐱', '🦊', '🧙', '✨', '🌌'];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectAvatar: (avatar: string | null) => void;
  currentAvatar: string | null;
  theme: any;
}

export default function AvatarModal({ visible, onClose, onSelectAvatar, currentAvatar, theme }: Props) {
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('avatar.permissionDenied') || 'Нужно разрешение для доступа к галерее');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        const pickedUri = result.assets[0].uri;
        
        // Создаём директорию для аватаров
        const avatarsDir = new Directory(Paths.document, 'avatars');
        try {
          await avatarsDir.create({ idempotent: true, intermediates: true });
        } catch (e) {
          // Папка уже существует
          console.log('Avatar directory already exists');
        }

        const fileName = `avatar_${Date.now()}.jpg`;
        const newAvatarFile = new File(avatarsDir, fileName);
        const pickedFile = new File(pickedUri);
        
        await pickedFile.copy(newAvatarFile);

        onSelectAvatar(newAvatarFile.uri);
        Alert.alert(t('common.success'), t('avatar.updated') || 'Аватар обновлён');
      }
    } catch (error) {
      console.log('Ошибка выбора аватара:', error);
      Alert.alert(t('common.error'), t('avatar.uploadFailed') || 'Не удалось загрузить аватар');
    } finally {
      setUploading(false);
    }
  };

  const isImageAvatar = currentAvatar && typeof currentAvatar === 'string' && currentAvatar.startsWith('file://');

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: theme.surface, borderRadius: 20, padding: 20 }}>
          <Text style={{ color: theme.textPrimary, fontSize: 18, marginBottom: 16, textAlign: 'center' }}>
            {t('avatar.select') || 'Выбери аватар'}
          </Text>
          
          <TouchableOpacity
            onPress={pickImage}
            disabled={uploading}
            style={{
              backgroundColor: theme.primary,
              padding: 14,
              borderRadius: 30,
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <Text style={{ color: '#FFF', fontWeight: '500' }}>
              {uploading ? `⏳ ${t('common.loading') || 'Загрузка...'}` : `📸 ${t('avatar.fromGallery') || 'Выбрать из галереи'}`}
            </Text>
          </TouchableOpacity>
          
          {isImageAvatar && (
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Image source={{ uri: currentAvatar }} style={{ width: 80, height: 80, borderRadius: 40 }} />
              <TouchableOpacity
                onPress={() => onSelectAvatar(null)}
                style={{ marginTop: 8 }}
              >
                <Text style={{ color: theme.error }}>🗑 {t('avatar.delete') || 'Удалить аватар'}</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <Text style={{ color: theme.textSecondary, textAlign: 'center', marginBottom: 12 }}>
            {t('avatar.orEmoji') || '— или выбери эмодзи —'}
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
                  backgroundColor: currentAvatar === emoji ? theme.primary : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 32 }}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity 
            onPress={onClose} 
            style={{ marginTop: 20, padding: 12, alignItems: 'center' }}
          >
            <Text style={{ color: theme.textSecondary }}>{t('common.close') || 'Закрыть'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
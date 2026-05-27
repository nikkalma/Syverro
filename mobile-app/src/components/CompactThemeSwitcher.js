import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function CompactThemeSwitcher({ lang }) {
  const { theme, mode, toggleTheme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  
  const themeNames = {
    light: lang?.theme?.light || 'Светлая',
    dark: lang?.theme?.dark || 'Тёмная',
    system: lang?.theme?.system || 'Системная',
  };
  
  return (
    <View>
      <TouchableOpacity 
        onPress={() => setModalVisible(true)}
        style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          paddingVertical: 8,
          paddingHorizontal: 12,
          backgroundColor: theme.surface, 
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.border,
        }}
      >
        <Text style={{ color: theme.textPrimary, fontSize: 13 }}>{themeNames[mode]}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 10, marginLeft: 8 }}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 }}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 20 }}>
            <Text style={{ color: theme.textPrimary, fontSize: 18, marginBottom: 16, textAlign: 'center' }}>
              {lang?.theme?.title || 'Выберите тему'}
            </Text>
            
            <TouchableOpacity onPress={() => { toggleTheme('light'); setModalVisible(false); }} style={{ paddingVertical: 12, backgroundColor: mode === 'light' ? theme.primary : theme.surface, borderRadius: 8, marginBottom: 8, alignItems: 'center' }}>
              <Text style={{ color: mode === 'light' ? '#FFF' : theme.textPrimary }}>{themeNames.light}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => { toggleTheme('dark'); setModalVisible(false); }} style={{ paddingVertical: 12, backgroundColor: mode === 'dark' ? theme.primary : theme.surface, borderRadius: 8, marginBottom: 8, alignItems: 'center' }}>
              <Text style={{ color: mode === 'dark' ? '#FFF' : theme.textPrimary }}>{themeNames.dark}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => { toggleTheme('system'); setModalVisible(false); }} style={{ paddingVertical: 12, backgroundColor: mode === 'system' ? theme.primary : theme.surface, borderRadius: 8, marginBottom: 8, alignItems: 'center' }}>
              <Text style={{ color: mode === 'system' ? '#FFF' : theme.textPrimary }}>{themeNames.system}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.border, borderRadius: 8 }}>
              <Text style={{ color: theme.textPrimary }}>{lang?.buttons?.cancel || 'Отмена'}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
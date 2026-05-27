import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

export default function Header({ navigation, lang, booksCount }) {
  const { theme } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 35, marginBottom: 20 }}>
      <TouchableOpacity 
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        style={{ marginRight: 15, padding: 5 }}
        activeOpacity={0.4}
      >
        <Text style={{ color: theme.textPrimary, fontSize: 32 }}>☰</Text>
      </TouchableOpacity>
      <Text style={{ color: theme.textPrimary, fontSize: 28, flex: 1 }}>{lang.app.title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 14 }}>📚 {booksCount} {lang.books?.count || 'книг'}</Text>
      </View>
    </View>
  );
}
import React, { useState, useEffect } from 'react';  // ← добавили useEffect
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { authService } from '../services/auth.service';

export default function AuthScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // ✅ ПРОВЕРКА: если уже есть токен → сразу в MainTabs
  useEffect(() => {
    const checkAuth = async () => {
      const token = await authService.getToken();
      if (token) {
        navigation.replace('MainTabs');
      }
    };
    checkAuth();
  }, []);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Ошибка', 'Заполните email и пароль');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await authService.login(email, password);
        navigation.replace('MainTabs');  // ← ИСПРАВЛЕНО
      } else {
        await authService.register(email, password);
        await authService.login(email, password);
        navigation.replace('MainTabs');  // ← ИСПРАВЛЕНО
      }
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Что-то пошло не так';
      Alert.alert('Ошибка', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Syverro</Text>
      <Text style={styles.subtitle}>{isLogin ? 'Вход' : 'Регистрация'}</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        placeholder="Пароль"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity onPress={handleSubmit} disabled={loading} style={styles.button}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isLogin ? 'Войти' : 'Зарегистрироваться'}</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.switchText}>
          {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0B1220' },
  title: { fontSize: 42, fontWeight: '300', color: '#fff', textAlign: 'center', marginBottom: 40, letterSpacing: -1 },
  subtitle: { fontSize: 24, fontWeight: '400', color: '#fff', marginBottom: 32, textAlign: 'center' },
  input: { backgroundColor: '#0E1A26', borderWidth: 0.5, borderColor: '#5C7C9A', padding: 14, marginBottom: 16, borderRadius: 12, color: '#fff', fontSize: 16 },
  button: { backgroundColor: '#5C7C9A', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  switchText: { textAlign: 'center', color: '#5C7C9A', marginTop: 20, fontSize: 14 },
});
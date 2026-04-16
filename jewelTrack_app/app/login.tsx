import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, useColorScheme, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../utils/api';
import { saveToken, saveUser } from '../utils/auth';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

export default function Login() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ identifier: '', password: '', role: 'shopkeeper' });
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!form.identifier || !form.password) return Alert.alert('Error', 'Please fill all the fields');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      await saveToken(res.data.data.token, res.data.data.refreshToken);
      await saveUser(res.data.data.user);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid Credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <FontAwesome5 name="gem" size={50} color={theme.brand} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>
        <Text style={[styles.subtitle, { color: theme.text, opacity: 0.6 }]}>Sign in to your JewelTrack account</Text>
      </Animated.View>
      
      <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.formContainer}>
        <TextInput 
          placeholder="Email or Phone Number" 
          placeholderTextColor="#999"
          style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} 
          onChangeText={(txt) => setForm({...form, identifier: txt})}
          autoCapitalize="none"
        />
        
        <View style={[styles.passwordContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TextInput 
            placeholder="Password" 
            placeholderTextColor="#999"
            style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0, backgroundColor: 'transparent', color: theme.text }]} 
            secureTextEntry={!showPassword} 
            onChangeText={(txt) => setForm({...form, password: txt})}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={theme.icon} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.brand }, loading && { opacity: 0.7 }]} 
          onPress={handleLogin} 
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Sign In'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/signup')} style={styles.footerLink}>
          <Text style={{ color: theme.text, opacity: 0.7 }}>
            Don't have an account? <Text style={{ color: theme.brand, fontWeight: 'bold', opacity: 1 }}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  iconContainer: {
    width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center',
    marginBottom: 20, borderWidth: 1,
    shadowColor: "#d2a907", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 10
  },
  title: { fontSize: 32, fontWeight: 'bold' },
  subtitle: { fontSize: 16, marginTop: 10 },
  formContainer: { width: '100%' },
  input: { width: '100%', padding: 18, borderRadius: 12, marginBottom: 15, borderWidth: 1, fontSize: 16 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, marginBottom: 25, borderWidth: 1 },
  eyeIcon: { padding: 15 },
  button: { width: '100%', padding: 20, borderRadius: 12, alignItems: 'center', shadowColor: "#d2a907", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  footerLink: { marginTop: 30, alignItems: 'center' }
});

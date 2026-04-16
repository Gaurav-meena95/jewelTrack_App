import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../utils/api';
import { saveUser } from '../utils/auth';
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ identifier: '', password: '', role: 'shopkeeper' });

  const handleLogin = async () => {
    if (!form.identifier || !form.password) return Alert.alert('Error', 'Please fill all the fields');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      await saveUser(res.data.data.user);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid Credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons name="lock-closed" size={60} color="#d2a907" />
      <Text style={styles.title}>Welcome Back</Text>
      
      <TextInput 
        placeholder="Email or Phone" 
        style={styles.input} 
        onChangeText={(txt) => setForm({...form, identifier: txt})}
      />
      <TextInput 
        placeholder="Password" 
        style={styles.input} 
        secureTextEntry 
        onChangeText={(txt) => setForm({...form, password: txt})}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/signup')} style={{ marginTop: 20 }}>
        <Text style={{ color: '#666' }}>Don't have an account? <Text style={{ color: '#d2a907' }}>Sign Up</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginVertical: 20 },
  input: { width: '100%', backgroundColor: '#f0f0f0', padding: 15, borderRadius: 10, marginBottom: 15 },
  button: { width: '100%', backgroundColor: '#d2a907', padding: 18, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';

import api from '../utils/api';
import { Colors } from '../constants/theme';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

export default function Signup() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    shopName: '',
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'shopkeeper'
  });

  const handleSignup = async () => {
    if (!form.shopName || !form.name || !form.phone || !form.email || !form.password) {
      return Alert.alert('Error', 'Please fill all the fields');
    }
    if (form.phone.length !== 10) return Alert.alert('Error', 'Phone number must be 10 digits');
    if (form.password !== form.confirmPassword) return Alert.alert('Error', 'Passwords do not match');

    setLoading(true);
    try {
      const res = await api.post('/auth/signup', form);
      const user = res.data.data.user;
      
      await saveUser(user);

      Alert.alert('Success', 'Shop Registered Successfully! Please Login.');
      router.replace('/login'); 
    } catch (error: any) {
      console.log("Signup Error:", error.response?.data || error.message);
      Alert.alert('Signup Failed', error.response?.data?.message || 'Server not connected');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
            <FontAwesome5 name="gem" size={50} color={theme.brand} />
          <Text style={[styles.title, { color: theme.text }]}>JewelTrack</Text>
          <Text style={[styles.subtitle, { color: theme.text, opacity: 0.6 }]}>Create Premium Shop Account</Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
          <TextInput 
            placeholder="Shop Name" 
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
            placeholderTextColor="#999"
            onChangeText={(txt) => setForm({...form, shopName: txt})}
          />
          <TextInput 
            placeholder="Owner Name" 
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
            placeholderTextColor="#999"
            onChangeText={(txt) => setForm({...form, name: txt})}
          />
          <TextInput 
            placeholder="Phone Number" 
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
            keyboardType="phone-pad"
            maxLength={10}
            placeholderTextColor="#999"
            onChangeText={(txt) => setForm({...form, phone: txt})}
          />
          <TextInput 
            placeholder="Email Address" 
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#999"
            onChangeText={(txt) => setForm({...form, email: txt})}
          />
          <View style={[styles.passwordContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <TextInput 
              placeholder="Password" 
              style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0, backgroundColor: 'transparent', color: theme.text }]} 
              secureTextEntry={!showPassword}
              placeholderTextColor="#999"
              onChangeText={(txt) => setForm({...form, password: txt})}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={theme.icon} />
            </TouchableOpacity>
          </View>
          <TextInput 
            placeholder="Confirm Password" 
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
            secureTextEntry={!showPassword}
            placeholderTextColor="#999"
            onChangeText={(txt) => setForm({...form, confirmPassword: txt})}
          />

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.brand }, loading && { opacity: 0.7 }]} 
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Processing...' : 'Create Account'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/login')} style={styles.link}>
            <Text style={[styles.linkText, { color: theme.text, opacity: 0.7 }]}>Already have an account? <Text style={{ color: theme.brand, fontWeight: 'bold', opacity: 1 }}>Login</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 25, flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 32, fontWeight: 'bold', marginTop: 10 },
  subtitle: { fontSize: 16, marginTop: 5 },
  formCard: { padding: 20, borderRadius: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 10 },
  input: { borderRadius: 12, padding: 15, marginBottom: 15, fontSize: 16, borderWidth: 1 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, marginBottom: 15, borderWidth: 1 },
  eyeIcon: { padding: 15 },
  button: { padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  link: { marginTop: 20, alignItems: 'center' },
  linkText: { fontSize: 14 }
});

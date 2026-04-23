import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/theme';
import { useColorScheme } from 'react-native';
import api from '../utils/api';
import { Ionicons } from '@expo/vector-icons';

// ⚠️ MUST be outside component — prevents keyboard dismiss on re-render
const InputField = ({ label, placeholder, value, onChangeText, keyboardType = 'default', multiline = false, required = false, theme }: any) => (
  <View style={inputStyles.inputContainer}>
    <Text style={[inputStyles.label, { color: theme.text }]}>
      {label} {required && <Text style={{ color: '#e74c3c' }}>*</Text>}
    </Text>
    <TextInput
      placeholder={placeholder}
      placeholderTextColor="#888"
      style={[
        inputStyles.input,
        {
          backgroundColor: theme.card,
          color: theme.text,
          borderColor: theme.border,
          textAlignVertical: multiline ? 'top' : 'center',
          height: multiline ? 100 : 55
        }
      ]}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
    />
  </View>
);

const inputStyles = StyleSheet.create({
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  input: { borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, borderWidth: 1, fontSize: 16 },
});

export default function AddCustomer() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    father_name: '',
    phone: '',
    email: '',
    address: ''
  });

  const updateField = useCallback((field: string, val: string) => {
    setForm(prev => ({ ...prev, [field]: val }));
  }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.father_name || !form.address) {
      return Alert.alert('Missing Fields', 'Please fill all required (*) fields');
    }
    if (form.phone.length !== 10) {
      return Alert.alert('Invalid Phone', 'Phone number must be exactly 10 digits');
    }

    console.log('[AddCustomer] Registering customer:', form.phone);
    setLoading(true);
    try {
      const response = await api.post('/customers/register', form);
      if (response.data.success) {
        console.log('[AddCustomer] SUCCESS — customer:', form.name);
        Alert.alert('Success', 'Customer registered successfully! 👤');
        router.back();
      }
    } catch (error: any) {
      console.log('[AddCustomer] FAILED —', error.response?.data?.message || error.message);
      const errorMessage = error.response?.data?.message || 'Failed to register customer. Please try again.';
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };



  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
    >
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.headerSubtitle, { color: theme.text, opacity: 0.6 }]}>
            Identify your client for invoices and orders
          </Text>
        </View>

        <View style={styles.form}>
          <InputField
            label="Customer Full Name"
            placeholder="e.g. Rahul Sharma"
            value={form.name}
            onChangeText={(txt: string) => updateField('name', txt)}
            required
            theme={theme}
          />

          <InputField
            label="Father's / Husband's Name"
            placeholder="e.g. Mr. S.K. Sharma"
            value={form.father_name}
            onChangeText={(txt: string) => updateField('father_name', txt)}
            required
            theme={theme}
          />

          <InputField
            label="Mobile Number"
            placeholder="10 digit number"
            value={form.phone}
            onChangeText={(txt: string) => updateField('phone', txt)}
            keyboardType="phone-pad"
            required
            theme={theme}
          />

          <InputField
            label="Email Address"
            placeholder="customer@email.com (optional)"
            value={form.email}
            onChangeText={(txt: string) => updateField('email', txt)}
            keyboardType="email-address"
            theme={theme}
          />

          <InputField
            label="Full Address"
            placeholder="House no, Street, City, Landmark..."
            value={form.address}
            onChangeText={(txt: string) => updateField('address', txt)}
            multiline
            required
            theme={theme}
          />

          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: theme.brand }]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="person-add" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>Register Customer</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={[styles.cancelBtnText, { color: theme.text, opacity: 0.6 }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { marginBottom: 30 },
  headerSubtitle: { fontSize: 14, marginTop: 5 },
  form: { gap: 5 },
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  input: { borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, borderWidth: 1, fontSize: 16 },
  submitBtn: {
    flexDirection: 'row', height: 60, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center', marginTop: 20,
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5,
  },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cancelBtn: { padding: 15, alignItems: 'center', marginTop: 10 },
  cancelBtnText: { fontSize: 16 },
});

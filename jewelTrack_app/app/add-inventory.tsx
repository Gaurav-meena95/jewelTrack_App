import Pressable from '../components/ui/Pressable';
import React, { useState } from 'react';
import { View, Text, TextInput,  StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/theme';
import { useColorScheme } from 'react-native';
import api from '../utils/api';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../components/ui/CustomAlert';
import CustomPicker from '../components/ui/CustomPicker';
import { useAlert } from '../hooks/use-alert';

export default function AddInventory() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    jewelleryType: '',
    quantity: '1',
    metalType: 'gold',
    totalWeight: ''
  });

  const { alertState, showAlert, hideAlert } = useAlert();

  const handleSubmit = async () => {
    if (!form.jewelleryType || !form.totalWeight || !form.quantity) {
      return showAlert('Missing Fields', 'Please fill all fields');
    }
    console.log('[AddInventory] Adding stock:', form.jewelleryType);
    setLoading(true);
    try {
      const payload = {
        ...form,
        quantity: parseInt(form.quantity),
        totalWeight: parseFloat(form.totalWeight)
      };
      const res = await api.post('/shops/inventory/create', payload);
      if (res.data.success) {
        console.log('[AddInventory] SUCCESS —', form.jewelleryType);
        showAlert('Success', 'Stock added to inventory!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error: any) {
      console.log('[AddInventory] FAILED —', error.response?.data?.message || error.message);
      showAlert('Error', error.response?.data?.message || 'Failed to add stock');
    } finally {
      setLoading(false);
    }
  };

  const metalOptions = [
    { label: 'Gold', value: 'gold' },
    { label: 'Silver', value: 'silver' },
    { label: 'Diamond', value: 'diamond' },
    { label: 'Platinum', value: 'platinum' },
  ];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        
        <View style={styles.header}>
          <Text style={[styles.subtitle, { color: theme.text, opacity: 0.6 }]}>
            Maintain your shop stock records
          </Text>
        </View>

        <View style={styles.form}>
          
          <Text style={[styles.label, { color: theme.text }]}>Jewelry Type *</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} 
            placeholder="e.g. Necklace, Ring, Earring"
            placeholderTextColor="#999"
            value={form.jewelleryType}
            onChangeText={(txt) => setForm({...form, jewelleryType: txt})}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.text }]}>Metal Type *</Text>
              <CustomPicker
                options={metalOptions}
                selectedValue={form.metalType}
                onValueChange={(v) => setForm({ ...form, metalType: v })}
                placeholder="Select Metal..."
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.text }]}>Total Weight (g) *</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} 
                placeholder="0.00"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={form.totalWeight}
                onChangeText={(txt) => setForm({...form, totalWeight: txt})}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.text }]}>Quantity *</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} 
                placeholder="1"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={form.quantity}
                onChangeText={(txt) => setForm({...form, quantity: txt})}
              />
            </View>
          </View>

          <Pressable 
            style={[styles.submitBtn, { backgroundColor: theme.brand }]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Add to Stock</Text>}
          </Pressable>

        </View>
      </ScrollView>

      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onDismiss={hideAlert}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25 },
  header: { marginBottom: 30 },
  subtitle: { fontSize: 14 },
  form: { gap: 15 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginLeft: 5 },
  input: { padding: 15, borderRadius: 15, borderWidth: 1, fontSize: 16 },
  row: { flexDirection: 'row', gap: 15 },
  submitBtn: { padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30, elevation: 4 },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

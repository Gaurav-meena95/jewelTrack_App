import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../../constants/theme';
import { useColorScheme } from 'react-native';
import api from '../../../../utils/api';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

export default function CreateCollateral() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  
  const [form, setForm] = useState({
    phone: '',
    jewellery: '',
    weight: '',
    price: '',
    interestRate: '',
    status: 'active'
  });

  useEffect(() => {
    // Fetch customers to show in the dropdown
    const fetchCustomers = async () => {
      try {
        const response = await api.get('/customers/register/get');
        if (response.data.success) {
          const data = response.data.data.customer;
          setCustomers(Array.isArray(data) ? data : [data]);
        }
      } catch (err) {
        console.log('Failed to fetch customers', err);
      }
    };
    fetchCustomers();
  }, []);

  const handleSubmit = async () => {
    if (!form.phone || !form.jewellery || !form.weight || !form.price || !form.interestRate) {
      return Alert.alert('Missing Fields', 'Please fill all fields');
    }

    setLoading(true);
    try {
      // Backend expects phone in query params, and rest in body
      // including image array (even if empty)
      const payload = {
        jewellery: form.jewellery,
        weight: parseFloat(form.weight),
        price: parseFloat(form.price),
        interestRate: parseFloat(form.interestRate),
        status: form.status,
        image: ['placeholder_image_link']
      };

      const res = await api.post(`/customers/collatral/create?phone=${form.phone}`, payload);
      if (res.data.success) {
        Alert.alert('Success', 'Collateral (Girvi) created successfully! 💍');
        router.back();
      }
    } catch (error: any) {
      console.log('Collateral Create Error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create collateral');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        
        <View style={styles.header}>
          <Text style={[styles.subtitle, { color: theme.text, opacity: 0.6 }]}>
            Create a new Girvi/Collateral record
          </Text>
        </View>

        <View style={styles.form}>
          
          <Text style={[styles.label, { color: theme.text }]}>Select Customer *</Text>
          <View style={[styles.pickerContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Picker
              selectedValue={form.phone}
              onValueChange={(itemValue) => setForm({...form, phone: itemValue})}
              style={{ color: theme.text }}
              dropdownIconColor={theme.brand}
            >
              <Picker.Item label="-- Select Customer --" value="" />
              {customers.map((c) => (
                <Picker.Item key={c._id} label={`${c.name} (${c.phone})`} value={c.phone.toString()} />
              ))}
            </Picker>
          </View>

          <Text style={[styles.label, { color: theme.text }]}>Jewelry Item Description *</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} 
            placeholder="e.g. 2 Gold Bangles, 1 Silver Anklet"
            placeholderTextColor="#999"
            value={form.jewellery}
            onChangeText={(txt) => setForm({...form, jewellery: txt})}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.text }]}>Total Weight (g) *</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} 
                placeholder="0.00"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={form.weight}
                onChangeText={(txt) => setForm({...form, weight: txt})}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.text }]}>Loan Amount (₹) *</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} 
                placeholder="₹ 50,000"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={form.price}
                onChangeText={(txt) => setForm({...form, price: txt})}
              />
            </View>
          </View>

          <View style={styles.row}>
             <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.text }]}>Interest Rate (%) *</Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} 
                  placeholder="e.g. 2"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={form.interestRate}
                  onChangeText={(txt) => setForm({...form, interestRate: txt})}
                />
             </View>
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: theme.brand }]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Create Record</Text>}
          </TouchableOpacity>

        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { marginBottom: 25 },
  subtitle: { fontSize: 14 },
  form: { gap: 15 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginLeft: 5 },
  input: { padding: 15, borderRadius: 15, borderWidth: 1, fontSize: 16 },
  row: { flexDirection: 'row', gap: 15 },
  pickerContainer: { borderRadius: 15, borderWidth: 1, overflow: 'hidden', height: 55, justifyContent: 'center' },
  submitBtn: { padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 25, elevation: 4 },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

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
import { Colors } from '../constants/theme';
import { useColorScheme } from 'react-native';
import api from '../utils/api';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

export default function CreateOrder() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  
  const [form, setForm] = useState({
    phone: '',
    itemName: '',
    metal: 'gold',
    weight: '',
    Total: '',
    AdvancePayment: '',
    deliveryDate: ''
  });

  useEffect(() => {
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
    if (!form.phone || !form.itemName || !form.Total) {
      return Alert.alert('Missing Fields', 'Please fill required fields');
    }

    setLoading(true);
    try {
      const payload = {
        items: [{
          itemName: form.itemName,
          description: '',
          metal: form.metal,
          purity: '',
          weight: parseFloat(form.weight) || 0,
          size: ''
        }],
        image: ['placeholder'],
        Total: parseFloat(form.Total) || 0,
        AdvancePayment: parseFloat(form.AdvancePayment) || 0,
        deliveryDate: form.deliveryDate || new Date().toISOString()
      };

      const res = await api.post(`/customers/orders/create?phone=${form.phone}`, payload);
      if (res.data.success) {
        Alert.alert('Success', 'Order created successfully! ⏱️');
        router.back();
      }
    } catch (error: any) {
      console.log('Order Create Error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        
        <View style={styles.header}>
          <Text style={[styles.subtitle, { color: theme.text, opacity: 0.6 }]}>
            Create a custom jewelry order
          </Text>
        </View>

        <View style={styles.form}>
          
          <Text style={[styles.label, { color: theme.text }]}>Select Customer *</Text>
          <View style={[styles.pickerContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Picker
              selectedValue={form.phone}
              onValueChange={(val) => setForm({...form, phone: val})}
              style={{ color: theme.text }}
              dropdownIconColor={theme.brand}
            >
              <Picker.Item label="-- Select Customer --" value="" />
              {customers.map((c) => (
                <Picker.Item key={c._id} label={`${c.name} (${c.phone})`} value={c.phone.toString()} />
              ))}
            </Picker>
          </View>

          <Text style={[styles.label, { color: theme.text }]}>Item Name *</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} 
            placeholder="e.g. Diamond Ring"
            placeholderTextColor="#999"
            value={form.itemName}
            onChangeText={(txt) => setForm({...form, itemName: txt})}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.text }]}>Metal Type *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Picker
                  selectedValue={form.metal}
                  onValueChange={(val) => setForm({...form, metal: val})}
                  style={{ color: theme.text }}
                  dropdownIconColor={theme.brand}
                >
                  <Picker.Item label="Gold" value="gold" />
                  <Picker.Item label="Silver" value="silver" />
                  <Picker.Item label="Diamond" value="diamond" />
                  <Picker.Item label="Platinum" value="platinum" />
                </Picker>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.text }]}>Est Weight (g)</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} 
                placeholder="0.00"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={form.weight}
                onChangeText={(txt) => setForm({...form, weight: txt})}
              />
            </View>
          </View>

          <View style={styles.row}>
             <View style={{ flex: 1 }}>
               <Text style={[styles.label, { color: theme.text }]}>Estimated Total (₹) *</Text>
               <TextInput 
                 style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} 
                 placeholder="0.00"
                 placeholderTextColor="#999"
                 keyboardType="numeric"
                 value={form.Total}
                 onChangeText={(txt) => setForm({...form, Total: txt})}
               />
             </View>
             <View style={{ flex: 1 }}>
               <Text style={[styles.label, { color: theme.text }]}>Advance Paid (₹)</Text>
               <TextInput 
                 style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} 
                 placeholder="0.00"
                 placeholderTextColor="#999"
                 keyboardType="numeric"
                 value={form.AdvancePayment}
                 onChangeText={(txt) => setForm({...form, AdvancePayment: txt})}
               />
             </View>
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: theme.brand }]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Create Order</Text>}
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

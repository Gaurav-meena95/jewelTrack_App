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

export default function CreateBill() {
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
    ratePerGram: '',
    makingChargePercent: '0',
    gstPercent: '3',
    manualAdjustment: '0',
    amountPaid: '',
    paymentMethod: 'cash'
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

  const calculateTotal = () => {
    const weight = parseFloat(form.weight) || 0;
    const rate = parseFloat(form.ratePerGram) || 0;
    const making = parseFloat(form.makingChargePercent) || 0;
    const gst = parseFloat(form.gstPercent) || 0;
    const discount = parseFloat(form.manualAdjustment) || 0;

    const basePrice = weight * rate;
    const withMaking = basePrice + (basePrice * making / 100);
    const withGst = withMaking + (basePrice * gst / 100); // the backend logic calculates GST on basePrice
    return withGst - discount;
  };

  const handleSubmit = async () => {
    if (!form.phone || !form.itemName || !form.weight || !form.ratePerGram) {
      return Alert.alert('Missing Fields', 'Please fill required fields (Customer, Item Name, Weight, Rate)');
    }

    setLoading(true);
    try {
      const payload = {
        amountPaid: parseFloat(form.amountPaid) || 0,
        paymentMethod: form.paymentMethod,
        image: [],
        items: [{
          itemName: form.itemName,
          metal: form.metal,
          purity: '22K',
          weight: parseFloat(form.weight),
          ratePerGram: parseFloat(form.ratePerGram),
          makingChargePercent: parseFloat(form.makingChargePercent) || 0,
          gstPercent: parseFloat(form.gstPercent) || 0,
          manualAdjustment: parseFloat(form.manualAdjustment) || 0
        }]
      };

      const res = await api.post(`/customers/bills/create?phone=${form.phone}`, payload);
      if (res.data.success) {
        Alert.alert('Success', 'Bill generated successfully! 🧾');
        router.back();
      }
    } catch (error: any) {
      console.log('Bill Create Error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to generate bill');
    } finally {
      setLoading(false);
    }
  };

  const estimatedTotal = calculateTotal();

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        
        <View style={styles.header}>
          <Text style={[styles.subtitle, { color: theme.text, opacity: 0.6 }]}>
            Generate a new invoice
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

          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Text style={[styles.sectionTitle, { color: theme.brand }]}>Item Details</Text>

          <Text style={[styles.label, { color: theme.text }]}>Item Name *</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} 
            placeholder="e.g. Gold Chain"
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
                </Picker>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.text }]}>Weight (g) *</Text>
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
               <Text style={[styles.label, { color: theme.text }]}>Rate/gram (₹) *</Text>
               <TextInput 
                 style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} 
                 placeholder="e.g. 5000"
                 placeholderTextColor="#999"
                 keyboardType="numeric"
                 value={form.ratePerGram}
                 onChangeText={(txt) => setForm({...form, ratePerGram: txt})}
               />
             </View>
             <View style={{ flex: 1 }}>
               <Text style={[styles.label, { color: theme.text }]}>Making Chg (%)</Text>
               <TextInput 
                 style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} 
                 placeholder="0%"
                 placeholderTextColor="#999"
                 keyboardType="numeric"
                 value={form.makingChargePercent}
                 onChangeText={(txt) => setForm({...form, makingChargePercent: txt})}
               />
             </View>
          </View>

          <View style={styles.row}>
             <View style={{ flex: 1 }}>
               <Text style={[styles.label, { color: theme.text }]}>GST (%)</Text>
               <TextInput 
                 style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} 
                 placeholder="3%"
                 placeholderTextColor="#999"
                 keyboardType="numeric"
                 value={form.gstPercent}
                 onChangeText={(txt) => setForm({...form, gstPercent: txt})}
               />
             </View>
             <View style={{ flex: 1 }}>
               <Text style={[styles.label, { color: theme.text }]}>Discount (₹)</Text>
               <TextInput 
                 style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} 
                 placeholder="₹ 0"
                 placeholderTextColor="#999"
                 keyboardType="numeric"
                 value={form.manualAdjustment}
                 onChangeText={(txt) => setForm({...form, manualAdjustment: txt})}
               />
             </View>
          </View>

          <View style={[styles.totalContainer, { backgroundColor: theme.brand + '10', borderColor: theme.brand }]} >
             <Text style={[styles.totalLabel, { color: theme.text }]}>Est. Grand Total:</Text>
             <Text style={[styles.totalValue, { color: theme.brand }]}>₹ {estimatedTotal.toFixed(2)}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Text style={[styles.sectionTitle, { color: theme.brand }]}>Payment Details</Text>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.text }]}>Amount Paid (₹)</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} 
                placeholder="0.00"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={form.amountPaid}
                onChangeText={(txt) => setForm({...form, amountPaid: txt})}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.text }]}>Method</Text>
              <View style={[styles.pickerContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Picker
                  selectedValue={form.paymentMethod}
                  onValueChange={(val) => setForm({...form, paymentMethod: val})}
                  style={{ color: theme.text }}
                  dropdownIconColor={theme.brand}
                >
                  <Picker.Item label="Cash" value="cash" />
                  <Picker.Item label="UPI" value="upi" />
                  <Picker.Item label="Card" value="card" />
                  <Picker.Item label="Bank" value="bank_transfer" />
                </Picker>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: theme.brand }]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Generate Invoice</Text>}
          </TouchableOpacity>

        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { marginBottom: 15 },
  subtitle: { fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, marginTop: 5 },
  divider: { height: 1, width: '100%', marginVertical: 15, opacity: 0.5 },
  form: { gap: 15 },
  label: { fontSize: 13, fontWeight: 'bold', marginBottom: 8, marginLeft: 5 },
  input: { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 15 },
  row: { flexDirection: 'row', gap: 15 },
  pickerContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', height: 50, justifyContent: 'center' },
  submitBtn: { padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 25, elevation: 4 },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  totalContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, marginTop: 10 },
  totalLabel: { fontSize: 16, fontWeight: '500' },
  totalValue: { fontSize: 24, fontWeight: 'bold' }
});

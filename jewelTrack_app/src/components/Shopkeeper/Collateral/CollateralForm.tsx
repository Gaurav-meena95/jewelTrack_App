import Pressable from '../../../../components/ui/Pressable';
import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, 
  StyleSheet, ScrollView, ActivityIndicator, 
  KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../../constants/theme';
import { useColorScheme } from 'react-native';
import api from '../../../../utils/api';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import CustomAlert from '../../../../components/ui/CustomAlert'
import CustomPicker from '../../../../components/ui/CustomPicker';
import { useAlert } from '../../../../hooks/use-alert';

export default function CreateCollateral() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [loading, setLoading] = useState(false);
  const [presets, setPresets] = useState({ itemNames: [] as string[] });
  const { alertState, showAlert, hideAlert } = useAlert();

  const [customerPhone, setCustomerPhone] = useState('');
  const [customerFound, setCustomerFound] = useState<boolean | null>(null);
  const [customerData, setCustomerData] = useState({ name: '', father_name: '', address: '', email: '' });

  const [form, setForm] = useState({ jewellery: '', weight: '', price: '', interestRate: '', status: 'active' });
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const profRes = await api.get('/auth/me');
        if (profRes.data?.success) {
          setPresets({ itemNames: profRes.data.data.user.itemNames || [] });
        }
      } catch (err) {}
    };
    fetchSettings();
  }, []);

  const checkCustomer = async () => {
    if (customerPhone.length < 10) return;
    console.log('[CollateralForm] Looking up customer:', customerPhone);
    setLoading(true);
    try {
      const res = await api.get(`/customers/register/get?phone=${customerPhone}`);
      if (res.data?.data && res.data.data.customer) {
        console.log('[CollateralForm] Customer found:', res.data.data.customer.name);
        setCustomerFound(true);
        const c = res.data.data.customer;
        setCustomerData({ name: c.name || '', father_name: c.father_name || '', address: c.address || '', email: c.email || '' });
      } else {
        console.log('[CollateralForm] Customer not found for:', customerPhone);
        setCustomerFound(false);
        setCustomerData({ name: '', father_name: '', address: '', email: '' });
      }
    } catch (err) {
      console.log('[CollateralForm] Customer lookup FAILED —', err);
      setCustomerFound(false);
    } finally {
      setLoading(false);
    }
  };

  const saveCustomer = async () => {
    if (!customerData.name) return showAlert('Error', 'Customer name is required');
    console.log('[CollateralForm] Saving customer:', customerPhone);
    setLoading(true);
    try {
      const payload = { phone: customerPhone, ...customerData };
      if (customerFound) {
        await api.patch('/customers/register/update', payload);
      } else {
        await api.post('/customers/register', payload);
      }
      console.log('[CollateralForm] Customer save SUCCESS');
      showAlert('Success', 'Customer details saved!');
    } catch (err: any) {
      console.log('[CollateralForm] Customer save FAILED —', err.response?.data?.message || err.message);
      showAlert('Error', err.response?.data?.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, quality: 0.5, base64: true
    });
    if (!result.canceled && result.assets[0].base64) {
      setImages([...images, `data:image/jpeg;base64,${result.assets[0].base64}`]);
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        jewellery: form.jewellery,
        weight: parseFloat(form.weight),
        price: parseFloat(form.price),
        interestRate: parseFloat(form.interestRate),
        status: form.status,
        image: images
      };
      console.log('[CollateralForm] Creating collateral for:', customerPhone);
      const res = await api.post(`/customers/collatral/create?phone=${customerPhone}`, payload);
      if (res.data.success) {
        console.log('[CollateralForm] SUCCESS — collateral ID:', res.data.data?.newCollatral?._id);
        showAlert('Success', 'Collateral (Girvi) created successfully! 💍', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error: any) {
      console.log('[CollateralForm] FAILED —', error.response?.data?.message || error.message);
      showAlert('Error', error.response?.data?.message || 'Failed to create collateral');
    } finally {
      setLoading(false);
    }
  };

  const jewelleryOptions = [
    ...presets.itemNames.map(n => ({ label: n, value: n })),
    { label: 'Custom...', value: 'custom' }
  ];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>

        <View style={styles.header}>
          <Text style={[styles.subtitle, { color: theme.text, opacity: 0.6 }]}>Create a new Girvi/Collateral record</Text>
        </View>

        <View style={styles.form}>

          <View style={[styles.lookupSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.label, { color: theme.text }]}>CUSTOMER LOOKUP</Text>
            <View style={styles.lookupRow}>
              <TextInput
                style={[styles.input, { flex: 1, backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                placeholder="Phone Number..." placeholderTextColor="#999"
                keyboardType="numeric" value={customerPhone}
                onChangeText={setCustomerPhone}
              />
              <Pressable style={[styles.checkBtn, { backgroundColor: theme.brand }]} onPress={checkCustomer}>
                <Ionicons name="search" size={20} color="#000" />
              </Pressable>
            </View>

            {customerFound !== null && (
              <View style={{ marginTop: 15 }}>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, marginBottom: 10 }]}
                  placeholder="Customer Name *" placeholderTextColor="#999"
                  value={customerData.name} onChangeText={(v) => setCustomerData({ ...customerData, name: v })}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, marginBottom: 10 }]}
                  placeholder="Father's Name" placeholderTextColor="#999"
                  value={customerData.father_name} onChangeText={(v) => setCustomerData({ ...customerData, father_name: v })}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  placeholder="Address" placeholderTextColor="#999"
                  value={customerData.address} onChangeText={(v) => setCustomerData({ ...customerData, address: v })}
                />
                <Pressable style={[styles.saveCustBtn, { backgroundColor: theme.brand + '20', borderColor: theme.brand }]} onPress={saveCustomer}>
                  <Text style={{ color: theme.brand, fontWeight: 'bold' }}>{customerFound ? 'Update Customer' : 'Register Customer'}</Text>
                </Pressable>
              </View>
            )}
          </View>

          <Text style={[styles.label, { color: theme.text, marginTop: 10 }]}>Jewelry Item Description *</Text>
          <CustomPicker
            options={jewelleryOptions}
            selectedValue={form.jewellery}
            onValueChange={(v) => setForm({ ...form, jewellery: v })}
            placeholder="Select Jewelry Type..."
          />
          {form.jewellery === 'custom' && (
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, marginTop: 10 }]}
              placeholder="Enter Jewelry Type..." placeholderTextColor="#999"
              onChangeText={(txt) => setForm({ ...form, jewellery: txt })}
            />
          )}

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.text }]}>Total Weight (g) *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder="0.00" placeholderTextColor="#999" keyboardType="numeric"
                value={form.weight} onChangeText={(txt) => setForm({ ...form, weight: txt })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.text }]}>Loan Amount (₹) *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder="₹ 50,000" placeholderTextColor="#999" keyboardType="numeric"
                value={form.price} onChangeText={(txt) => setForm({ ...form, price: txt })}
              />
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: theme.text }]}>Interest Rate (%) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
              placeholder="e.g. 2" placeholderTextColor="#999" keyboardType="numeric"
              value={form.interestRate} onChangeText={(txt) => setForm({ ...form, interestRate: txt })}
            />
          </View>

          <Text style={[styles.label, { color: theme.text, marginTop: 15 }]}>ATTACHMENTS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imgRow}>
            <Pressable style={[styles.pickBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={pickImage}>
              <Ionicons name="camera" size={24} color={theme.brand} />
            </Pressable>
            {images.map((img, i) => (
              <Image key={i} source={{ uri: img }} style={styles.imgThumb} />
            ))}
          </ScrollView>

          <Pressable
            style={[styles.submitBtn, { backgroundColor: theme.brand }]}
            onPress={handleSubmit} disabled={loading}
          >
            {loading ? <ActivityIndicator color="#000" /> : <Text style={[styles.submitBtnText, { color: '#000' }]}>Create Girvi Record</Text>}
          </Pressable>

        </View>
        <View style={{ height: 40 }} />
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
  container: { flex: 1, padding: 20 },
  header: { marginBottom: 25 },
  subtitle: { fontSize: 14 },
  form: { gap: 15 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginLeft: 5 },
  input: { padding: 15, borderRadius: 15, borderWidth: 1, fontSize: 16 },
  row: { flexDirection: 'row', gap: 15 },
  lookupSection: { padding: 15, borderRadius: 20, borderWidth: 1, marginBottom: 10 },
  lookupRow: { flexDirection: 'row', gap: 10 },
  checkBtn: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  saveCustBtn: { height: 45, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  imgRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  pickBtn: { width: 80, height: 80, borderRadius: 15, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  imgThumb: { width: 80, height: 80, borderRadius: 15, marginRight: 10 },
  submitBtn: { padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 25, elevation: 4 },
  submitBtnText: { fontSize: 18, fontWeight: 'bold' }
});

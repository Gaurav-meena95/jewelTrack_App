import Pressable from '../../../../components/ui/Pressable';
import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput,  
  StyleSheet, ScrollView, Alert, ActivityIndicator, 
  KeyboardAvoidingView, Platform, Image, Dimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts } from '../../../../constants/theme';
import { useColorScheme } from 'react-native';
import api from '../../../../utils/api';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');


export default function CreateOrder() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const [loading, setLoading] = useState(false);
  const [presets, setPresets] = useState({ itemNames: [] as string[] });

  // Customer Lookup State
  const [lookupPhone, setLookupPhone] = useState('');
  const [customerFound, setCustomerFound] = useState<boolean | null>(null);
  const [customerData, setCustomerData] = useState({ name: '', father_name: '', address: '' });
  const [isRegistered, setIsRegistered] = useState(false);
  
  const [cart, setCart] = useState<any[]>([]);
  const [currentItem, setCurrentItem] = useState({
    itemName: '',
    metal: 'gold',
    purity: '',
    weight: '',
    description: ''
  });

  const [payment, setPayment] = useState({ total: '', advance: '', deliveryDate: '' });
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const profRes = await api.get('/auth/me');
        if (profRes.data?.success) {
          setPresets({ itemNames: profRes.data.data.user.itemNames || [] });
        }
      } catch (err) { console.log(err); }
    };
    init();
  }, []);

  const handleLookup = async () => {
    if (lookupPhone.length < 10) return Alert.alert('Invalid', 'Enter valid 10-digit phone');
    console.log('[OrderForm] Looking up customer:', lookupPhone);
    setLoading(true);
    try {
      const res = await api.get(`/customers/register/get?phone=${lookupPhone}`);
      if (res.data?.data?.customer) {
        console.log('[OrderForm] Customer found:', res.data.data.customer.name);
        setCustomerFound(true);
        setCustomerData({
          name: res.data.data.customer.name,
          father_name: res.data.data.customer.father_name || '',
          address: res.data.data.customer.address || ''
        });
        setIsRegistered(true);
      } else {
        console.log('[OrderForm] Customer not found for:', lookupPhone);
        setCustomerFound(false);
        setCustomerData({ name: '', father_name: '', address: '' });
        setIsRegistered(false);
      }
    } catch (e) {
      console.log('[OrderForm] Customer lookup FAILED —', e);
      setCustomerFound(false);
    } finally { setLoading(false); }
  };

  const addItem = () => {
    if (!currentItem.itemName) return Alert.alert('Required', 'Item Name is needed.');
    setCart([...cart, { ...currentItem }]);
    setCurrentItem({ ...currentItem, itemName: '', weight: '', description: '' });
  };

  const removeItem = (index: number) => setCart(cart.filter((_, i) => i !== index));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true
    });
    if (!result.canceled && result.assets[0].base64) {
      setImages([...images, `data:image/jpeg;base64,${result.assets[0].base64}`]);
    }
  };

  const handleSubmit = async () => {
    if (!customerFound && !isRegistered) {
       if (!customerData.name) return Alert.alert('Error', 'Customer name is required');
       try {
         console.log('[OrderForm] Registering new customer:', lookupPhone);
         setLoading(true);
         await api.post('/customers/register', { ...customerData, phone: lookupPhone });
         console.log('[OrderForm] Customer registered SUCCESS');
         setIsRegistered(true);
       } catch(e) {
         console.log('[OrderForm] Customer register FAILED —', e);
         setLoading(false);
         return Alert.alert('Error', 'Failed to register customer');
       }
    }

    if (cart.length === 0 || !payment.total) {
      return Alert.alert('Error', 'Ensure Items and Total are filled.');
    }

    console.log('[OrderForm] Creating order for:', lookupPhone, '| items:', cart.length);
    setLoading(true);
    try {
      const payload = {
        items: cart,
        image: images.length > 0 ? images : ['placeholder'],
        Total: parseFloat(payment.total),
        AdvancePayment: parseFloat(payment.advance) || 0,
        deliveryDate: payment.deliveryDate || new Date().toISOString()
      };

      const res = await api.post(`/customers/orders/create?phone=${lookupPhone}`, payload);
      if (res.data.success) {
        console.log('[OrderForm] SUCCESS — order ID:', res.data.data?.order?._id);
        Alert.alert('Success', 'Order successfully booked! ⏱️');
        router.back();
      }
    } catch (e: any) {
      console.log('[OrderForm] FAILED —', e.response?.data?.message || e.message);
      Alert.alert('Error', e.response?.data?.message || 'Failed to create order');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text, fontFamily: Fonts.bold }]}>Book Custom Order</Text>
          <Text style={[styles.headerSub, { color: theme.text }]}>🛒 {cart.length} Patterns added</Text>
        </View>

        <View style={styles.content}>
           {/* CUSTOMER LOOKUP */}
           <View style={[styles.lookupBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.label, { color: theme.text }]}>CUSTOMER PHONE</Text>
              <View style={styles.row}>
                <TextInput 
                  style={[styles.input, { flex: 1, backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  placeholder="Enter phone number" keyboardType="phone-pad" maxLength={10}
                  value={lookupPhone} onChangeText={setLookupPhone}
                />
                <Pressable style={[styles.lookupBtn, { backgroundColor: theme.brand }]} onPress={handleLookup}>
                   <Ionicons name="search" size={20} color="#000" />
                </Pressable>
              </View>

              {customerFound === true && (
                <View style={styles.foundBox}>
                   <Ionicons name="checkmark-circle" size={20} color="#2ecc71" />
                   <Text style={{ color: theme.text, fontWeight: 'bold' }}>{customerData.name}</Text>
                </View>
              )}

              {customerFound === false && (
                <View style={styles.regBox}>
                   <Text style={{ color: theme.text, fontSize: 12, marginBottom: 10, opacity: 0.7 }}>New Customer! Please enter details:</Text>
                   <TextInput 
                     style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, marginBottom: 10 }]} 
                     placeholder="Full Name *" value={customerData.name} onChangeText={(v)=>setCustomerData({...customerData, name: v})} 
                   />
                   <TextInput 
                     style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                     placeholder="Father's Name" value={customerData.father_name} onChangeText={(v)=>setCustomerData({...customerData, father_name: v})} 
                   />
                </View>
              )}
           </View>

           <View style={[styles.itemForm, { backgroundColor: theme.card, borderColor: theme.brand + '30' }]}>
              <Text style={[styles.formTitle, { color: theme.brand, fontFamily: Fonts.bold }]}>Item Specifications</Text>
              
              <Text style={[styles.label, { color: theme.text }]}>ORDER ITEM</Text>
              <View style={[styles.pickerBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                 <Picker selectedValue={currentItem.itemName} onValueChange={(v)=>setCurrentItem({...currentItem, itemName: v})} style={{ color: theme.text }}>
                    <Picker.Item label="Choose Template..." value="" />
                    {presets.itemNames.map(n => <Picker.Item key={n} label={n} value={n} />)}
                    <Picker.Item label="-- Custom --" value="custom" />
                 </Picker>
              </View>
              {currentItem.itemName === 'custom' && (
                <TextInput style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, marginTop: 10 }]} placeholder="Item name..." onChangeText={(v)=>setCurrentItem({...currentItem, itemName: v})} />
              )}

              <View style={styles.row}>
                 <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.text }]}>METAL</Text>
                    <View style={[styles.pickerBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                       <Picker selectedValue={currentItem.metal} onValueChange={(v)=>setCurrentItem({...currentItem, metal: v})} style={{ color: theme.text }}>
                          <Picker.Item label="Gold" value="gold" /><Picker.Item label="Silver" value="silver" /><Picker.Item label="Diamond" value="diamond" />
                       </Picker>
                    </View>
                 </View>
                 <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.text }]}>EST. WT</Text>
                    <TextInput style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} placeholder="0.00g" keyboardType="numeric" value={currentItem.weight} onChangeText={(v)=>setCurrentItem({...currentItem, weight: v})} />
                 </View>
              </View>

              <TextInput 
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, height: 80 }]} 
                placeholder="Specific instructions (e.g. Laser engraving)..." 
                multiline value={currentItem.description} onChangeText={(v)=>setCurrentItem({...currentItem, description: v})} 
              />

              <Pressable style={[styles.addBtn, { backgroundColor: theme.brand }]} onPress={addItem}>
                 <Ionicons name="add-circle-outline" size={20} color="#000" />
                 <Text style={styles.addBtnText}>Add to Order</Text>
              </Pressable>
           </View>

           {cart.map((i, idx) => (
             <View key={idx} style={[styles.cartItem, { borderBottomColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                   <Text style={[styles.cartItemName, { color: theme.text, fontFamily: Fonts.bold }]}>{i.itemName} ({i.metal})</Text>
                   <Text style={[styles.cartItemSub, { color: theme.text }]}>{i.weight}g est. • {i.description || 'No notes'}</Text>
                </View>
                <Pressable onPress={() => removeItem(idx)}><Ionicons name="close-circle" size={24} color="#e74c3c" /></Pressable>
             </View>
           ))}

           <View style={styles.section}>
              <Text style={[styles.label, { color: theme.text }]}>SKETCH / REFERENCE PHOTOS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imgRow}>
                 <Pressable style={[styles.pickBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={pickImage}>
                    <Ionicons name="camera-outline" size={30} color={theme.brand} />
                 </Pressable>
                 {images.map((img, i) => <Image key={i} source={{ uri: img }} style={styles.imgThumb} />)}
              </ScrollView>
           </View>

           <View style={styles.bottomSection}>
              <View style={styles.row}>
                 <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.text }]}>EST. TOTAL (₹)</Text>
                    <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="0.00" keyboardType="numeric" value={payment.total} onChangeText={(v)=>setPayment({...payment, total: v})} />
                 </View>
                 <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.text }]}>ADVANCE (₹)</Text>
                    <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="0.00" keyboardType="numeric" value={payment.advance} onChangeText={(v)=>setPayment({...payment, advance: v})} />
                 </View>
              </View>

              <Text style={[styles.label, { color: theme.text }]}>PROMISED DELIVERY DATE</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="YYYY-MM-DD" value={payment.deliveryDate} onChangeText={(v)=>setPayment({...payment, deliveryDate: v})} />

              <Pressable style={[styles.finalBtn, { backgroundColor: theme.brand }]} onPress={handleSubmit} disabled={loading}>
                 {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.finalBtnText}>CONFIRM ORDER</Text>}
              </Pressable>
           </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 25, paddingTop: 60 },
  headerTitle: { fontSize: 24 },
  headerSub: { fontSize: 13, opacity: 0.5, marginTop: 5 },
  content: { padding: 20 },
  section: { marginBottom: 25 },
  label: { fontSize: 10, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1, opacity: 0.6 },
  pickerBox: { borderRadius: 15, borderWidth: 1, overflow: 'hidden', height: 55, justifyContent: 'center', marginBottom: 15 },
  input: { height: 55, borderRadius: 15, borderWidth: 1, paddingHorizontal: 15, fontSize: 14 },
  itemForm: { padding: 20, borderRadius: 25, borderWidth: 1, marginBottom: 20 },
  formTitle: { fontSize: 16, marginBottom: 18 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  addBtn: { height: 50, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  addBtnText: { fontWeight: 'bold' },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, gap: 15 },
  cartItemName: { fontSize: 15 },
  cartItemSub: { fontSize: 12, opacity: 0.5, marginTop: 2 },
  imgRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  pickBtn: { width: 90, height: 90, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  imgThumb: { width: 90, height: 90, borderRadius: 20, marginRight: 10 },
  bottomSection: { marginTop: 20, gap: 15 },
  finalBtn: { height: 65, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  finalBtnText: { fontSize: 17, fontWeight: 'bold', color: '#000' },

  lookupBox: { padding: 20, borderRadius: 25, borderWidth: 1, marginBottom: 20 },
  lookupBtn: { width: 55, height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  foundBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 15, padding: 12, borderRadius: 12, backgroundColor: 'rgba(46, 204, 113, 0.1)' },
  regBox: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' }
});

import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, ScrollView, Alert, ActivityIndicator, 
  KeyboardAvoidingView, Platform, FlatList,
  Dimensions, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../../constants/theme';
import { useColorScheme } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import api from '../../../../utils/api';
import { roundMoney, roundWeight } from '../../../../utils/money';

const { width } = Dimensions.get('window');
import { Fonts } from '../../../../constants/theme';

export default function CreateBill() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [presets, setPresets] = useState({ itemNames: [] as string[], purities: [] as string[] });
  
  // Cart State
  // Customer State
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerFound, setCustomerFound] = useState<boolean | null>(null);
  const [customerData, setCustomerData] = useState({ name: '', father_name: '', address: '', email: '' });
  const [selectedCustomer, setSelectedCustomer] = useState('');
  
  // Cart State
  const [cart, setCart] = useState<any[]>([]);
  const [currentItem, setCurrentItem] = useState({
    itemName: '',
    metal: 'gold',
    purity: '',
    weight: '',
    ratePerGram: '',
    makingChargePercent: '0',
    gstPercent: '3',
    manualAdjustment: '0'
  });

  const [payment, setPayment] = useState({ amountPaid: '', method: 'cash' });
  const [images, setImages] = useState<string[]>([]);

  // Fetch Data
  useEffect(() => {
    const init = async () => {
      try {
        const [custRes, profRes] = await Promise.all([
          api.get('/customers/register/get'),
          api.get('/auth/me')
        ]);
        setCustomers(custRes.data?.data?.customer || []);
        if (profRes.data?.success) {
          setPresets({
            itemNames: profRes.data.data.user.itemNames || [],
            purities: profRes.data.data.user.purities || []
          });
        }
      } catch (err) {
        console.log('Init Fetch Error', err);
      }
    };
    init();
  }, []);

  const checkCustomer = async () => {
    if (customerPhone.length < 10) return;
    console.log('[BillingForm] Looking up customer:', customerPhone);
    setLoading(true);
    try {
      const res = await api.get(`/customers/register/get?phone=${customerPhone}`);
      if (res.data?.data && res.data.data.customer) {
        console.log('[BillingForm] Customer found:', res.data.data.customer.name);
        setCustomerFound(true);
        const c = res.data.data.customer;
        setCustomerData({ name: c.name || '', father_name: c.father_name || '', address: c.address || '', email: c.email || '' });
        setSelectedCustomer(customerPhone);
      } else {
        console.log('[BillingForm] Customer not found for:', customerPhone);
        setCustomerFound(false);
        setCustomerData({ name: '', father_name: '', address: '', email: '' });
      }
    } catch (err) {
      console.log('[BillingForm] Customer lookup FAILED —', err);
      setCustomerFound(false);
    } finally {
      setLoading(false);
    }
  };

  const saveCustomer = async () => {
    if (!customerData.name) return Alert.alert('Error', 'Customer name is required');
    console.log('[BillingForm] Saving customer:', customerPhone, '| found:', customerFound);
    setLoading(true);
    try {
      const payload = { phone: customerPhone, ...customerData };
      if (customerFound) {
        await api.patch('/customers/register/update', payload);
      } else {
        await api.post('/customers/register', payload);
      }
      console.log('[BillingForm] Customer save SUCCESS');
      setSelectedCustomer(customerPhone);
      Alert.alert('Success', 'Customer details saved!');
    } catch (err: any) {
      console.log('[BillingForm] Customer save FAILED —', err.response?.data?.message || err.message);
      Alert.alert('Error', err.response?.data?.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  const calculateItemPrice = (item: any) => {
    const w = roundWeight(item.weight);
    const r = parseFloat(item.ratePerGram) || 0;
    const base = w * r;
    const making = base * (parseFloat(item.makingChargePercent || '0') / 100);
    const gst = base * (parseFloat(item.gstPercent || '0') / 100);
    const disc = parseFloat(item.manualAdjustment || '0');
    return roundMoney(base + making + gst - disc);
  };

  const addItemToCart = () => {
    if (!currentItem.itemName || !currentItem.weight || !currentItem.ratePerGram) {
      return Alert.alert('Required', 'Item Name, Weight and Rate are needed.');
    }
    const finalPrice = calculateItemPrice(currentItem);
    setCart([...cart, { ...currentItem, finalPrice }]);
    // Reset current item partially
    setCurrentItem({ ...currentItem, itemName: '', weight: '', manualAdjustment: '0' });
  };

  const removeItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const grandTotal = cart.reduce((sum, item) => sum + item.finalPrice, 0);

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
    if (!selectedCustomer) return Alert.alert('Error', 'Select a customer first.');
    if (cart.length === 0) return Alert.alert('Error', 'Cart is empty.');

    console.log('[CreateBill] Submitting bill for customer:', selectedCustomer, '| items:', cart.length);
    setLoading(true);
    try {
      const payload = {
        amountPaid: parseFloat(payment.amountPaid) || 0,
        paymentMethod: payment.method,
        image: images,
        items: cart.map(i => ({
          ...i,
          weight: parseFloat(i.weight),
          ratePerGram: parseFloat(i.ratePerGram),
          makingChargePercent: parseFloat(i.makingChargePercent) || 0,
          gstPercent: parseFloat(i.gstPercent) || 0,
          manualAdjustment: parseFloat(i.manualAdjustment) || 0
        }))
      };

      const res = await api.post(`/customers/bills/create?phone=${selectedCustomer}`, payload);
      if (res.data.success) {
        console.log('[CreateBill] SUCCESS — bill ID:', res.data.data?.Bill?._id);
        Alert.alert('Success', 'Premium Invoice Generated! 🧾');
        router.back();
      }
    } catch (e: any) {
      console.log('[CreateBill] FAILED —', e.response?.data?.message || e.message);
      Alert.alert('Error', e.response?.data?.message || 'Failed to create bill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} stickyHeaderIndices={[0]}>
        
        {/* HEADER BAR */}
        <View style={[styles.stickyHeader, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text, fontFamily: Fonts.bold }]}>New Invoice</Text>
            <Text style={[styles.headerSub, { color: theme.text }]}>🛒 {cart.length} Items in cart</Text>
          </View>
          <View style={styles.totalBadge}>
             <Text style={styles.totalBadgeVal}>₹{grandTotal.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.content}>
            {/* CUSTOMER LOOKUP */}
            <View style={[styles.lookupBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
               <Text style={[styles.label, { color: theme.text }]}>CUSTOMER PHONE</Text>
               <View style={styles.lookupRow}>
                  <TextInput 
                    style={[styles.input, { flex: 1, backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                    placeholder="Search by phone..." placeholderTextColor="#999"
                    keyboardType="numeric" maxLength={10} value={customerPhone}
                    onChangeText={setCustomerPhone}
                  />
                  <TouchableOpacity style={[styles.checkBtn, { backgroundColor: theme.brand }]} onPress={checkCustomer}>
                     <Ionicons name="search" size={20} color="#000" />
                  </TouchableOpacity>
               </View>

               {customerFound === true && (
                 <View style={styles.foundBox}>
                    <Ionicons name="checkmark-circle" size={20} color="#2ecc71" />
                    <View>
                       <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>{customerData.name}</Text>
                       <Text style={{ color: theme.text, opacity: 0.5, fontSize: 12 }}>{customerData.address}</Text>
                    </View>
                 </View>
               )}

               {customerFound === false && (
                 <View style={styles.regBox}>
                    <Text style={{ color: theme.text, fontSize: 12, marginBottom: 10, opacity: 0.7 }}>New Customer! Please register:</Text>
                    <TextInput 
                       style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, marginBottom: 10 }]} 
                       placeholder="Full Name *" placeholderTextColor="#999"
                       value={customerData.name} onChangeText={(v)=>setCustomerData({...customerData, name: v})}
                    />
                    <TextInput 
                       style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, marginBottom: 10 }]} 
                       placeholder="Father's Name" placeholderTextColor="#999"
                       value={customerData.father_name} onChangeText={(v)=>setCustomerData({...customerData, father_name: v})}
                    />
                    <TouchableOpacity style={[styles.saveCustBtn, { backgroundColor: theme.brand }]} onPress={saveCustomer}>
                       <Text style={{ color: '#000', fontWeight: 'bold' }}>REGISTER & CONTINUE</Text>
                    </TouchableOpacity>
                 </View>
               )}
            </View>

           {/* ADD ITEM FORM */}
           <View style={[styles.itemForm, { backgroundColor: theme.card, borderColor: theme.brand + '30' }]}>
              <Text style={[styles.formTitle, { color: theme.brand, fontFamily: Fonts.bold }]}>Add Jewelry Item</Text>
              
              <Text style={[styles.label, { color: theme.text }]}>ITEM NAME (Preset or Custom)</Text>
              <View style={[styles.pickerBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                 <Picker selectedValue={currentItem.itemName} onValueChange={(v)=>setCurrentItem({...currentItem, itemName: v})} style={{ color: theme.text }}>
                    <Picker.Item label="Choose Item..." value="" />
                    {presets.itemNames.map(name => <Picker.Item key={name} label={name} value={name} />)}
                    <Picker.Item label="-- Custom Item --" value="custom" />
                 </Picker>
              </View>
              {currentItem.itemName === 'custom' && (
                <TextInput 
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, marginTop: 10 }]} 
                  placeholder="Enter Jewelry Type..." placeholderTextColor="#999"
                  onChangeText={(v)=>setCurrentItem({...currentItem, itemName: v})}
                />
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
                    <Text style={[styles.label, { color: theme.text }]}>PURITY</Text>
                    <View style={[styles.pickerBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                       <Picker selectedValue={currentItem.purity} onValueChange={(v)=>setCurrentItem({...currentItem, purity: v})} style={{ color: theme.text }}>
                          <Picker.Item label="Select..." value="" />
                          {presets.purities.map(p => <Picker.Item key={p} label={p} value={p} />)}
                       </Picker>
                    </View>
                 </View>
              </View>

              <View style={styles.row}>
                 <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.text }]}>WEIGHT (g)</Text>
                    <TextInput style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} placeholder="0.00" keyboardType="numeric" value={currentItem.weight} onChangeText={(v)=>setCurrentItem({...currentItem, weight: v})} />
                 </View>
                 <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.text }]}>RATE/G (₹)</Text>
                    <TextInput style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} placeholder="0.00" keyboardType="numeric" value={currentItem.ratePerGram} onChangeText={(v)=>setCurrentItem({...currentItem, ratePerGram: v})} />
                 </View>
              </View>

              <View style={styles.row}>
                 <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.text }]}>MAKING %</Text>
                    <TextInput style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} placeholder="0" keyboardType="numeric" value={currentItem.makingChargePercent} onChangeText={(v)=>setCurrentItem({...currentItem, makingChargePercent: v})} />
                 </View>
                 <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.text }]}>GST %</Text>
                    <TextInput style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} placeholder="3" keyboardType="numeric" value={currentItem.gstPercent} onChangeText={(v)=>setCurrentItem({...currentItem, gstPercent: v})} />
                 </View>
              </View>

              <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.brand }]} onPress={addItemToCart}>
                 <Ionicons name="cart-outline" size={20} color="#000" />
                 <Text style={styles.addBtnText}>Add to Cart</Text>
              </TouchableOpacity>
           </View>

           {/* CART LIST */}
           <View style={styles.cartSection}>
                 <View key={idx} style={[styles.cartItem, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
                    <View style={{ flex: 1 }}>
                       <Text style={[styles.cartItemName, { color: theme.text, fontFamily: Fonts.bold }]}>{item.itemName} • {item.metal.toUpperCase()}</Text>
                       <Text style={[styles.cartItemSub, { color: theme.text }]}>{item.weight}g @ ₹{item.ratePerGram}</Text>
                    </View>
                    <Text style={[styles.cartItemPrice, { color: theme.text, fontFamily: Fonts.bold }]}>₹{item.finalPrice.toFixed(0)}</Text>
                    <TouchableOpacity onPress={() => removeItem(idx)} style={styles.removeBtn} activeOpacity={0.7}>
                       <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                    </TouchableOpacity>
                 </View>
           </View>

           {/* IMAGES */}
           <View style={styles.section}>
              <Text style={[styles.label, { color: theme.text }]}>ATTACHMENTS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imgRow}>
                 <TouchableOpacity style={[styles.pickBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={pickImage}>
                    <Ionicons name="camera" size={24} color={theme.brand} />
                 </TouchableOpacity>
                 {images.map((img, i) => (
                   <Image key={i} source={{ uri: img }} style={styles.imgThumb} />
                 ))}
              </ScrollView>
           </View>

           {/* PAYMENT */}
           <View style={styles.bottomSection}>
              <View style={[styles.grandTotalBox, { backgroundColor: theme.brand + '10', borderColor: theme.brand }]}>
                 <Text style={[styles.gtLabel, { color: theme.text }]}>GRAND TOTAL</Text>
                 <Text style={[styles.gtVal, { color: theme.brand }]}>₹ {grandTotal.toLocaleString()}</Text>
              </View>

              <View style={styles.row}>
                 <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.text }]}>ADVANCE PAID</Text>
                    <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="0" keyboardType="numeric" value={payment.amountPaid} onChangeText={(v)=>setPayment({...payment, amountPaid: v})} />
                 </View>
                 <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.text }]}>METHOD</Text>
                    <View style={[styles.pickerBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                       <Picker selectedValue={payment.method} onValueChange={(v)=>setPayment({...payment, method: v})} style={{ color: theme.text }}>
                          <Picker.Item label="Cash" value="cash" /><Picker.Item label="UPI" value="upi" /><Picker.Item label="Card" value="card" />
                       </Picker>
                    </View>
                 </View>
              </View>

              <TouchableOpacity style={[styles.finalBtn, { backgroundColor: theme.brand }]} onPress={handleSubmit} disabled={loading}>
                 {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.finalBtnText}>GENERATE DIGITAL INVOICE</Text>}
              </TouchableOpacity>
           </View>

        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stickyHeader: { padding: 20, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, zIndex: 10 },
  headerTitle: { fontSize: 18, letterSpacing: 0.5 },
  headerSub: { fontSize: 11, opacity: 0.5, marginTop: 2 },
  lookupRow: { flexDirection: 'row', gap: 10 },
  checkBtn: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  saveCustBtn: { height: 45, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  totalBadge: { backgroundColor: '#d2a907', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  totalBadgeVal: { color: '#000', fontWeight: 'bold', fontSize: 13 },

  content: { padding: 18 },
  section: { marginBottom: 20 },
  label: { fontSize: 9, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1, opacity: 0.6 },
  pickerBox: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', height: 48, justifyContent: 'center' },
  input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 15, fontSize: 13 },
  
  lookupBox: { padding: 18, borderRadius: 25, borderWidth: 1, marginBottom: 20 },
  foundBox: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 15, padding: 15, borderRadius: 15, backgroundColor: 'rgba(46, 204, 113, 0.1)' },
  regBox: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  
  itemForm: { padding: 18, borderRadius: 25, borderWidth: 1, marginBottom: 20 },
  formTitle: { fontSize: 16, marginBottom: 18 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  addBtn: { height: 50, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 5 },
  addBtnText: { fontWeight: 'bold', color: '#000', fontSize: 14 },

  cartSection: { marginBottom: 25, gap: 10 },
  cartItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20, borderWidth: 1, gap: 12 },
  cartItemName: { fontSize: 14 },
  cartItemSub: { fontSize: 11, opacity: 0.5, marginTop: 4 },
  cartItemPrice: { fontSize: 15 },
  removeBtn: { padding: 8, backgroundColor: 'rgba(231, 76, 60, 0.1)', borderRadius: 10 },

  imgRow: { flexDirection: 'row', gap: 10 },
  pickBtn: { width: 80, height: 80, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  imgThumb: { width: 80, height: 80, borderRadius: 20, marginRight: 10 },

  bottomSection: { marginTop: 15, gap: 20 },
  grandTotalBox: { padding: 22, borderRadius: 30, borderWidth: 1, alignItems: 'center' },
  gtLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5, opacity: 0.6 },
  gtVal: { fontSize: 30, fontWeight: 'bold', marginTop: 8 },
  finalBtn: { height: 65, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  finalBtnText: { fontSize: 15, fontWeight: 'bold', color: '#000', letterSpacing: 1 }
});

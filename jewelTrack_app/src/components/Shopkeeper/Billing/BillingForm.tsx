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
import api from '../../../../utils/api';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');
const FONT = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });
const FONT_BOLD = Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' });

export default function CreateBill() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [presets, setPresets] = useState({ itemNames: [] as string[], purities: [] as string[] });
  
  // Cart State
  const [selectedCustomer, setSelectedCustomer] = useState('');
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

  const calculateItemPrice = (item: any) => {
    const w = parseFloat(item.weight) || 0;
    const r = parseFloat(item.ratePerGram) || 0;
    const base = w * r;
    const making = base * (parseFloat(item.makingChargePercent || '0') / 100);
    const gst = base * (parseFloat(item.gstPercent || '0') / 100);
    const disc = parseFloat(item.manualAdjustment || '0');
    return base + making + gst - disc;
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
        Alert.alert('Success', 'Premium Invoice Generated! 🧾');
        router.back();
      }
    } catch (e: any) {
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
            <Text style={[styles.headerTitle, { color: theme.text, fontFamily: FONT_BOLD }]}>New Invoice</Text>
            <Text style={[styles.headerSub, { color: theme.text }]}>🛒 {cart.length} Items in cart</Text>
          </View>
          <View style={styles.totalBadge}>
             <Text style={styles.totalBadgeVal}>₹{grandTotal.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.content}>
           {/* CUSTOMER SELECT */}
           <View style={styles.section}>
              <Text style={[styles.label, { color: theme.text }]}>CUSTOMER *</Text>
              <View style={[styles.pickerBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                 <Picker selectedValue={selectedCustomer} onValueChange={setSelectedCustomer} style={{ color: theme.text }}>
                    <Picker.Item label="Select Customer" value="" />
                    {customers.map(c => <Picker.Item key={c._id} label={`${c.name} (${c.phone})`} value={c.phone} />)}
                 </Picker>
              </View>
           </View>

           {/* ADD ITEM FORM */}
           <View style={[styles.itemForm, { backgroundColor: theme.card, borderColor: theme.brand + '30' }]}>
              <Text style={[styles.formTitle, { color: theme.brand, fontFamily: FONT_BOLD }]}>Add Jewelry Item</Text>
              
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
              {cart.map((item, idx) => (
                <View key={idx} style={[styles.cartItem, { borderBottomColor: theme.border }]}>
                   <View style={{ flex: 1 }}>
                      <Text style={[styles.cartItemName, { color: theme.text, fontFamily: FONT_BOLD }]}>{item.itemName} • {item.metal.toUpperCase()}</Text>
                      <Text style={[styles.cartItemSub, { color: theme.text }]}>{item.weight}g @ ₹{item.ratePerGram}</Text>
                   </View>
                   <Text style={[styles.cartItemPrice, { color: theme.text, fontFamily: FONT_BOLD }]}>₹{item.finalPrice.toFixed(0)}</Text>
                   <TouchableOpacity onPress={() => removeItem(idx)} style={styles.removeBtn}>
                      <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                   </TouchableOpacity>
                </View>
              ))}
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
  headerTitle: { fontSize: 20 },
  headerSub: { fontSize: 12, opacity: 0.5 },
  totalBadge: { backgroundColor: '#d2a907', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  totalBadgeVal: { color: '#000', fontWeight: 'bold' },

  content: { padding: 20 },
  section: { marginBottom: 20 },
  label: { fontSize: 10, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1, opacity: 0.6 },
  pickerBox: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', height: 50, justifyContent: 'center' },
  input: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 15, fontSize: 14 },
  
  itemForm: { padding: 20, borderRadius: 25, borderWidth: 1, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  formTitle: { fontSize: 16, marginBottom: 15 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  addBtn: { height: 50, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 10 },
  addBtnText: { fontWeight: 'bold', color: '#000' },

  cartSection: { marginBottom: 25 },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, gap: 15 },
  cartItemName: { fontSize: 14 },
  cartItemSub: { fontSize: 12, opacity: 0.5, marginTop: 2 },
  cartItemPrice: { fontSize: 16 },
  removeBtn: { padding: 5 },

  imgRow: { flexDirection: 'row', gap: 10 },
  pickBtn: { width: 80, height: 80, borderRadius: 15, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  imgThumb: { width: 80, height: 80, borderRadius: 15, marginRight: 10 },

  bottomSection: { marginTop: 20, gap: 20 },
  grandTotalBox: { padding: 20, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  gtLabel: { fontSize: 12, fontWeight: 'bold' },
  gtVal: { fontSize: 32, fontWeight: 'bold', marginTop: 5 },
  finalBtn: { height: 65, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#d2a907', shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  finalBtnText: { fontSize: 16, fontWeight: 'bold', color: '#000', letterSpacing: 1 }
});

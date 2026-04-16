import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, ScrollView, Alert, ActivityIndicator, 
  KeyboardAvoidingView, Platform, Image, Dimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../../constants/theme';
import { useColorScheme } from 'react-native';
import api from '../../../../utils/api';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');
const FONT = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });
const FONT_BOLD = Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' });

export default function CreateOrder() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [presets, setPresets] = useState({ itemNames: [] as string[] });
  
  const [selectedCustomer, setSelectedCustomer] = useState('');
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
        const [custRes, profRes] = await Promise.all([
          api.get('/customers/register/get'),
          api.get('/auth/me')
        ]);
        setCustomers(custRes.data?.data?.customer || []);
        if (profRes.data?.success) {
          setPresets({ itemNames: profRes.data.data.user.itemNames || [] });
        }
      } catch (err) { console.log(err); }
    };
    init();
  }, []);

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
    if (!selectedCustomer || cart.length === 0 || !payment.total) {
      return Alert.alert('Error', 'Ensure Customer, Items and Total are filled.');
    }

    setLoading(true);
    try {
      const payload = {
        items: cart,
        image: images.length > 0 ? images : ['placeholder'],
        Total: parseFloat(payment.total),
        AdvancePayment: parseFloat(payment.advance) || 0,
        deliveryDate: payment.deliveryDate || new Date().toISOString()
      };

      const res = await api.post(`/customers/orders/create?phone=${selectedCustomer}`, payload);
      if (res.data.success) {
        Alert.alert('Success', 'Order successfully booked! ⏱️');
        router.back();
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to create order');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text, fontFamily: FONT_BOLD }]}>Book Custom Order</Text>
          <Text style={[styles.headerSub, { color: theme.text }]}>🛒 {cart.length} Patterns added</Text>
        </View>

        <View style={styles.content}>
           <Text style={[styles.label, { color: theme.text }]}>SELECT CUSTOMER *</Text>
           <View style={[styles.pickerBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Picker selectedValue={selectedCustomer} onValueChange={setSelectedCustomer} style={{ color: theme.text }}>
                 <Picker.Item label="Select Customer" value="" />
                 {customers.map(c => <Picker.Item key={c._id} label={`${c.name} (${c.phone})`} value={c.phone} />)}
              </Picker>
           </View>

           <View style={[styles.itemForm, { backgroundColor: theme.card, borderColor: theme.brand + '30' }]}>
              <Text style={[styles.formTitle, { color: theme.brand, fontFamily: FONT_BOLD }]}>Item Specifications</Text>
              
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

              <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.brand }]} onPress={addItem}>
                 <Ionicons name="add-circle-outline" size={20} color="#000" />
                 <Text style={styles.addBtnText}>Add to Order</Text>
              </TouchableOpacity>
           </View>

           {cart.map((i, idx) => (
             <View key={idx} style={[styles.cartItem, { borderBottomColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                   <Text style={[styles.cartItemName, { color: theme.text, fontFamily: FONT_BOLD }]}>{i.itemName} ({i.metal})</Text>
                   <Text style={[styles.cartItemSub, { color: theme.text }]}>{i.weight}g est. • {i.description || 'No notes'}</Text>
                </View>
                <TouchableOpacity onPress={() => removeItem(idx)}><Ionicons name="close-circle" size={24} color="#e74c3c" /></TouchableOpacity>
             </View>
           ))}

           <View style={styles.section}>
              <Text style={[styles.label, { color: theme.text }]}>SKETCH / REFERENCE PHOTOS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imgRow}>
                 <TouchableOpacity style={[styles.pickBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={pickImage}>
                    <Ionicons name="camera-outline" size={30} color={theme.brand} />
                 </TouchableOpacity>
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

              <TouchableOpacity style={[styles.finalBtn, { backgroundColor: theme.brand }]} onPress={handleSubmit} disabled={loading}>
                 {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.finalBtnText}>CONFIRM ORDER</Text>}
              </TouchableOpacity>
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
  finalBtnText: { fontSize: 17, fontWeight: 'bold', color: '#000' }
});

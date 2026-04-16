import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useColorScheme } from 'react-native';
import api from '../../utils/api';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

export default function Bills() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Payment Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchBills = async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await api.get('/customers/bills/me');
      if (response.data.success) {
        setItems(response.data.data.data || []);
      }
    } catch (error: any) {
      console.error('Fetch Bills Error:', error.message);
      Alert.alert('Error', 'Failed to load invoices');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#2ecc71'; 
      case 'partially_paid': return '#f39c12'; 
      case 'unpaid': 
      default: return '#e74c3c'; 
    }
  };

  const openPaymentModal = (bill: any) => {
    if (bill.payment?.paymentStatus === 'paid') {
      return Alert.alert('Paid', 'This bill is already fully paid.');
    }
    setSelectedBill(bill);
    setPayAmount('');
    setPayMethod('cash');
    setPaymentModalVisible(true);
  };

  const handleRecordPayment = async () => {
    if (!payAmount) return Alert.alert('Error', 'Please enter payment amount.');
    
    setSubmittingPayment(true);
    try {
      const payload = {
        additionalPayment: parseFloat(payAmount),
        paymentMethod: payMethod
      };
      const res = await api.patch(`/customers/bills/pay?bill_id=${selectedBill._id}`, payload);
      if (res.data.success) {
        Alert.alert('Success', 'Payment recorded successfully! 💰');
        setPaymentModalVisible(false);
        fetchBills(true);
      }
    } catch (error: any) {
      Alert.alert('Payment Error', error.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const customer = item.customerId || { name: 'Unknown', phone: 'N/A' };
    const firstItem = item.invoice?.items && item.invoice.items.length > 0 ? item.invoice.items[0] : { itemName: 'Jewelry Items' };
    const grandTotal = item.invoice?.grandTotal || 0;
    const payment = item.payment || { amountPaid: 0, remainingAmount: 0, paymentStatus: 'unpaid' };
    const statusColor = getStatusColor(payment.paymentStatus);

    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
             <View style={[styles.iconBox, { backgroundColor: statusColor + '15' }]}>
                <Ionicons name="receipt" size={24} color={statusColor} />
             </View>
             <View>
                <Text style={[styles.customerName, { color: theme.text }]}>{customer.name}</Text>
                <Text style={[styles.customerPhone, { color: theme.text, opacity: 0.6 }]}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
             </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
             <Text style={[styles.totalAmt, { color: theme.text }]}>₹ {grandTotal.toFixed(2)}</Text>
             <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                 <Text style={{ color: statusColor, fontWeight: 'bold', fontSize: 10 }}>
                    {payment.paymentStatus.replace('_', ' ').toUpperCase()}
                 </Text>
             </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.orderInfo}>
          <Text style={[styles.itemName, { color: theme.text }]}>{firstItem.itemName} {item.invoice?.items.length > 1 ? `+${item.invoice.items.length - 1} more` : ''}</Text>
        </View>
        
        <View style={styles.statsRow}>
           <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: theme.text, opacity: 0.5 }]}>Paid</Text>
              <Text style={[styles.statVal, { color: '#2ecc71' }]}>₹ {payment.amountPaid.toFixed(2)}</Text>
           </View>
           <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: theme.text, opacity: 0.5 }]}>Balance Due</Text>
              <Text style={[styles.statVal, { color: '#e74c3c' }]}>₹ {payment.remainingAmount.toFixed(2)}</Text>
           </View>
           {payment.paymentStatus !== 'paid' && (
             <TouchableOpacity 
               style={[styles.payBtn, { borderColor: theme.brand }]} 
               onPress={() => openPaymentModal(item)}
             >
               <Text style={{ color: theme.brand, fontWeight: 'bold', fontSize: 12 }}>Add Pay</Text>
             </TouchableOpacity>
           )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Header Actions */}
      <View style={styles.actionContainer}>
         <TouchableOpacity 
            style={[styles.addNewBtn, { backgroundColor: theme.brand }]}
            onPress={() => router.push('/create-bill')}
         >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addNewText}>Generate Invoice</Text>
         </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.brand} />
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchBills(true)} tintColor={theme.brand} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={80} color={theme.icon} style={{ opacity: 0.2 }} />
              <Text style={[styles.emptyText, { color: theme.text, opacity: 0.5 }]}>No bills generated yet</Text>
              <TouchableOpacity 
                style={[styles.emptyBtn, { borderColor: theme.brand }]}
                onPress={() => router.push('/create-bill')}
              >
                <Text style={{ color: theme.brand, fontWeight: 'bold' }}>Create Invoice</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <Modal visible={paymentModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
           <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
             <Text style={[styles.modalTitle, { color: theme.text }]}>Record Payment</Text>
             {selectedBill && (
                 <Text style={{ color: theme.text, marginBottom: 15, opacity: 0.7 }}>
                     Pending: ₹ {selectedBill.payment.remainingAmount.toFixed(2)}
                 </Text>
             )}

             <Text style={[styles.modalLabel, { color: theme.text }]}>Amount to Receive (₹)</Text>
             <TextInput 
                style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                placeholder="0.00"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={payAmount}
                onChangeText={setPayAmount}
             />

             <Text style={[styles.modalLabel, { color: theme.text }]}>Payment Method</Text>
             <View style={[styles.pickerContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Picker
                  selectedValue={payMethod}
                  onValueChange={setPayMethod}
                  style={{ color: theme.text }}
                  dropdownIconColor={theme.brand}
                >
                  <Picker.Item label="Cash" value="cash" />
                  <Picker.Item label="UPI" value="upi" />
                  <Picker.Item label="Card" value="card" />
                  <Picker.Item label="Bank Transfer" value="bank_transfer" />
                </Picker>
              </View>

              <View style={styles.modalBtns}>
                 <TouchableOpacity 
                   style={[styles.modalCloseBtn, { borderColor: theme.border }]} 
                   onPress={() => setPaymentModalVisible(false)}
                   disabled={submittingPayment}
                 >
                   <Text style={{ color: theme.text, fontWeight: 'bold' }}>Cancel</Text>
                 </TouchableOpacity>

                 <TouchableOpacity 
                   style={[styles.modalSubmitBtn, { backgroundColor: theme.brand }]} 
                   onPress={handleRecordPayment}
                   disabled={submittingPayment}
                 >
                   {submittingPayment ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>Receive Pay</Text>}
                 </TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  actionContainer: { padding: 20, paddingBottom: 10 },
  addNewBtn: { height: 60, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, elevation: 4 },
  addNewText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { padding: 20, borderRadius: 20, marginBottom: 15, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  customerName: { fontSize: 16, fontWeight: 'bold' },
  customerPhone: { fontSize: 12, marginTop: 4 },
  totalAmt: { fontSize: 18, fontWeight: 'bold' },
  divider: { height: 1, width: '100%', marginBottom: 15, opacity: 0.5 },
  orderInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  itemName: { fontSize: 14, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  statBox: { alignItems: 'flex-start' },
  statLabel: { fontSize: 11, marginBottom: 4 },
  statVal: { fontSize: 15, fontWeight: 'bold' },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, marginTop: 5 },
  payBtn: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 20, fontSize: 16 },
  emptyBtn: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10, borderWidth: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', padding: 25, borderRadius: 20, borderWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  modalLabel: { fontSize: 13, fontWeight: 'bold', marginBottom: 8, marginTop: 10 },
  modalInput: { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 15 },
  pickerContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', height: 50, justifyContent: 'center', marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 15, marginTop: 10 },
  modalCloseBtn: { flex: 1, padding: 15, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  modalSubmitBtn: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center' }
});

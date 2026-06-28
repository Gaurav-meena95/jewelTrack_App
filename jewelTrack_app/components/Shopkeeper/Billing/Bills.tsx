import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import api from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

export default function BillsComponent() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'customers' | 'all'>('customers');

  // Payment Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payNote, setPayNote] = useState('');
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

  // Derived unique customers data
  const uniqueCustomers = React.useMemo(() => {
    const customerMap: Record<string, any> = {};
    items.forEach(bill => {
      if (!bill.customerId || !bill.customerId._id) return;
      const custId = bill.customerId._id;
      if (!customerMap[custId]) {
        customerMap[custId] = {
          _id: custId,
          name: bill.customerId.name,
          phone: bill.customerId.phone,
          totalBills: 0,
          totalPaid: 0,
          totalDue: 0,
          lastPurchase: bill.createdAt,
          bills: []
        };
      }
      const c = customerMap[custId];
      c.totalBills += 1;
      c.totalPaid += bill.payment?.amountPaid || 0;
      c.totalDue += bill.payment?.remainingAmount || 0;
      if (new Date(bill.createdAt) > new Date(c.lastPurchase)) {
        c.lastPurchase = bill.createdAt;
      }
      c.bills.push(bill);
    });

    let list = Object.values(customerMap);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || String(c.phone).includes(q));
    }
    return list.sort((a, b) => new Date(b.lastPurchase).getTime() - new Date(a.lastPurchase).getTime());
  }, [items, searchQuery]);

  const metrics = React.useMemo(() => {
    const total = items.reduce((sum, b) => sum + (b.invoice?.grandTotal || 0), 0);
    const due = items.reduce((sum, b) => sum + (b.payment?.remainingAmount || 0), 0);
    const count = items.length;
    return { total, due, count };
  }, [items]);

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
    setPayNote('');
    setPaymentModalVisible(true);
  };

  const handleRecordPayment = async () => {
    if (!payAmount) return Alert.alert('Error', 'Please enter payment amount.');

    setSubmittingPayment(true);
    try {
      const payload = {
        additionalPayment: parseFloat(payAmount),
        paymentMethod: payMethod,
        note: payNote
      };
      const res = await api.patch(`/customers/bills/pay?bill_id=${selectedBill._id}`, payload);
      if (res.data.success) {
        Alert.alert('Success', 'Payment recorded successfully!');
        setPaymentModalVisible(false);
        fetchBills(true);
      }
    } catch (error: any) {
      Alert.alert('Payment Error', error.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const printBill = async (bill: any) => {
    try {
      const customer = bill.customerId || { name: 'Walk-in Customer', phone: '', address: '' };
      const items = bill.invoice?.items || [];
      const grandTotal = bill.invoice?.grandTotal || 0;

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
              .header { text-align: center; border-bottom: 2px solid #d2a907; padding-bottom: 20px; margin-bottom: 20px; }
              .title { font-size: 32px; font-weight: bold; color: #d2a907; margin: 0; }
              .subtitle { font-size: 16px; color: #666; margin-top: 5px; }
              .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
              .details-box { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              th { background: #f0f0f0; padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #ccc; }
              td { padding: 12px; border-bottom: 1px solid #eee; }
              .totals { width: 50%; float: right; }
              .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
              .grand-total { font-size: 20px; font-weight: bold; color: #d2a907; border-top: 2px solid #d2a907; padding-top: 10px; border-bottom: none; }
              .footer { text-align: center; margin-top: 60px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; clear: both; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="title">JewelTrack Invoices</h1>
              <div class="subtitle">Premium Jewelry & Accessories</div>
              <div>Invoice Date: ${new Date(bill.createdAt).toLocaleDateString()}</div>
              <div>Receipt No: #${bill._id.slice(-6).toUpperCase()}</div>
            </div>
            
            <div class="details-box">
              <strong>Bill To:</strong><br/>
              ${customer.name}<br/>
              Phone: ${customer.phone}<br/>
              ${customer.address ? `Address: ${customer.address}` : ''}
            </div>

            <table>
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th>Metal</th>
                  <th>Weight (g)</th>
                  <th>Rate/g</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((i: any) => `
                  <tr>
                    <td>${i.itemName} <br/> <small>GST: ${i.gstPercent}%, Charge: ${i.makingChargePercent}%</small></td>
                    <td style="text-transform: capitalize;">${i.metal}</td>
                    <td>${i.weight}</td>
                    <td>₹${i.ratePerGram || 0}</td>
                    <td>₹${i.finalPrice || 0}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals">
              <div class="totals-row">
                <span>Subtotal</span>
                <span>₹ ${grandTotal.toFixed(2)}</span>
              </div>
              <div class="totals-row">
                <span>Amount Paid</span>
                <span style="color: #2ecc71;">₹ ${bill.payment.amountPaid.toFixed(2)}</span>
              </div>
              <div class="totals-row grand-total">
                <span>Balance Due</span>
                <span style="color: #e74c3c;">₹ ${bill.payment.remainingAmount.toFixed(2)}</span>
              </div>
            </div>

            <div class="footer">
              <p>Thank you for choosing us! All items sold are subject to standard jewelry terms and conditions.</p>
              <p>Software Powered by JewelTrack App</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Share Invoice' });
      } else {
        Alert.alert('Success', 'PDF generated at: ' + uri);
      }
    } catch (e: any) {
      console.log('PDF Error', e);
      Alert.alert('Error', 'Failed to generate PDF invoice.');
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const customer = item.customerId || { name: 'Unknown', phone: 'N/A' };
    const firstItem = item.invoice?.items && item.invoice.items.length > 0 ? item.invoice.items[0] : { itemName: 'Jewelry Items' };

    return (
      <Pressable 
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => openPaymentModal(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
             <View style={[styles.iconBox, { backgroundColor: theme.brand + '15' }]}>
                <Ionicons name="receipt-outline" size={22} color={theme.brand} />
             </View>
             <View>
                <Text style={[styles.customerName, { color: theme.text, fontFamily: Fonts.bold }]}>{customer.name}</Text>
                <Text style={[styles.customerPhone, { color: theme.text }]}>+91 {customer.phone}</Text>
             </View>
          </View>
          <Pressable style={styles.payBtn} onPress={() => printBill(item)}>
            <Ionicons name="download-outline" size={20} color={theme.brand} />
          </Pressable>
        </View>

        <View style={styles.divider} />

        <View style={styles.orderInfo}>
          <Text style={[styles.itemName, { color: theme.text }]}>{firstItem.itemName} {item.invoice?.items?.length > 1 ? `(+${item.invoice.items.length - 1})` : ''}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.payment?.paymentStatus) + '15' }]}>
             <Text style={{ color: getStatusColor(item.payment?.paymentStatus), fontSize: 9, fontWeight: 'bold' }}>
               {item.payment?.paymentStatus?.toUpperCase() || 'UNPAID'}
             </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
             <Text style={[styles.statLabel, { color: theme.text }]}>TOTAL</Text>
             <Text style={[styles.statVal, { color: theme.text }]}>₹ {item.invoice?.grandTotal}</Text>
          </View>
          <View style={styles.statBox}>
             <Text style={[styles.statLabel, { color: theme.text }]}>DUE</Text>
             <Text style={[styles.statVal, { color: '#e74c3c' }]}>₹ {item.payment?.remainingAmount}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderCustomerItem = ({ item }: { item: any }) => (
    <Pressable 
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={() => { setViewMode('all'); setSearchQuery(item.phone); }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
           <View style={[styles.iconBox, { backgroundColor: theme.brand + '15' }]}>
              <Ionicons name="person-outline" size={22} color={theme.brand} />
           </View>
           <View>
              <Text style={[styles.customerName, { color: theme.text, fontFamily: Fonts.bold }]}>{item.name}</Text>
              <Text style={[styles.customerPhone, { color: theme.text }]}>+91 {item.phone}</Text>
           </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.icon} />
      </View>

      <View style={styles.divider} />

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
           <Text style={[styles.statLabel, { color: theme.text }]}>INVOICES</Text>
           <Text style={[styles.statVal, { color: theme.text }]}>{item.totalBills}</Text>
        </View>
        <View style={styles.statBox}>
           <Text style={[styles.statLabel, { color: theme.text }]}>TOTAL PAID</Text>
           <Text style={[styles.statVal, { color: theme.text }]}>₹ {item.totalPaid.toLocaleString()}</Text>
        </View>
        <View style={styles.statBox}>
           <Text style={[styles.statLabel, { color: theme.text }]}>OUTSTANDING</Text>
           <Text style={[styles.statVal, { color: '#e74c3c' }]}>₹ {item.totalDue.toLocaleString()}</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Header Actions */}
      <View style={styles.actionContainer}>
         {viewMode === 'all' ? (
           <Pressable 
              style={[styles.addNewBtn, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}
              onPress={() => { setViewMode('customers'); setSearchQuery(''); }}
           >
              <Ionicons name="arrow-back-outline" size={20} color={theme.text} />
              <Text style={[styles.addNewText, { color: theme.text, fontFamily: Fonts.medium }]}>Back to Customers</Text>
           </Pressable>
         ) : (
           <View style={{ flexDirection: 'row', gap: 10 }}>
             <Pressable 
                style={[styles.addNewBtn, { backgroundColor: theme.brand, flex: 1 }]}
                onPress={() => router.push('/create-bill')}
             >
                <Ionicons name="add-outline" size={20} color="#000" />
                <Text style={[styles.addNewText, { color: '#000', fontFamily: Fonts.medium }]}>Create Invoice</Text>
             </Pressable>
           </View>
         )}
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={theme.icon} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
          placeholder={viewMode === 'customers' ? "Search ledger by name / phone..." : "Search bills by phone..."}
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tab Switcher */}
      <View style={[styles.tabSwitcher, { backgroundColor: theme.card, borderColor: theme.border }]}>
         <Pressable 
           style={[styles.tab, viewMode === 'customers' && { backgroundColor: theme.brand }]} 
           onPress={() => { setViewMode('customers'); setSearchQuery(''); }}
         >
            <Text style={[styles.tabText, { color: viewMode === 'customers' ? '#000' : theme.text }]}>CUSTOMER LEDGER</Text>
         </Pressable>
         <Pressable 
           style={[styles.tab, viewMode === 'all' && { backgroundColor: theme.brand }]} 
           onPress={() => { setViewMode('all'); setSearchQuery(''); }}
         >
            <Text style={[styles.tabText, { color: viewMode === 'all' ? '#000' : theme.text }]}>ALL INVOICES</Text>
         </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.brand} />
        </View>
      ) : (
        <FlatList
          data={viewMode === 'customers' ? uniqueCustomers : items.filter(b => !searchQuery.trim() || (b.customerId?.phone && b.customerId.phone.includes(searchQuery)))}
          renderItem={viewMode === 'customers' ? renderCustomerItem : renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchBills(true)} tintColor={theme.brand} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={70} color={theme.icon} style={{ opacity: 0.2 }} />
              <Text style={[styles.emptyText, { color: theme.text }]}>No Invoices Found</Text>
            </View>
          }
        />
      )}

      {/* Payment Recorder Modal */}
      <Modal visible={paymentModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={[styles.modalTitle, { color: theme.text, fontFamily: Fonts.bold, marginBottom: 0 }]}>Record Due Payment</Text>
              <Pressable onPress={() => setPaymentModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={{ marginBottom: 15 }}>
                <Text style={{ color: theme.text, opacity: 0.5, fontSize: 12 }}>Invoice No.</Text>
                <Text style={{ color: theme.text, fontSize: 15, fontWeight: 'bold', marginTop: 4 }}>#{selectedBill?._id.slice(-8).toUpperCase()}</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 15, marginBottom: 20 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, opacity: 0.5, fontSize: 12 }}>Grand Total</Text>
                  <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold', marginTop: 4 }}>₹ {selectedBill?.invoice?.grandTotal}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, opacity: 0.5, fontSize: 12 }}>Remaining Due</Text>
                  <Text style={{ color: '#e74c3c', fontSize: 18, fontWeight: 'bold', marginTop: 4 }}>₹ {selectedBill?.payment?.remainingAmount}</Text>
                </View>
              </View>

              <Text style={[styles.modalLabel, { color: theme.text }]}>Amount Paid (₹)</Text>
              <TextInput placeholderTextColor="#999"
                style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, marginBottom: 15 }]}
                placeholder="0.00"
                keyboardType="numeric"
                value={payAmount}
                onChangeText={setPayAmount}
              />

              <Text style={[styles.modalLabel, { color: theme.text }]}>Payment Method</Text>
              <View style={[styles.pickerContainer, { backgroundColor: theme.card, borderColor: theme.border, marginBottom: 15 }]}>
                <Picker
                  selectedValue={payMethod}
                  onValueChange={(itemValue) => setPayMethod(itemValue)}
                  style={{ color: theme.text }}
                  dropdownIconColor={theme.text}
                >
                  <Picker.Item label="Cash" value="cash" color={theme.text} />
                  <Picker.Item label="UPI" value="upi" color={theme.text} />
                  <Picker.Item label="Card" value="card" color={theme.text} />
                  <Picker.Item label="Bank Transfer" value="bank_transfer" color={theme.text} />
                </Picker>
              </View>

              <Text style={[styles.modalLabel, { color: theme.text }]}>Notes / Remarks</Text>
              <TextInput placeholderTextColor="#999"
                style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, marginBottom: 15 }]}
                placeholder="e.g. Paid online, partial cash payment"
                value={payNote}
                onChangeText={setPayNote}
              />

              <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>Transaction History</Text>
              <View style={{ marginBottom: 15 }}>
                 {selectedBill?.payment?.paymentHistory && selectedBill.payment.paymentHistory.length > 0 ? (
                   selectedBill.payment.paymentHistory.map((h: any, i: number) => (
                     <View key={i} style={[styles.historyItem, { borderBottomColor: theme.border }]}>
                        <View style={{ flex: 1 }}>
                           <Text style={[styles.histAmt, { color: theme.text }]}>₹ {h.amount}</Text>
                           <Text style={[styles.histDate, { color: theme.text, opacity: 0.5 }]}>
                             {new Date(h.date).toLocaleDateString()} • {h.method ? h.method.toUpperCase() : 'CASH'}
                           </Text>
                           {h.note && (
                             <Text style={{ color: theme.text, fontSize: 11, opacity: 0.6, marginTop: 4, fontStyle: 'italic' }}>
                                Note: {h.note}
                             </Text>
                           )}
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: '#2ecc7115', marginTop: 0 }]}>
                           <Text style={{ color: '#2ecc71', fontSize: 9, fontWeight: 'bold' }}>RECEIVED</Text>
                        </View>
                     </View>
                   ))
                 ) : (
                   <Text style={{ color: theme.text, opacity: 0.5, fontSize: 12, fontStyle: 'italic' }}>No transactions recorded yet.</Text>
                 )}
              </View>
            </ScrollView>

            <View style={styles.modalBtns}>
              <Pressable
                style={[styles.modalCloseBtn, { borderColor: theme.border }]}
                onPress={() => setPaymentModalVisible(false)}
                disabled={submittingPayment}
              >
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.modalSubmitBtn, { backgroundColor: theme.brand }]}
                onPress={handleRecordPayment}
                disabled={submittingPayment}
              >
                {submittingPayment ? <ActivityIndicator color="#000" size="small" /> : <Text style={{ color: '#000', fontWeight: 'bold' }}>Receive Pay</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  actionContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  addNewBtn: { height: 60, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, elevation: 4 },
  addNewText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  searchIcon: { position: 'absolute', left: 35, zIndex: 1, opacity: 0.5 },
  searchInput: { flex: 1, height: 48, borderRadius: 15, paddingLeft: 45, paddingRight: 15, borderWidth: 1, fontSize: 13 },
  tabSwitcher: { flexDirection: 'row', marginHorizontal: 20, padding: 4, borderRadius: 15, borderWidth: 1, marginBottom: 15 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: 'center' },
  tabText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { padding: 18, borderRadius: 25, marginBottom: 15, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  customerName: { fontSize: 15, fontWeight: 'bold', letterSpacing: 0.3 },
  customerPhone: { fontSize: 10, marginTop: 2, opacity: 0.6 },
  totalAmt: { fontSize: 17, fontWeight: 'bold' },
  divider: { height: 1, width: '100%', marginBottom: 15, opacity: 0.5 },
  orderInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  itemName: { fontSize: 14, fontWeight: '600', letterSpacing: 0.2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statBox: { alignItems: 'flex-start' },
  statLabel: { fontSize: 9, marginBottom: 4, fontWeight: 'bold', opacity: 0.5 },
  statVal: { fontSize: 14, fontWeight: 'bold' },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, marginTop: 5 },
  payBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 20, fontSize: 14, opacity: 0.6 },
  emptyBtn: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 25, borderRadius: 10, borderWidth: 1 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 12, opacity: 0.8, letterSpacing: 0.5 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  histAmt: { fontSize: 14, fontWeight: 'bold' },
  histDate: { fontSize: 10, marginTop: 2, opacity: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { width: '100%', padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, height: '80%' },
  modalTitle: { fontSize: 19, fontWeight: 'bold', marginBottom: 20, letterSpacing: 0.5 },
  modalLabel: { fontSize: 11, fontWeight: 'bold', marginBottom: 8, marginTop: 10, opacity: 0.6 },
  modalInput: { padding: 15, borderRadius: 15, borderWidth: 1, fontSize: 14 },
  pickerContainer: { borderRadius: 15, borderWidth: 1, overflow: 'hidden', height: 55, justifyContent: 'center', marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 15, marginTop: 15 },
  modalCloseBtn: { flex: 1, padding: 18, borderRadius: 15, borderWidth: 1, alignItems: 'center' },
  modalSubmitBtn: { flex: 1, padding: 18, borderRadius: 15, alignItems: 'center' }
});

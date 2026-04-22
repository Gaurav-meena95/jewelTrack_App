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
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'customers' | 'all'>('customers'); // Added viewMode

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

  // Derived unique customers data (matching reference functionality)
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
                <Text style={[styles.customerPhone, { color: theme.text, opacity: 0.5 }]}>
                  {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
             </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
             <Text style={[styles.totalAmt, { color: theme.text }]}>₹ {grandTotal.toFixed(0)}</Text>
             <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                 <Text style={{ color: statusColor, fontWeight: 'bold', fontSize: 9 }}>
                    {payment.paymentStatus.replace('_', ' ').toUpperCase()}
                 </Text>
             </View>
          </View>
        </View>

        {/* Receipt Divider Effect */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 15 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: theme.background, marginLeft: -25 }} />
          <View style={{ flex: 1, height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.border, borderRadius: 1 }} />
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: theme.background, marginRight: -25 }} />
        </View>

        <View style={styles.orderInfo}>
          <Ionicons name="sparkles" size={14} color={theme.brand} style={{ marginRight: 5 }} />
          <Text style={[styles.itemName, { color: theme.text, flex: 1 }]}>{firstItem.itemName} {item.invoice?.items.length > 1 ? `+${item.invoice.items.length - 1} more items` : ''}</Text>
          <TouchableOpacity style={{ padding: 5 }} onPress={() => printBill(item)}>
             <Ionicons name="share-outline" size={20} color={theme.text} style={{ opacity: 0.5 }} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsRow}>
           <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: theme.text, opacity: 0.4 }]}>PAID</Text>
              <Text style={[styles.statVal, { color: '#2ecc71' }]}>₹ {payment.amountPaid.toFixed(0)}</Text>
           </View>
           <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: theme.text, opacity: 0.4 }]}>DUE</Text>
              <Text style={[styles.statVal, { color: '#e74c3c' }]}>₹ {payment.remainingAmount.toFixed(0)}</Text>
           </View>
           {payment.paymentStatus !== 'paid' && (
             <TouchableOpacity 
               style={[styles.payBtn, { backgroundColor: theme.brand }]} 
               onPress={() => openPaymentModal(item)}
             >
               <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 11 }}>RECEIVE</Text>
             </TouchableOpacity>
           )}
        </View>
      </View>
    );
  };

  const renderCustomerItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={() => {
        setSearchQuery(item.phone);
        setViewMode('all');
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: theme.brand + '15' }]}>
            <Ionicons name="person" size={24} color={theme.brand} />
          </View>
          <View>
            <Text style={[styles.customerName, { color: theme.text }]}>{item.name}</Text>
            <Text style={[styles.customerPhone, { color: theme.text, opacity: 0.6 }]}>{item.phone}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.totalAmt, { color: theme.text }]}>₹ {item.totalDue.toLocaleString()}</Text>
          <Text style={{ fontSize: 10, color: item.totalDue > 0 ? '#e74c3c' : '#2ecc71', fontWeight: 'bold' }}>
            {item.totalDue > 0 ? 'TOTAL DUE' : 'FULLY PAID'}
          </Text>
        </View>
      </View>
      <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 10 }]} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: theme.text, opacity: 0.5, fontSize: 12 }}>{item.totalBills} Invoices</Text>
        <Text style={{ color: theme.text, opacity: 0.5, fontSize: 12 }}>Last: {new Date(item.lastPurchase).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Summary */}
      {!loading && viewMode === 'customers' && (
        <View style={styles.statsHeader}>
          <View style={[styles.miniStat, { backgroundColor: theme.card, borderColor: theme.border }]}>
             <Text style={[styles.miniLabel, { color: theme.text }]}>SALES</Text>
             <Text style={[styles.miniVal, { color: theme.text }]}>₹{(metrics.total / 1000).toFixed(1)}k</Text>
          </View>
          <View style={[styles.miniStat, { backgroundColor: theme.card, borderColor: theme.border }]}>
             <Text style={[styles.miniLabel, { color: theme.text }]}>PENDING</Text>
             <Text style={[styles.miniVal, { color: '#e74c3c' }]}>₹{(metrics.due / 1000).toFixed(1)}k</Text>
          </View>
          <View style={[styles.miniStat, { backgroundColor: theme.card, borderColor: theme.border }]}>
             <Text style={[styles.miniLabel, { color: theme.text }]}>BILLS</Text>
             <Text style={[styles.miniVal, { color: theme.brand }]}>{metrics.count}</Text>
          </View>
        </View>
      )}

      {/* Header Actions */}
      <View style={styles.actionContainer}>
         <TouchableOpacity 
            style={[styles.addNewBtn, { backgroundColor: theme.brand }]}
            onPress={() => router.push('/create-bill')}
         >
            <Ionicons name="add" size={24} color="#000" />
            <Text style={[styles.addNewText, { color: '#000' }]}>Create Invoice</Text>
         </TouchableOpacity>
      </View>

      {/* View Switcher - Segmented Control Style */}
      <View style={[styles.tabSwitcher, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity 
          style={[styles.tab, viewMode === 'customers' && { backgroundColor: theme.brand }]}
          onPress={() => setViewMode('customers')}
        >
          <Text style={[styles.tabText, { color: viewMode === 'customers' ? '#000' : theme.text, opacity: viewMode === 'customers' ? 1 : 0.5 }]}>CUSTOMERS</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, viewMode === 'all' && { backgroundColor: theme.brand }]}
          onPress={() => {
            setViewMode('all');
            setSearchQuery('');
          }}
        >
          <Text style={[styles.tabText, { color: viewMode === 'all' ? '#000' : theme.text, opacity: viewMode === 'all' ? 1 : 0.5 }]}>ALL BILLS</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.icon} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
          placeholder="Search by customer name..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.brand} />
        </View>
      ) : (
        <FlatList
          data={viewMode === 'customers' 
            ? uniqueCustomers 
            : items.filter(i => (i.customerId?.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
          }
          renderItem={viewMode === 'customers' ? renderCustomerItem : renderItem}
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
             <Text style={[styles.modalTitle, { color: theme.text }]}>Invoice Details</Text>
             {selectedBill && (
                 <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                        <Text style={{ color: theme.text, opacity: 0.6 }}>Total Amount</Text>
                        <Text style={{ color: theme.text, fontWeight: 'bold' }}>₹ {selectedBill.invoice.grandTotal.toFixed(2)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                        <Text style={{ color: theme.text, opacity: 0.6 }}>Remaining Due</Text>
                        <Text style={{ color: '#e74c3c', fontWeight: 'bold' }}>₹ {selectedBill.payment.remainingAmount.toFixed(2)}</Text>
                    </View>
                    
                    <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 10 }]}>Transaction History</Text>
                    <ScrollView style={{ maxHeight: 120, marginBottom: 20 }}>
                       {selectedBill?.paymentHistory?.length > 0 ? (
                          selectedBill.paymentHistory.map((h: any, i: number) => (
                            <View key={i} style={[styles.historyItem, { borderBottomColor: theme.border }]}>
                               <View>
                                  <Text style={[styles.histAmt, { color: theme.text }]}>₹{h.amount}</Text>
                                  <Text style={[styles.histDate, { color: theme.text, opacity: 0.5 }]}>{new Date(h.date).toLocaleString()}</Text>
                               </View>
                               <View style={[styles.statusBadge, { backgroundColor: theme.brand + '15', marginTop: 0 }]}>
                                  <Text style={{ color: theme.brand, fontSize: 10, fontWeight: 'bold' }}>{h.method?.toUpperCase()}</Text>
                                </View>
                            </View>
                          ))
                       ) : (
                          <Text style={{ color: theme.text, opacity: 0.4, fontSize: 12, fontStyle: 'italic', paddingVertical: 10 }}>No previous payments recorded.</Text>
                       )}
                    </ScrollView>
                 </View>
              )}

              <Text style={[styles.modalLabel, { color: theme.text, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 15 }]}>Amount to Receive (₹)</Text>
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
  actionContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  addNewBtn: { height: 60, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, elevation: 4 },
  addNewText: { fontSize: 16, fontWeight: 'bold' },
  statsHeader: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginTop: 20 },
  miniStat: { flex: 1, padding: 15, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  miniLabel: { fontSize: 10, fontWeight: 'bold', opacity: 0.5, marginBottom: 5 },
  miniVal: { fontSize: 18, fontWeight: 'bold' },

  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10, marginTop: 10 },
  searchIcon: { position: 'absolute', left: 35, zIndex: 1, opacity: 0.5 },
  searchInput: { flex: 1, height: 50, borderRadius: 15, paddingLeft: 45, paddingRight: 15, borderWidth: 1, fontSize: 15 },
  tabSwitcher: { flexDirection: 'row', marginHorizontal: 20, padding: 5, borderRadius: 15, borderWidth: 1, marginBottom: 15 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabText: { fontSize: 11, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { padding: 20, borderRadius: 25, marginBottom: 15, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 48, height: 48, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  customerName: { fontSize: 17, fontWeight: 'bold' },
  customerPhone: { fontSize: 12, marginTop: 2 },
  totalAmt: { fontSize: 19, fontWeight: 'bold' },
  divider: { height: 1, width: '100%', marginBottom: 15, opacity: 0.5 },
  orderInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  itemName: { fontSize: 15, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statBox: { alignItems: 'flex-start' },
  statLabel: { fontSize: 10, marginBottom: 4, fontWeight: 'bold' },
  statVal: { fontSize: 16, fontWeight: 'bold' },
  statusBadge: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, marginTop: 5 },
  payBtn: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 12, borderWidth: 1 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 20, fontSize: 16 },
  emptyBtn: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10, borderWidth: 1 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 15, opacity: 0.8 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  histAmt: { fontSize: 16, fontWeight: 'bold' },
  histDate: { fontSize: 11, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { width: '100%', padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, height: '80%' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  modalLabel: { fontSize: 13, fontWeight: 'bold', marginBottom: 8, marginTop: 10 },
  modalInput: { padding: 18, borderRadius: 15, borderWidth: 1, fontSize: 16 },
  pickerContainer: { borderRadius: 15, borderWidth: 1, overflow: 'hidden', height: 60, justifyContent: 'center', marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 15, marginTop: 15 },
  modalCloseBtn: { flex: 1, padding: 18, borderRadius: 15, borderWidth: 1, alignItems: 'center' },
  modalSubmitBtn: { flex: 1, padding: 18, borderRadius: 15, alignItems: 'center' }
});

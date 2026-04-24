import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Pressable, 
  ActivityIndicator, 
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Image,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts } from '../../constants/theme';
import { useColorScheme } from 'react-native';
import api from '../../utils/api';
import { Ionicons } from '@expo/vector-icons';

export default function Orders() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'dashboard' | 'history'>('dashboard');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Detail Modal State
  const [showDetail, setShowDetail] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const fetchOrders = async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await api.get('/customers/orders/me');
      if (response.data.success) {
        setItems(response.data.data.data || []);
      }
    } catch (error: any) {
      console.error('Fetch Orders Error:', error.message);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDelete = (item: any) => {
    Alert.alert(
      'Delete Order',
      'Are you sure you want to cancel and delete this order permanently?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
             try {
               await api.delete(`/customers/orders/delete?order_id=${item._id}`);
               fetchOrders();
             } catch(err) {
               Alert.alert('Error', 'Failed to delete order');
             }
          }
        }
      ]
    );
  };

  const customerGroups = useMemo(() => {
    const groups: { [key: string]: any } = {};
    items.forEach(order => {
      const phone = order.customerId?.phone;
      if (!phone) return;
      if (!groups[phone]) {
        groups[phone] = {
          name: order.customerId.name,
          phone: order.customerId.phone,
          totalDue: 0,
          totalOrders: 0,
          lastOrder: order.createdAt,
          orders: []
        };
      }
      groups[phone].totalDue += (order.RemainingAmount || 0);
      groups[phone].totalOrders += 1;
      groups[phone].orders.push(order);
      if (new Date(order.createdAt) > new Date(groups[phone].lastOrder)) {
        groups[phone].lastOrder = order.createdAt;
      }
    });

    let list = Object.values(groups);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
    }
    return list.sort((a, b) => new Date(b.lastOrder).getTime() - new Date(a.lastOrder).getTime());
  }, [items, searchQuery]);

  const handleUpdateStatus = async (order: any, amount: number, newStatus: string) => {
    if (isNaN(amount)) return Alert.alert('Invalid Amount', 'Please enter a valid numeric amount');
    try {
      setLoading(true);
      const remain = order.RemainingAmount !== undefined ? order.RemainingAmount : ((order.Total || 0) - (order.AdvancePayment || 0));
      const newPaid = (order.AdvancePayment || 0) + amount;
      const newRemain = Math.max(0, remain - amount);
      const finalStatus = newRemain <= 0 ? 'complete' : newStatus;

      const payload = {
        ...order,
        AdvancePayment: newPaid,
        RemainingAmount: newRemain,
        orderStatus: finalStatus,
        paymentHistory: [
          ...(order.paymentHistory || []),
          { amount, orderStatus: finalStatus, date: new Date(), notes: 'Payment recorded from App' }
        ]
      };

      const res = await api.patch(`/customers/orders/update/?order_id=${order._id}`, payload);
      if (res.data.success) {
        Alert.alert('Success', 'Order updated successfully!');
        setShowDetail(false);
        fetchOrders(true);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return '#2ecc71'; // Green
      case 'progress': return '#f39c12'; // Orange
      case 'accept': 
      default: return '#3498db'; // Blue
    }
  };

  const renderCustomerItem = ({ item }: { item: any }) => (
    <Pressable 
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={() => { setSelectedCustomer(item); setViewMode('history'); }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
           <View style={[styles.iconBox, { backgroundColor: theme.brand + '15' }]}>
              <Ionicons name="person" size={24} color={theme.brand} />
           </View>
           <View>
              <Text style={[styles.customerName, { color: theme.text }]}>{item.name}</Text>
              <Text style={[styles.customerPhone, { color: theme.text, opacity: 0.6 }]}>+91 {item.phone}</Text>
           </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.icon} />
      </View>
      <View style={styles.statsRow}>
         <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: theme.text, opacity: 0.5 }]}>Total Orders</Text>
            <Text style={[styles.statVal, { color: theme.text }]}>{item.totalOrders}</Text>
         </View>
         <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: theme.text, opacity: 0.5 }]}>Pending Due</Text>
            <Text style={[styles.statVal, { color: '#e74c3c' }]}>₹ {item.totalDue}</Text>
         </View>
      </View>
    </Pressable>
  );

  const renderOrderItem = ({ item }: { item: any }) => {
    const statusColor = getStatusColor(item.orderStatus);
    const firstItemName = item.items && item.items.length > 0 ? item.items[0].itemName : 'Custom Order';

    return (
      <Pressable 
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => { setActiveOrder(item); setShowDetail(true); }}
      >
        <View style={styles.orderInfo}>
          <Text style={[styles.itemName, { color: theme.text }]}>{firstItemName} {item.items.length > 1 ? `(+${item.items.length - 1})` : ''}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
              <Text style={{ color: statusColor, fontWeight: 'bold', fontSize: 10 }}>
                 {item.orderStatus ? item.orderStatus.toUpperCase() : 'ACCEPTED'}
              </Text>
          </View>
        </View>
        <View style={styles.statsRow}>
           <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: theme.text, opacity: 0.5 }]}>Date</Text>
              <Text style={[styles.statVal, { color: theme.text, fontSize: 13 }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
           </View>
           <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: theme.text, opacity: 0.5 }]}>Due</Text>
              <Text style={[styles.statVal, { color: '#e74c3c' }]}>₹ {item.RemainingAmount}</Text>
           </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Header Actions */}
      <View style={styles.actionContainer}>
         {viewMode === 'history' ? (
           <Pressable 
              style={[styles.addNewBtn, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}
              onPress={() => setViewMode('dashboard')}
           >
              <Ionicons name="arrow-back" size={20} color={theme.text} />
              <Text style={[styles.addNewText, { color: theme.text }]}>Back to Customers</Text>
           </Pressable>
         ) : (
           <Pressable 
              style={[styles.addNewBtn, { backgroundColor: theme.brand }]}
              onPress={() => router.push('/create-order')}
           >
              <Ionicons name="add" size={24} color="#000" />
              <Text style={[styles.addNewText, { color: '#000' }]}>New Order</Text>
           </Pressable>
         )}
      </View>

      {viewMode === 'dashboard' && (
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
      )}

      {viewMode === 'history' && selectedCustomer && (
        <View style={styles.customerInfoSection}>
           <Text style={[styles.historyTitle, { color: theme.text }]}>Orders for {selectedCustomer.name}</Text>
           <Text style={[styles.historySub, { color: theme.text, opacity: 0.5 }]}>{selectedCustomer.phone} • {selectedCustomer.totalOrders} total orders</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.brand} />
        </View>
      ) : (
        <FlatList
          data={viewMode === 'dashboard' ? customerGroups : selectedCustomer?.orders || []}
          renderItem={viewMode === 'dashboard' ? renderCustomerItem : renderOrderItem}
          keyExtractor={(item, index) => item._id || index.toString()}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders(true)} tintColor={theme.brand} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="time-outline" size={80} color={theme.icon} style={{ opacity: 0.2 }} />
              <Text style={[styles.emptyText, { color: theme.text, opacity: 0.5 }]}>No records found</Text>
            </View>
          }
        />
      )}

      {/* Order Detail Modal */}
      <Modal visible={showDetail} transparent animationType="slide">
        <View style={styles.modalOverlay}>
           <View style={[styles.detailContent, { backgroundColor: theme.card }]}>
              <View style={styles.modalHeader}>
                 <Text style={[styles.modalTitle, { color: theme.text }]}>Order Details</Text>
                 <Pressable onPress={() => setShowDetail(false)}>
                   <Ionicons name="close" size={24} color={theme.text} />
                 </Pressable>
              </View>

              <ScrollView>
                 <View style={styles.detailHeader}>
                    <Text style={[styles.detName, { color: theme.text }]}>{activeOrder?.items?.[0]?.itemName || 'Custom Order'}</Text>
                    <Text style={[styles.detSub, { color: theme.text, opacity: 0.5 }]}>Status: {activeOrder?.orderStatus?.toUpperCase()}</Text>
                 </View>

                 <View style={styles.detailStats}>
                    <View style={styles.dStat}>
                       <Text style={styles.dLabel}>Total</Text>
                       <Text style={[styles.dVal, { color: theme.text }]}>₹{activeOrder?.Total}</Text>
                    </View>
                    <View style={styles.dStat}>
                       <Text style={styles.dLabel}>Due</Text>
                       <Text style={[styles.dVal, { color: '#e74c3c' }]}>₹{activeOrder?.RemainingAmount}</Text>
                    </View>
                 </View>

                 <Text style={[styles.sectionTitle, { color: theme.text }]}>Actions</Text>
                 <View style={styles.actionBox}>
                    <TextInput 
                      style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, marginBottom: 10 }]} 
                      placeholder="Add Payment Amount (₹)" keyboardType="numeric"
                      onChangeText={setPaymentAmount}
                    />
                    <View style={styles.row}>
                       <Pressable 
                         style={[styles.actionBtn, { backgroundColor: theme.brand, flex: 1 }]}
                         onPress={() => handleUpdateStatus(activeOrder, parseFloat(paymentAmount || '0'), activeOrder.orderStatus)}
                       >
                          <Text style={{ fontWeight: 'bold' }}>Update Payment</Text>
                       </Pressable>
                       <Pressable 
                         style={[styles.actionBtn, { backgroundColor: '#2ecc71', flex: 1 }]}
                         onPress={() => handleUpdateStatus(activeOrder, parseFloat(paymentAmount || '0'), 'complete')}
                       >
                          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Complete Order</Text>
                       </Pressable>
                    </View>
                 </View>

                 <Text style={[styles.sectionTitle, { color: theme.text }]}>Transaction History</Text>
                 <View style={styles.historyList}>
                    {activeOrder?.paymentHistory?.length > 0 ? (
                      activeOrder.paymentHistory.map((h: any, i: number) => (
                        <View key={i} style={[styles.historyItem, { borderBottomColor: theme.border }]}>
                           <View>
                              <Text style={[styles.histAmt, { color: theme.text }]}>₹{h.amount}</Text>
                              <Text style={[styles.histDate, { color: theme.text, opacity: 0.5 }]}>{new Date(h.date).toLocaleString()}</Text>
                           </View>
                           <View style={[styles.statusBadge, { backgroundColor: getStatusColor(h.orderStatus) + '15' }]}>
                              <Text style={{ color: getStatusColor(h.orderStatus), fontSize: 10, fontWeight: 'bold' }}>{h.orderStatus?.toUpperCase()}</Text>
                           </View>
                        </View>
                      ))
                    ) : (
                      <Text style={{ color: theme.text, opacity: 0.5, fontSize: 12, fontStyle: 'italic' }}>No transactions recorded yet.</Text>
                    )}
                 </View>

                 <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>Notes</Text>
                 <Text style={{ color: theme.text, opacity: 0.7, marginBottom: 20 }}>{activeOrder?.notes || 'No extra notes provided.'}</Text>
                 
                 {activeOrder?.image && activeOrder.image.length > 0 && activeOrder.image[0] !== 'placeholder' && (
                    <View>
                       <Text style={[styles.sectionTitle, { color: theme.text }]}>Reference Images</Text>
                       <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {activeOrder.image.map((img: string, i: number) => (
                            <Image key={i} source={{ uri: img }} style={{ width: 150, height: 150, borderRadius: 10, marginRight: 10 }} />
                          ))}
                       </ScrollView>
                    </View>
                 )}
              </ScrollView>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { padding: 18, borderRadius: 20, marginBottom: 15, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  customerName: { fontSize: 15, fontWeight: 'bold', letterSpacing: 0.3, fontFamily: Fonts.bold },
  customerPhone: { fontSize: 10, marginTop: 2, opacity: 0.6 },
  deleteBtn: { padding: 8 },
  divider: { height: 1, width: '100%', marginBottom: 15, opacity: 0.3 },
  orderInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  itemName: { fontSize: 14, fontWeight: '600', letterSpacing: 0.2, fontFamily: Fonts.medium },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { alignItems: 'flex-start' },
  statLabel: { fontSize: 9, marginBottom: 4, fontWeight: 'bold', opacity: 0.5, letterSpacing: 0.5 },
  statVal: { fontSize: 13, fontWeight: 'bold' },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 20, fontSize: 13, opacity: 0.6 },
  emptyBtn: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 25, borderRadius: 10, borderWidth: 1 },
  
  customerInfoSection: { paddingHorizontal: 20, marginBottom: 10 },
  historyTitle: { fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5, fontFamily: Fonts.bold },
  historySub: { fontSize: 11, marginTop: 4, opacity: 0.6 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  detailContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, height: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 15, fontWeight: 'bold', fontFamily: Fonts.bold },
  detailHeader: { marginBottom: 20 },
  detName: { fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5, fontFamily: Fonts.bold },
  detSub: { fontSize: 11, marginTop: 4, opacity: 0.6 },
  detailStats: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  dStat: { flex: 1, padding: 12, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.03)' },
  dLabel: { fontSize: 8, fontWeight: 'bold', opacity: 0.4, marginBottom: 4, letterSpacing: 0.5 },
  dVal: { fontSize: 13, fontWeight: 'bold' },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 15, opacity: 0.8, letterSpacing: 0.5 },
  actionBox: { marginBottom: 25 },
  row: { flexDirection: 'row', gap: 10 },
  input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 15, fontSize: 13 },
  actionBtn: { height: 48, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  historyList: { marginBottom: 10 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  histAmt: { fontSize: 14, fontWeight: 'bold' },
  histDate: { fontSize: 10, marginTop: 2, opacity: 0.6 }
});

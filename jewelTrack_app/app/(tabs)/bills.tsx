import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useColorScheme } from 'react-native';
import api from '../../utils/api';
import { Ionicons } from '@expo/vector-icons';

export default function Bills() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
           <TouchableOpacity 
             style={[styles.payBtn, { borderColor: theme.brand }]} 
             onPress={() => Alert.alert('Payment', 'Receive payment feature coming soon!')}
           >
             <Text style={{ color: theme.brand, fontWeight: 'bold', fontSize: 12 }}>Add Pay</Text>
           </TouchableOpacity>
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
  emptyBtn: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10, borderWidth: 1 }
});

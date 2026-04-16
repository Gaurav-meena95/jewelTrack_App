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

export default function Orders() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return '#2ecc71'; // Green
      case 'progress': return '#f39c12'; // Orange
      case 'request': 
      default: return '#3498db'; // Blue
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const customer = item.customerId || { name: 'Unknown', phone: 'N/A' };
    const firstItem = item.items && item.items.length > 0 ? item.items[0] : { itemName: 'Custom Order' };
    const statusColor = getStatusColor(item.orderStatus);

    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
             <View style={[styles.iconBox, { backgroundColor: statusColor + '15' }]}>
                <Ionicons name="time" size={24} color={statusColor} />
             </View>
             <View>
                <Text style={[styles.customerName, { color: theme.text }]}>{customer.name}</Text>
                <Text style={[styles.customerPhone, { color: theme.text, opacity: 0.6 }]}>{customer.phone}</Text>
             </View>
          </View>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.orderInfo}>
          <Text style={[styles.itemName, { color: theme.text }]}>{firstItem.itemName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
              <Text style={{ color: statusColor, fontWeight: 'bold', fontSize: 12 }}>
                 {item.orderStatus ? item.orderStatus.toUpperCase() : 'REQUEST'}
              </Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
           <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: theme.text, opacity: 0.5 }]}>Total</Text>
              <Text style={[styles.statVal, { color: theme.text }]}>₹ {item.Total}</Text>
           </View>
           <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: theme.text, opacity: 0.5 }]}>Advance</Text>
              <Text style={[styles.statVal, { color: '#2ecc71' }]}>₹ {item.AdvancePayment}</Text>
           </View>
           <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: theme.text, opacity: 0.5 }]}>Remaining</Text>
              <Text style={[styles.statVal, { color: '#e74c3c' }]}>₹ {item.RemainingAmount}</Text>
           </View>
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
            onPress={() => router.push('/create-order')}
         >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addNewText}>New Order</Text>
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
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders(true)} tintColor={theme.brand} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="time-outline" size={80} color={theme.icon} style={{ opacity: 0.2 }} />
              <Text style={[styles.emptyText, { color: theme.text, opacity: 0.5 }]}>No pending orders found</Text>
              <TouchableOpacity 
                style={[styles.emptyBtn, { borderColor: theme.brand }]}
                onPress={() => router.push('/create-order')}
              >
                <Text style={{ color: theme.brand, fontWeight: 'bold' }}>Create Order</Text>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  customerName: { fontSize: 18, fontWeight: 'bold' },
  customerPhone: { fontSize: 13, marginTop: 2 },
  deleteBtn: { padding: 8 },
  divider: { height: 1, width: '100%', marginBottom: 15, opacity: 0.5 },
  orderInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  itemName: { fontSize: 18, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { alignItems: 'flex-start' },
  statLabel: { fontSize: 11, marginBottom: 4 },
  statVal: { fontSize: 15, fontWeight: 'bold' },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 20, fontSize: 16 },
  emptyBtn: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10, borderWidth: 1 }
});

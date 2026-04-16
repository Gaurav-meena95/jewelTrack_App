import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Dimensions,
  FlatList,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../../constants/theme';
import { useColorScheme } from 'react-native';
import api from '../../../../utils/api';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function DashboardComponent() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    bills: [] as any[],
    orders: [] as any[],
    collaterals: [] as any[],
    inventory: [] as any[]
  });

  const fetchData = async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    else setRefreshing(true);

    try {
      const results = await Promise.allSettled([
        api.get('/customers/bills/me'),
        api.get('/customers/orders/me'),
        api.get('/customers/collatral/me'),
        api.get('/shops/inventory/me')
      ]);

      const [billsRes, ordersRes, collateralsRes, inventoryRes] = results;

      setData({
        bills: billsRes.status === 'fulfilled' ? (billsRes.value.data?.data?.data || billsRes.value.data?.data?.bills || []) : [],
        orders: ordersRes.status === 'fulfilled' ? (ordersRes.value.data?.data?.data || ordersRes.value.data?.data?.orders || []) : [],
        collaterals: collateralsRes.status === 'fulfilled' ? (collateralsRes.value.data?.data?.data || collateralsRes.value.data?.data?.collaterals || []) : [],
        inventory: inventoryRes.status === 'fulfilled' ? (inventoryRes.value.data?.data?.allInventorys || []) : []
      });
    } catch (error) {
      console.error('Fetch Dashboard Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const metrics = useMemo(() => {
    return {
      revenue: data.bills.reduce((sum, b) => sum + (b.invoice?.grandTotal || 0), 0),
      orders: data.orders.length,
      girvi: data.collaterals.filter(c => c.status === 'active').length,
      lowStock: data.inventory.filter(i => (i.quantity || 0) <= 5).length,
      customers: [...new Set([...data.bills, ...data.orders, ...data.collaterals].map(i => i.phone))].length
    };
  }, [data]);

  const recentActivities = useMemo(() => {
    const all = [
      ...data.bills.map(b => ({ ...b, type: 'bill', date: new Date(b.createdAt) })),
      ...data.orders.map(o => ({ ...o, type: 'order', date: new Date(o.createdAt) })),
      ...data.collaterals.map(c => ({ ...c, type: 'girvi', date: new Date(c.createdAt) }))
    ];
    return all.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
  }, [data]);

  const QuickAction = ({ icon, label, route, color }: any) => (
    <TouchableOpacity 
      style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={() => router.push(route)}
    >
      <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.actionLabel, { color: theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  const StatCard = ({ label, value, icon, color }: any) => (
    <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View>
        <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: theme.text, opacity: 0.5 }]}>{label}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
       <View style={[styles.center, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.brand} />
       </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={theme.brand} />}
    >
      {/* Metrics Row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricsRow}>
         <StatCard label="Revenue" value={`₹${(metrics.revenue/1000).toFixed(1)}k`} icon="cash-outline" color="#2ecc71" />
         <StatCard label="Customers" value={metrics.customers} icon="people-outline" color="#3498db" />
         <StatCard label="Orders" value={metrics.orders} icon="time-outline" color="#f1c40f" />
         <StatCard label="Girvi" value={metrics.girvi} icon="shield-checkmark-outline" color="#e74c3c" />
         <StatCard label="Low Stock" value={metrics.lowStock} icon="warning-outline" color="#e67e22" />
      </ScrollView>

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <QuickAction icon="receipt-outline" label="New Bill" route="/create-bill" color="#2ecc71" />
        <QuickAction icon="time-outline" label="Book Order" route="/create-order" color="#f1c40f" />
        <QuickAction icon="shield-outline" label="Add Girvi" route="/create-collateral" color="#e74c3c" />
        <QuickAction icon="cube-outline" label="Inventory" route="/inventory" color="#3498db" />
      </View>

      {/* Recent Activity */}
      <View style={styles.activityHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
        <TouchableOpacity onPress={() => router.push('/reports')}>
          <Text style={{ color: theme.brand, fontWeight: 'bold' }}>See All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.activityList}>
        {recentActivities.map((item, index) => (
          <View key={index} style={[styles.activityItem, { borderBottomColor: theme.border }]}>
             <View style={[styles.activityIcon, { backgroundColor: theme.card }]}>
                <Ionicons 
                   name={item.type === 'bill' ? 'receipt' : item.type === 'order' ? 'time' : 'shield-checkmark'} 
                   size={18} 
                   color={item.type === 'bill' ? '#2ecc71' : item.type === 'order' ? '#f1c40f' : '#e74c3c'} 
                />
             </View>
             <View style={{ flex: 1 }}>
                <Text style={[styles.actTitle, { color: theme.text }]}>
                   {item.type === 'bill' ? 'Bill Generated' : item.type === 'order' ? 'Order Booked' : 'Girvi Created'}
                </Text>
                <Text style={[styles.actSub, { color: theme.text, opacity: 0.5 }]}>
                   {item.customerId?.name || 'Customer'} • {item.date.toLocaleDateString()}
                </Text>
             </View>
             <Text style={[styles.actAmount, { color: theme.text }]}>
                ₹{item.type === 'bill' ? item.invoice?.grandTotal : item.price || item.Total}
             </Text>
          </View>
        ))}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  metricsRow: { paddingHorizontal: 20, gap: 12, paddingVertical: 10 },
  statCard: { width: 140, padding: 15, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: 'bold' },
  statLabel: { fontSize: 10, fontWeight: 'bold' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 20, marginTop: 20, marginBottom: 15 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, gap: 10 },
  actionCard: { width: (width - 50) / 2, padding: 20, borderRadius: 25, borderWidth: 1, alignItems: 'center', gap: 10 },
  actionIcon: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 13, fontWeight: 'bold' },

  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 },
  activityList: { paddingHorizontal: 20, marginTop: 5 },
  activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, gap: 15 },
  activityIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actTitle: { fontSize: 14, fontWeight: 'bold' },
  actSub: { fontSize: 11, marginTop: 2 },
  actAmount: { fontSize: 14, fontWeight: 'bold' }
});

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
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { Fonts } from '../../../../constants/theme';

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
      customers: [...new Set([...data.bills, ...data.orders, ...data.collaterals].map(i => i.phone))].length,
      pendingFulfillment: data.orders.filter(o => o.orderStatus !== 'completed').length
    };
  }, [data]);

  const [profile, setProfile] = useState<any>(null);
  useEffect(() => {
    api.get('/auth/me').then(res => setProfile(res.data?.data?.user));
  }, []);

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
      showsVerticalScrollIndicator={false}
    >
      {/* GREETING HEADER */}
      <View style={styles.header}>
         <View>
            <Text style={[styles.greeting, { color: theme.text, opacity: 0.6 }]}>Welcome back,</Text>
            <Text style={[styles.userName, { color: theme.text, fontFamily: Fonts.bold }]}>{profile?.name || 'Jeweller'}</Text>
         </View>
         <TouchableOpacity style={[styles.profileBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Feather name="bell" size={20} color={theme.text} />
            <View style={styles.notifDot} />
         </TouchableOpacity>
      </View>

      {/* HERO STATS */}
      <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
         <View style={styles.heroTop}>
            <View>
               <Text style={[styles.heroLabel, { color: theme.text, opacity: 0.5 }]}>TOTAL REVENUE</Text>
               <Text style={[styles.heroValue, { color: theme.text, fontFamily: Fonts.bold }]}>₹{(metrics.revenue).toLocaleString()}</Text>
            </View>
            <View style={[styles.trendBadge, { backgroundColor: '#2ecc7120' }]}>
               <Feather name="trending-up" size={14} color="#2ecc71" />
               <Text style={styles.trendText}>+12%</Text>
            </View>
         </View>
         <View style={styles.heroFooter}>
            <View style={styles.hStat}>
               <Text style={[styles.hStatVal, { color: theme.text }]}>{metrics.customers}</Text>
               <Text style={[styles.hStatLab, { color: theme.text, opacity: 0.5 }]}>Active Clients</Text>
            </View>
            <View style={[styles.hDivider, { backgroundColor: theme.border }]} />
            <View style={styles.hStat}>
               <Text style={[styles.hStatVal, { color: theme.text }]}>{metrics.pendingFulfillment}</Text>
               <Text style={[styles.hStatLab, { color: theme.text, opacity: 0.5 }]}>Pending Orders</Text>
            </View>
         </View>
      </View>

      {/* QUICK ACTIONS */}
      <View style={styles.actionHeader}>
         <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: Fonts.bold }]}>Operational Hub</Text>
         <Feather name="grid" size={16} color={theme.brand} />
      </View>
      <View style={styles.actionsGrid}>
        <QuickAction icon="receipt-outline" label="New Bill" route="/create-bill" color="#d2a907" />
        <QuickAction icon="time-outline" label="Book Order" route="/create-order" color="#3498db" />
        <QuickAction icon="shield-outline" label="Add Girvi" route="/create-collateral" color="#e74c3c" />
        <QuickAction icon="cube-outline" label="Inventory" route="/inventory" color="#2ecc71" />
      </View>

      {/* BUSINESS INSIGHTS */}
      <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: Fonts.bold }]}>Business Insights</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricsRow}>
         <StatCard label="Live Orders" value={metrics.orders} icon="time-outline" color="#3498db" />
         <StatCard label="Girvi Items" value={metrics.girvi} icon="shield-checkmark-outline" color="#e74c3c" />
         <StatCard label="Low Stock" value={metrics.lowStock} icon="warning-outline" color="#e67e22" />
      </ScrollView>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 25, paddingTop: 60, paddingBottom: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 13, letterSpacing: 0.5 },
  userName: { fontSize: 22, marginTop: 4 },
  profileBtn: { width: 45, height: 45, borderRadius: 15, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  notifDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#e74c3c', borderWidth: 2, borderColor: '#fff' },

  heroCard: { marginHorizontal: 25, padding: 25, borderRadius: 30, borderWidth: 1, marginBottom: 30 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  heroLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5 },
  heroValue: { fontSize: 32, marginTop: 8 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  trendText: { fontSize: 11, fontWeight: 'bold', color: '#2ecc71' },
  heroFooter: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  hStat: { flex: 1 },
  hStatVal: { fontSize: 16, fontWeight: 'bold' },
  hStatLab: { fontSize: 10, marginTop: 2 },
  hDivider: { width: 1, height: 30, opacity: 0.1 },

  actionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 25 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', marginLeft: 25, marginTop: 10, marginBottom: 15, letterSpacing: 0.5 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  actionCard: { width: (width - 52) / 2, padding: 20, borderRadius: 25, borderWidth: 1, alignItems: 'center', gap: 10 },
  actionIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 13, fontWeight: 'bold', letterSpacing: 0.2 },

  metricsRow: { paddingHorizontal: 25, gap: 12, paddingVertical: 10 },
  statCard: { width: 140, padding: 15, borderRadius: 22, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: 'bold' },
  statLabel: { fontSize: 9, fontWeight: 'bold', opacity: 0.5 }
});

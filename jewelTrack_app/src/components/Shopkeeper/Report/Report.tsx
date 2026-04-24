import Pressable from '../../../../components/ui/Pressable';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  
  ActivityIndicator, 
  RefreshControl,
  Alert,
  Dimensions,
  Share,
  Platform
} from 'react-native';
import { Colors } from '../../../../constants/theme';
import { useColorScheme } from 'react-native';
import api from '../../../../utils/api';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { documentDirectory, writeAsStringAsync } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

export default function ReportComponent() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('30days');
  const [rawData, setRawData] = useState({
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

      setRawData({
        bills: billsRes.status === 'fulfilled' ? (billsRes.value.data?.data?.data || billsRes.value.data?.data?.bills || []) : [],
        orders: ordersRes.status === 'fulfilled' ? (ordersRes.value.data?.data?.data || ordersRes.value.data?.data?.orders || []) : [],
        collaterals: collateralsRes.status === 'fulfilled' ? (collateralsRes.value.data?.data?.data || collateralsRes.value.data?.data?.collaterals || []) : [],
        inventory: inventoryRes.status === 'fulfilled' ? (inventoryRes.value.data?.data?.allInventorys || []) : []
      });
    } catch (error) {
      console.error('Fetch Report Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredMetrics = useMemo(() => {
    const now = new Date();
    let startDate = new Date(0);
    if (dateRange === 'today') startDate = new Date(now.setHours(0,0,0,0));
    else if (dateRange === '7days') startDate = new Date(now.setDate(now.getDate() - 7));
    else if (dateRange === '30days') startDate = new Date(now.setDate(now.getDate() - 30));

    const filterByDate = (arr: any[]) => arr.filter(i => new Date(i.createdAt) >= startDate);

    const bills = filterByDate(rawData.bills);
    const orders = filterByDate(rawData.orders);
    const collaterals = filterByDate(rawData.collaterals);

    return {
      revenue: bills.reduce((sum, b) => sum + (b.invoice?.grandTotal || 0), 0),
      ordersPlaced: orders.length,
      advanceCollected: orders.reduce((sum, o) => sum + (o.AdvancePayment || 0), 0),
      activeGirvi: collaterals.filter(c => c.status === 'active').length,
      loanValue: collaterals.filter(c => c.status === 'active').reduce((sum, c) => sum + (c.price || 0), 0)
    };
  }, [rawData, dateRange]);

  const exportCSV = async () => {
    const csvContent = 
      "Metric,Value\n" +
      `Total Revenue,${filteredMetrics.revenue}\n` +
      `Orders Booked,${filteredMetrics.ordersPlaced}\n` +
      `Advance Collected,${filteredMetrics.advanceCollected}\n` +
      `Active Girvi Records,${filteredMetrics.activeGirvi}\n` +
      `Principal Outstanding,${filteredMetrics.loanValue}`;

    if (!documentDirectory) {
      Alert.alert('Error', 'Storage not accessible');
      return;
    }
    const filePath = `${documentDirectory}JewelTrack_Report_${dateRange}.csv`;
    try {
      if (!(await Sharing.isAvailableAsync())) {
        return Alert.alert('Error', 'Sharing is not available on this device');
      }
      await writeAsStringAsync(filePath, csvContent);
      await Sharing.shareAsync(filePath);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate report file');
    }
  };

  const ReportCard = ({ title, value, subValue, icon, color, isMini }: any) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, !isMini && { flexDirection: 'row', gap: 20 }]}>
       <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={isMini ? 24 : 28} color={color} />
       </View>
       <View style={{ flex: 1, alignItems: isMini ? 'center' : 'flex-start' }}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{title.toUpperCase()}</Text>
          <Text style={[styles.cardVal, { color: theme.text, fontSize: isMini ? 18 : 22 }]}>{value}</Text>
          {subValue && <Text style={[styles.cardSub, { color: color }]}>{subValue}</Text>}
       </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {['today', '7days', '30days', 'all'].map(r => (
            <Pressable 
              key={r} 
              onPress={() => setDateRange(r)}
              style={[
                styles.filterBtn, 
                { borderColor: theme.border },
                dateRange === r && { backgroundColor: theme.brand, borderColor: theme.brand }
              ]}
            >
              <Text style={{ color: dateRange === r ? '#000' : theme.text, fontSize: 11, fontWeight: 'bold' }}>
                {r.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable style={[styles.shareBtn, { backgroundColor: theme.brand }]} onPress={exportCSV}>
           <Ionicons name="share-social-outline" size={20} color="#000" />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.brand} />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.reportList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={theme.brand} />}
        >
            <View style={[styles.heroCard, { backgroundColor: theme.brand }]}>
               <Text style={styles.heroLabel}>GROSS REVENUE</Text>
               <Text style={styles.heroVal}>₹ {filteredMetrics.revenue.toLocaleString()}</Text>
               <View style={styles.heroFooter}>
                  <View style={styles.trendBox}>
                     <Ionicons name="trending-up" size={14} color="#000" />
                     <Text style={styles.trendText}>+12.5%</Text>
                  </View>
                  <Text style={styles.heroSub}>vs previous period</Text>
               </View>
            </View>

            <View style={styles.metricsGrid}>
               <View style={{ flex: 1, gap: 15 }}>
                  <ReportCard title="Orders" value={filteredMetrics.ordersPlaced} subValue="New Bookings" icon="cart" color="#f1c40f" isMini />
                  <ReportCard title="Advance" value={`₹${filteredMetrics.advanceCollected}`} subValue="Cash Flow" icon="wallet" color="#2ecc71" isMini />
               </View>
               <View style={{ flex: 1, gap: 15 }}>
                  <ReportCard title="Active Girvi" value={filteredMetrics.activeGirvi} subValue="Security" icon="shield" color="#e74c3c" isMini />
                  <ReportCard title="Portfolio" value={`₹${(filteredMetrics.loanValue/1000).toFixed(1)}k`} subValue="Assets" icon="briefcase" color="#3498db" isMini />
               </View>
            </View>

            <ReportCard title="Inventory Health" value={`${rawData.inventory.length} Items`} subValue={`${rawData.inventory.filter(i => (i.quantity||0)<=5).length} Critical Alerts`} icon="cube" color={theme.brand} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  controls: { flexDirection: 'row', padding: 20, gap: 15, alignItems: 'center' },
  filterBtn: { paddingHorizontal: 15, height: 35, borderRadius: 10, borderWidth: 1, justifyContent: 'center' },
  shareBtn: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  reportList: { paddingHorizontal: 20, gap: 15, paddingBottom: 100 },
  heroCard: { padding: 25, borderRadius: 30, marginBottom: 10, elevation: 8, shadowColor: '#d2a907', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  heroLabel: { fontSize: 9, fontWeight: 'bold', color: '#000', opacity: 0.6, letterSpacing: 1.5 },
  heroVal: { fontSize: 32, fontWeight: 'bold', color: '#000', marginTop: 8 },
  heroFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  trendBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, gap: 3 },
  trendText: { fontSize: 9, fontWeight: 'bold', color: '#000' },
  heroSub: { fontSize: 10, color: '#000', opacity: 0.5 },

  metricsGrid: { flexDirection: 'row', gap: 12 },
  card: { padding: 18, borderRadius: 25, borderWidth: 1, alignItems: 'center', gap: 12 },
  iconBox: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 8, fontWeight: 'bold', opacity: 0.5, letterSpacing: 1 },
  cardVal: { fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  cardSub: { fontSize: 9, fontWeight: 'bold', marginTop: 2 }
});

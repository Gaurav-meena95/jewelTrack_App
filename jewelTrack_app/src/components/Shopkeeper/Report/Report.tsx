import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
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

  const ReportCard = ({ title, value, subValue, icon, color }: any) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
       <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={28} color={color} />
       </View>
       <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{title.toUpperCase()}</Text>
          <Text style={[styles.cardVal, { color: theme.text }]}>{value}</Text>
          {subValue && <Text style={[styles.cardSub, { color: color }]}>{subValue}</Text>}
       </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {['today', '7days', '30days', 'all'].map(r => (
            <TouchableOpacity 
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
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={[styles.shareBtn, { backgroundColor: theme.brand }]} onPress={exportCSV}>
           <Ionicons name="share-social-outline" size={20} color="#000" />
        </TouchableOpacity>
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
           <ReportCard title="Sales Revenue" value={`₹ ${filteredMetrics.revenue.toLocaleString()}`} subValue="Gross Earnings" icon="cash-outline" color="#2ecc71" />
           <ReportCard title="Customer Orders" value={filteredMetrics.ordersPlaced} subValue={`₹${filteredMetrics.advanceCollected} Advance Collected`} icon="time-outline" color="#f1c40f" />
           <ReportCard title="Girvi Exposure" value={filteredMetrics.activeGirvi} subValue={`₹${filteredMetrics.loanValue.toLocaleString()} Principal Out`} icon="shield-checkmark-outline" color="#e74c3c" />
           <ReportCard title="Inventory SKU" value={rawData.inventory.length} subValue={`${rawData.inventory.filter(i => (i.quantity||0)<=5).length} Low Stock Alerts`} icon="cube-outline" color="#3498db" />
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
  card: { flexDirection: 'row', padding: 20, borderRadius: 25, borderWidth: 1, alignItems: 'center', gap: 20 },
  iconBox: { width: 60, height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 10, fontWeight: 'bold', opacity: 0.5, letterSpacing: 1 },
  cardVal: { fontSize: 22, fontWeight: 'bold', marginTop: 4 },
  cardSub: { fontSize: 11, fontWeight: 'bold', marginTop: 4 }
});

import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, useColorScheme, ActivityIndicator, 
  Dimensions, Platform, Alert 
} from 'react-native';
import { Colors, Fonts } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get('window');


export default function Reports() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30days'); // today, 7days, 30days, all
  
  const [rawData, setRawData] = useState({
    bills: [],
    orders: [],
    collaterals: [],
    inventory: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [billsRes, ordersRes, collatRes, invRes] = await Promise.all([
        api.get('/customers/bills/me'),
        api.get('/customers/orders/me'),
        api.get('/customers/collatral/me'),
        api.get('/shops/inventory/me')
      ]);

      setRawData({
        bills: billsRes.data?.data?.data || billsRes.data?.data?.bills || [],
        orders: ordersRes.data?.data?.data || ordersRes.data?.data?.orders || [],
        collaterals: collatRes.data?.data?.data || collatRes.data?.data?.collaterals || [],
        inventory: invRes.data?.data?.allInventorys || []
      });
    } catch (e) {
      console.log('Report Fetch Error:', e);
      Alert.alert('Data Error', 'Failed to fetch business intelligence data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate = new Date(0);
    
    if (dateRange === 'today') startDate = new Date(now.setHours(0, 0, 0, 0));
    else if (dateRange === '7days') startDate = new Date(now.setDate(now.getDate() - 7));
    else if (dateRange === '30days') startDate = new Date(now.setDate(now.getDate() - 30));

    const filterByDate = (arr: any[]) => arr.filter(item => {
      if (!item.createdAt) return true;
      return new Date(item.createdAt) >= startDate;
    });

    return {
      bills: filterByDate(rawData.bills),
      orders: filterByDate(rawData.orders),
      collaterals: filterByDate(rawData.collaterals),
      inventory: rawData.inventory
    };
  }, [rawData, dateRange]);

  const metrics = useMemo(() => {
    const { bills, orders, collaterals, inventory } = filteredData;
    return {
      totalRevenue: bills.reduce((sum: number, b: any) => sum + (b.invoice?.grandTotal || 0), 0),
      avgBill: bills.length > 0 ? (bills.reduce((sum: number, b: any) => sum + (b.invoice?.grandTotal || 0), 0) / bills.length) : 0,
      pendingOrders: orders.filter((o: any) => o.orderStatus !== 'completed' && o.orderStatus !== 'Delivered').length,
      advanceCollected: orders.reduce((sum: number, o: any) => sum + (o.AdvancePayment || 0), 0),
      activeLoanValue: collaterals.filter((c: any) => c.status === 'active').reduce((sum: number, c: any) => sum + (c.price || 0), 0),
      inventoryValuation: inventory.reduce((sum: number, i: any) => sum + (i.price || 0), 0),
      lowStock: inventory.filter((i: any) => (i.quantity || 0) <= 5).length
    };
  }, [filteredData]);
 
  const recentActivities = useMemo(() => {
    const all = [
      ...filteredData.bills.map(b => ({ ...b, type: 'bill', date: new Date(b.createdAt) })),
      ...filteredData.orders.map(o => ({ ...o, type: 'order', date: new Date(o.createdAt) })),
      ...filteredData.collaterals.map(c => ({ ...c, type: 'girvi', date: new Date(c.createdAt) }))
    ];
    return all.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filteredData]);

  const exportCSV = async () => {
    const rows = [
      ["JewelTrack Business Report"],
      ["Generated", new Date().toLocaleString()],
      ["Period", dateRange],
      [],
      ["Sales Metrics"],
      ["Revenue", metrics.totalRevenue],
      ["Bills Count", filteredData.bills.length],
      ["Avg Value", metrics.avgBill.toFixed(2)],
      [],
      ["Loan Ledger (Girvi)"],
      ["Outstanding principal", metrics.activeLoanValue],
      ["Active exposures", filteredData.collaterals.filter((c:any)=>c.status === 'active').length],
      [],
      ["Inventory Analytics"],
      ["Total SKUs", filteredData.inventory.length],
      ["Critical Alerts", metrics.lowStock],
      ["Asset Valuation", metrics.inventoryValuation]
    ];

    const csvString = rows.map(e => e.join(",")).join("\n");
    const filePath = `${FileSystem.documentDirectory}JewelTrack_Report_${dateRange}.csv`;
    
    try {
      await FileSystem.writeAsStringAsync(filePath, csvString, { encoding: 'utf8' });
      await Sharing.shareAsync(filePath, { mimeType: 'text/csv', dialogTitle: 'Export Ledger Report' });
    } catch (err) {
      console.log('Export Error:', err);
      Alert.alert('Export Error', 'Failed to generate CSV file');
    }
  };

  const ReportCard = ({ title, value, icon, color, subValue, subLabel }: any) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 }}>
        <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={[styles.cardTitle, { color: theme.text, fontFamily: Fonts.bold }]}>{title}</Text>
      </View>
      <Text style={[styles.cardValue, { color: theme.text, fontFamily: Fonts.bold }]}>{value}</Text>
      {subLabel && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 10 }}>
          <Text style={{ fontSize: 11, color: theme.text, opacity: 0.5 }}>{subLabel}</Text>
          <Text style={{ fontSize: 11, color: color, fontWeight: 'bold' }}>{subValue}</Text>
        </View>
      )}
    </View>
  );

  if (loading) return <View style={[styles.center, { backgroundColor: theme.background }]}><ActivityIndicator color={theme.brand} size="large" /></View>;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingBottom: 100 }}>
      
      {/* FILTER BUTTONS */}
      <View style={styles.filterRow}>
        {['today', '7days', '30days', 'all'].map(range => (
          <TouchableOpacity key={range} onPress={() => setDateRange(range)} style={[styles.filterBtn, dateRange === range && { backgroundColor: theme.brand, borderColor: theme.brand }]}>
            <Text style={[styles.filterBtnText, { color: dateRange === range ? '#000' : theme.text, opacity: dateRange === range ? 1 : 0.5 }]}>
              {range.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={exportCSV} style={styles.exportBtn}>
           <Ionicons name="download-outline" size={20} color={theme.brand} />
        </TouchableOpacity>
      </View>

      {/* METRICS GRID */}
      <View style={styles.grid}>
        <ReportCard 
          title="Gross Sales" 
          value={`₹${metrics.totalRevenue.toLocaleString()}`} 
          icon="cash-outline" color="#d2a907"
          subLabel="Avg Order Value" subValue={`₹${metrics.avgBill.toFixed(0)}`}
        />
        <ReportCard 
          title="Loan Ledger" 
          value={`₹${metrics.activeLoanValue.toLocaleString()}`} 
          icon="wallet-outline" color="#e74c3c"
          subLabel="Active Girvi" subValue={filteredData.collaterals.filter((c:any)=>c.status === 'active').length}
        />
        <ReportCard 
          title="Fulfillment" 
          value={metrics.pendingOrders} 
          icon="time-outline" color="#2ecc71"
          subLabel="Advance Paid" subValue={`₹${metrics.advanceCollected.toLocaleString()}`}
        />
        <ReportCard 
          title="Inventory" 
          value={`₹${metrics.inventoryValuation.toLocaleString()}`} 
          icon="cube-outline" color="#3498db"
          subLabel="Stock Alerts" subValue={metrics.lowStock}
        />
      </View>

      {/* RECENT ACTIVITY LOG */}
      <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: Fonts.bold, marginTop: 40 }]}>Recent Transactions</Text>
      <View style={styles.activityList}>
        {recentActivities.map((item, index) => (
          <View key={index} style={[styles.activityItem, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
             <View style={[styles.activityIcon, { backgroundColor: theme.background }]}>
                <Ionicons 
                   name={item.type === 'bill' ? 'receipt' : item.type === 'order' ? 'time' : 'shield-checkmark'} 
                   size={18} 
                   color={item.type === 'bill' ? '#2ecc71' : item.type === 'order' ? '#3498db' : '#e74c3c'} 
                />
             </View>
             <View style={{ flex: 1 }}>
                <Text style={[styles.actTitle, { color: theme.text, fontFamily: Fonts.bold }]}>
                   {item.type === 'bill' ? 'Invoice Generated' : item.type === 'order' ? 'Custom Order Booked' : 'Girvi Asset Locked'}
                </Text>
                <Text style={[styles.actSub, { color: theme.text, opacity: 0.5 }]}>
                   {item.customerId?.name || 'Walk-in Client'} • {item.date.toLocaleDateString()}
                </Text>
             </View>
             <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.actAmount, { color: theme.text, fontFamily: Fonts.bold }]}>
                   ₹{(item.type === 'bill' ? (item.invoice?.grandTotal ?? 0) : (item.price ?? item.Total ?? 0)).toLocaleString()}
                </Text>
                <Text style={[styles.actStatus, { color: item.status === 'completed' ? '#2ecc71' : theme.brand }]}>{item.status || 'Success'}</Text>
             </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={[styles.mainExportBtn, { backgroundColor: theme.brand }]} onPress={exportCSV}>
        <Ionicons name="share-outline" size={20} color="#000" />
        <Text style={styles.mainExportText}>Share Full Intelligence Report</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterRow: { flexDirection: 'row', gap: 10, marginVertical: 20, alignItems: 'center' },
  filterBtn: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#ccc' },
  filterBtnText: { fontSize: 10, fontWeight: 'bold' },
  exportBtn: { marginLeft: 'auto', width: 45, height: 45, borderRadius: 12, backgroundColor: '#d2a90715', justifyContent: 'center', alignItems: 'center' },
  grid: { gap: 15 },
  card: { padding: 20, borderRadius: 25 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 15 },
  cardValue: { fontSize: 28 },
  cardValue: { fontSize: 28 },
  mainExportBtn: { flexDirection: 'row', height: 65, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 40, elevation: 4 },
  mainExportText: { fontSize: 16, fontWeight: 'bold' },

  sectionTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 15, letterSpacing: 0.5 },
  activityList: { gap: 10 },
  activityItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 20, borderWidth: 1, gap: 12, borderColor: 'transparent' },
  activityIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actTitle: { fontSize: 13, letterSpacing: 0.2 },
  actSub: { fontSize: 10, marginTop: 2, opacity: 0.6 },
  actAmount: { fontSize: 14 },
  actStatus: { fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', marginTop: 2 }
});

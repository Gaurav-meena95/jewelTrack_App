// Is code ko app/(tabs)/index.tsx mein update karo (replace whole file)
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, Alert } from 'react-native';
import { Colors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../../utils/api';

export default function Dashboard() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [user, setUser] = useState<any>(null);
  
  const [totalReceivables, setTotalReceivables] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) setUser(JSON.parse(userData));
    };
    loadUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const fetchStats = async () => {
        try {
          const [billsRes, ordersRes] = await Promise.all([
            api.get('/customers/bills/me'),
            api.get('/customers/orders/me')
          ]);

          if (billsRes.data.success) {
            const bills = billsRes.data.data.data || [];
            const receivables = bills.reduce((sum: number, bill: any) => {
               // sum up the remainingAmount from partially paid and unpaid bills
               const rem = (bill.payment && bill.payment.remainingAmount) ? bill.payment.remainingAmount : 0;
               return sum + rem;
            }, 0);
            setTotalReceivables(receivables);
          }

          if (ordersRes.data.success) {
            const orders = ordersRes.data.data.data || [];
            const pending = orders.filter((o: any) => o.orderStatus !== 'complete');
            setPendingOrders(pending.length);
          }
        } catch (e) {
          console.log('Failed to fetch dashboard stats', e);
        }
      };
      
      fetchStats();
    }, [])
  );

  const QuickAction = ({ icon, label, color, onPress }: any) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={[styles.actionLabel, { color: theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.text }]}>Namaste, 🙏</Text>
          <Text style={[styles.shopName, { color: theme.brand }]}>{user?.shopName || 'JewelTrack'}</Text>
        </View>
        <TouchableOpacity style={[styles.profileBtn, { backgroundColor: theme.card }]}>
          <Ionicons name="person" size={24} color={theme.brand} />
        </TouchableOpacity>
      </View>

      {/* Quick Actions Grid */}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <QuickAction 
            icon="person-add" 
            label="Customer" 
            color="#3498db" 
            onPress={() => router.push('/add-customer')} 
          />
          <QuickAction 
            icon="receipt" 
            label="New Bill" 
            color="#eab71e" 
            onPress={() => router.push('/create-bill')} 
          />
          <QuickAction 
            icon="time" 
            label="New Order" 
            color="#2ecc71" 
            onPress={() => router.push('/create-order')} 
          />
          <QuickAction 
            icon="cube" 
            label="Inventory" 
            color="#9b59b6" 
            onPress={() => router.push('/(tabs)/inventory')} 
          />
          <QuickAction 
            icon="shield-checkmark" 
            label="Collateral" 
            color="#e74c3c" 
            onPress={() => router.push('/(tabs)/collateral')} 
          />
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.statValue, { color: theme.text }]}>₹ {totalReceivables.toLocaleString('en-IN')}</Text>
          <Text style={[styles.statLabel, { color: theme.text }]}>Total Receivables</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.statValue, { color: theme.text }]}>{pendingOrders}</Text>
          <Text style={[styles.statLabel, { color: theme.text }]}>Pending Orders</Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  greeting: { fontSize: 14, opacity: 0.6 },
  shopName: { fontSize: 22, fontWeight: 'bold' },
  profileBtn: { padding: 12, borderRadius: 15 },
  card: { padding: 20, borderRadius: 20, marginBottom: 20, elevation: 4,shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
  actionGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  actionItem: { alignItems: 'center', flex: 1 },
  actionIcon: { padding: 15, borderRadius: 15, marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 15 },
  statCard: { flex: 1, padding: 20, borderRadius: 20, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  statLabel: { fontSize: 11, opacity: 0.5 }
});

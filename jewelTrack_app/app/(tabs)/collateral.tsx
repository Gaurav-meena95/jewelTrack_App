import React, { useState, useEffect, useCallback } from 'react';
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function Collateral() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCollaterals = async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await api.get('/customers/collatral/me');
      if (response.data.success) {
        setItems(response.data.data.data || []);
      }
    } catch (error: any) {
      console.error('Fetch Collaterals Error:', error.message);
      Alert.alert('Error', 'Failed to load collateral records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCollaterals();
  }, []);

  const handleDelete = (item: any) => {
    Alert.alert(
      'Close Girvi',
      'Are you sure you want to delete this collateral record permanently?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
             try {
               await api.delete(`/customers/collatral/delete?collatral_id=${item._id}`);
               fetchCollaterals();
             } catch(err) {
               Alert.alert('Error', 'Failed to delete record');
             }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const customer = item.customerId || { name: 'Unknown', phone: 'N/A' };
    
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
             <View style={[styles.iconBox, { backgroundColor: '#e74c3c15' }]}>
                <Ionicons name="shield-checkmark" size={24} color="#e74c3c" />
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

        <Text style={[styles.itemName, { color: theme.text }]}>{item.jewellery}</Text>
        
        <View style={styles.statsRow}>
           <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: theme.text, opacity: 0.5 }]}>Amount</Text>
              <Text style={[styles.statVal, { color: theme.brand }]}>₹ {item.price}</Text>
           </View>
           <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: theme.text, opacity: 0.5 }]}>Interest</Text>
              <Text style={[styles.statVal, { color: theme.text }]}>{item.interestRate}%</Text>
           </View>
           <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: theme.text, opacity: 0.5 }]}>Weight</Text>
              <Text style={[styles.statVal, { color: theme.text }]}>{item.weight}g</Text>
           </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#2ecc7115' : '#e74c3c15' }]}>
            <Text style={{ color: item.status === 'active' ? '#2ecc71' : '#e74c3c', fontWeight: 'bold', fontSize: 12 }}>
               {item.status.toUpperCase()}
            </Text>
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
            onPress={() => router.push('/create-collateral')}
         >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addNewText}>New Girvi Record</Text>
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
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchCollaterals(true)} tintColor={theme.brand} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="shield-half-outline" size={80} color={theme.icon} style={{ opacity: 0.2 }} />
              <Text style={[styles.emptyText, { color: theme.text, opacity: 0.5 }]}>No collateral records found</Text>
              <TouchableOpacity 
                style={[styles.emptyBtn, { borderColor: theme.brand }]}
                onPress={() => router.push('/create-collateral')}
              >
                <Text style={{ color: theme.brand, fontWeight: 'bold' }}>Create First Record</Text>
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
  itemName: { fontSize: 16, fontWeight: '600', marginBottom: 15 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statBox: { alignItems: 'flex-start' },
  statLabel: { fontSize: 11, marginBottom: 4 },
  statVal: { fontSize: 15, fontWeight: 'bold' },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'flex-start' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 20, fontSize: 16 },
  emptyBtn: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10, borderWidth: 1 }
});

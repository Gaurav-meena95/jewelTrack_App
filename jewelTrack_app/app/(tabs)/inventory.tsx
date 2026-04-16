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

export default function Inventory() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInventory = async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await api.get('/inventory/me');
      if (response.data.success) {
        setItems(response.data.data);
      }
    } catch (error: any) {
      console.error('Fetch Inventory Error:', error.message);
      Alert.alert('Error', 'Failed to load inventory stock');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleDelete = (itemId: string) => {
    Alert.alert(
      'Delete Stock',
      'Are you sure you want to remove this item from inventory?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
             try {
               await api.delete(`/inventory/delete?inventoryId=${itemId}`);
               fetchInventory();
             } catch(err) {
               Alert.alert('Error', 'Failed to delete item');
             }
          }
        }
      ]
    );
  };

  const getMetalIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'gold': return { name: 'gold', color: '#d2a907' };
      case 'silver': return { name: 'silver-ware', color: '#95a5a6' };
      case 'diamond': return { name: 'diamond-stone', color: '#3498db' };
      default: return { name: 'set-top-box', color: '#9b59b6' };
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const icon = getMetalIcon(item.metalType);
    return (
      <View style={[styles.stockCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.iconBox, { backgroundColor: icon.color + '15' }]}>
          <MaterialCommunityIcons name={icon.name as any} size={28} color={icon.color} />
        </View>
        
        <View style={styles.info}>
          <Text style={[styles.itemType, { color: theme.text }]}>{item.jewelleryType}</Text>
          <Text style={[styles.metalText, { color: icon.color, fontWeight: 'bold' }]}>
            {item.metalType.toUpperCase()}
          </Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: theme.background }]}>
              <Text style={[styles.badgeText, { color: theme.text }]}>{item.totalWeight} g</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: theme.background }]}>
              <Text style={[styles.badgeText, { color: theme.text }]}>Qty: {item.quantity}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
          <Ionicons name="trash-outline" size={20} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Stats Summary */}
      <View style={styles.summaryContainer}>
         <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.summaryVal, { color: theme.text }]}>{items.length}</Text>
            <Text style={[styles.summaryLabel, { color: theme.text, opacity: 0.5 }]}>Total Items</Text>
         </View>
         <TouchableOpacity 
            style={[styles.addNewBtn, { backgroundColor: theme.brand }]}
            onPress={() => router.push('/add-inventory')}
         >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addNewText}>Add Stock</Text>
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
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchInventory(true)} tintColor={theme.brand} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="package-variant" size={80} color={theme.icon} style={{ opacity: 0.2 }} />
              <Text style={[styles.emptyText, { color: theme.text, opacity: 0.5 }]}>Your inventory is empty</Text>
              <TouchableOpacity 
                style={[styles.emptyBtn, { borderColor: theme.brand }]}
                onPress={() => router.push('/add-inventory')}
              >
                <Text style={{ color: theme.brand, fontWeight: 'bold' }}>Add First Item</Text>
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
  summaryContainer: { flexDirection: 'row', padding: 20, gap: 15, alignItems: 'center' },
  summaryCard: { flex: 1, padding: 15, borderRadius: 20, alignItems: 'center' },
  summaryVal: { fontSize: 24, fontWeight: 'bold' },
  summaryLabel: { fontSize: 12 },
  addNewBtn: { flex: 1.5, height: 60, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, elevation: 4 },
  addNewText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  stockCard: { flexDirection: 'row', padding: 15, borderRadius: 20, marginBottom: 15, alignItems: 'center', borderWidth: 1 },
  iconBox: { width: 60, height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  info: { flex: 1 },
  itemType: { fontSize: 18, fontWeight: 'bold' },
  metalText: { fontSize: 12, marginTop: 2, letterSpacing: 1 },
  badgeRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  deleteBtn: { padding: 10 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 20, fontSize: 16 },
  emptyBtn: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10, borderWidth: 1 }
});

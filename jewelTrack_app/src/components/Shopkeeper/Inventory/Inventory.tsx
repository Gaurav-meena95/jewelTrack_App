import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Alert,
  TextInput,
  ScrollView,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../../constants/theme';
import { useColorScheme } from 'react-native';
import api from '../../../../utils/api';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const METAL_OPTIONS = ['all', 'gold', 'silver', 'diamond', 'platinum', 'other'];

export default function InventoryComponent() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [metalFilter, setMetalFilter] = useState('all');

  const fetchInventory = async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await api.get('/shops/inventory/me');
      if (response.data.success) {
        setItems(response.data.data.allInventorys || []);
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

  const filteredItems = useMemo(() => {
    let list = items.filter(i => (i.jewelleryType || '').toLowerCase().includes(searchQuery.toLowerCase()));
    if (metalFilter !== 'all') {
      list = list.filter(i => i.metalType.toLowerCase() === metalFilter.toLowerCase());
    }
    return list;
  }, [items, searchQuery, metalFilter]);

  const metrics = useMemo(() => {
    return {
      totalItems: items.length,
      totalQty: items.reduce((sum, i) => sum + (i.quantity || 0), 0),
      lowStock: items.filter(i => (i.quantity || 0) <= 5).length
    };
  }, [items]);

  const handleDelete = (itemId: string) => {
    Alert.alert(
      'Delete Stock',
      'Remove this item permanently?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
             try {
               await api.delete(`/shops/inventory/delete?inventory_id=${itemId}`);
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
      default: return { name: 'package-variant', color: '#7f8c8d' };
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const icon = getMetalIcon(item.metalType);
    const isLowStock = (item.quantity || 0) <= 5;

    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: isLowStock ? '#e74c3c' : theme.border }]}>
        <View style={[styles.iconBox, { backgroundColor: icon.color + '15' }]}>
          <MaterialCommunityIcons name={icon.name as any} size={28} color={icon.color} />
        </View>
        
        <View style={styles.info}>
          <View style={styles.titleRow}>
             <Text style={[styles.itemType, { color: theme.text }]}>{item.jewelleryType}</Text>
             {isLowStock && (
                <View style={styles.lowStockBadge}>
                   <Ionicons name="warning" size={10} color="#fff" />
                   <Text style={styles.lowStockText}>LOW STOCK</Text>
                </View>
             )}
          </View>
          <Text style={[styles.metalText, { color: icon.color, fontWeight: 'bold' }]}>
            {item.metalType.toUpperCase()}
          </Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: theme.background }]}>
              <Text style={[styles.badgeText, { color: theme.text }]}>{item.totalWeight} g</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: isLowStock ? '#e74c3c20' : theme.background }]}>
              <Text style={[styles.badgeText, { color: isLowStock ? '#e74c3c' : theme.text }]}>Qty: {item.quantity}</Text>
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
    <View style={styles.container}>
      
      {/* Metrics Highlights */}
      <View style={styles.metricsBar}>
        <View style={[styles.metItem, { borderRightWidth: 1, borderRightColor: theme.border }]}>
           <Text style={[styles.metVal, { color: theme.brand }]}>{metrics.totalItems}</Text>
           <Text style={styles.metLabel}>SKUs</Text>
        </View>
        <View style={[styles.metItem, { borderRightWidth: 1, borderRightColor: theme.border }]}>
           <Text style={[styles.metVal, { color: theme.brand }]}>{metrics.totalQty}</Text>
           <Text style={styles.metLabel}>Total Qty</Text>
        </View>
        <View style={styles.metItem}>
           <Text style={[styles.metVal, { color: '#e74c3c' }]}>{metrics.lowStock}</Text>
           <Text style={styles.metLabel}>Critical</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={theme.icon} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
          placeholder="Search items..." placeholderTextColor="#999"
          value={searchQuery} onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={[styles.addIconBtn, { backgroundColor: theme.brand }]} onPress={() => router.push('/add-inventory')}>
           <Ionicons name="add" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
        {METAL_OPTIONS.map(m => (
          <TouchableOpacity 
            key={m} 
            onPress={() => setMetalFilter(m)}
            style={[
              styles.filterTab, 
              { borderColor: theme.border },
              metalFilter === m && { backgroundColor: theme.brand, borderColor: theme.brand }
            ]}
          >
            <Text style={[styles.filterText, { color: metalFilter === m ? '#000' : theme.text }]}>{m.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.brand} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchInventory(true)} tintColor={theme.brand} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  metricsBar: { flexDirection: 'row', margin: 20, padding: 20, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.03)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  metItem: { flex: 1, alignItems: 'center' },
  metVal: { fontSize: 18, fontWeight: 'bold' },
  metLabel: { fontSize: 10, opacity: 0.5, marginTop: 4, fontWeight: 'bold' },

  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 10, marginBottom: 15 },
  searchIcon: { position: 'absolute', left: 35, zIndex: 1, opacity: 0.5 },
  searchInput: { flex: 1, height: 50, borderRadius: 12, paddingLeft: 45, borderWidth: 1 },
  addIconBtn: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  filterScroll: { maxHeight: 45 },
  filterTab: { height: 35, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1, justifyContent: 'center' },
  filterText: { fontSize: 10, fontWeight: 'bold' },

  card: { flexDirection: 'row', padding: 15, borderRadius: 20, marginBottom: 15, alignItems: 'center', borderWidth: 1 },
  iconBox: { width: 55, height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  info: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemType: { fontSize: 16, fontWeight: 'bold' },
  lowStockBadge: { backgroundColor: '#e74c3c', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 3 },
  lowStockText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  metalText: { fontSize: 11, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  deleteBtn: { padding: 10 }
});

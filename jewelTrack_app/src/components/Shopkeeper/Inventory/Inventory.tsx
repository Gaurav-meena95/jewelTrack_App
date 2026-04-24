import Pressable from '../../../../components/ui/Pressable';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  
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

        <Pressable style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
          <Ionicons name="trash-outline" size={20} color="#e74c3c" />
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      
      {/* Metrics Highlights */}
      {/* Header Summary */}
      <View style={styles.statsHeader}>
        <View style={[styles.miniStat, { backgroundColor: theme.card, borderColor: theme.border }]}>
           <Text style={[styles.miniLabel, { color: theme.text }]}>TOTAL SKU</Text>
           <Text style={[styles.miniVal, { color: theme.text }]}>{metrics.totalItems}</Text>
        </View>
        <View style={[styles.miniStat, { backgroundColor: theme.card, borderColor: theme.border }]}>
           <Text style={[styles.miniLabel, { color: theme.text }]}>STOCK QTY</Text>
           <Text style={[styles.miniVal, { color: theme.brand }]}>{metrics.totalQty}</Text>
        </View>
        <View style={[styles.miniStat, { backgroundColor: theme.card, borderColor: theme.border }]}>
           <Text style={[styles.miniLabel, { color: theme.text }]}>CRITICAL</Text>
           <Text style={[styles.miniVal, { color: '#e74c3c' }]}>{metrics.lowStock}</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={theme.icon} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
          placeholder="Search items..." placeholderTextColor="#999"
          value={searchQuery} onChangeText={setSearchQuery}
        />
        <Pressable style={[styles.addIconBtn, { backgroundColor: theme.brand }]} onPress={() => router.push('/add-inventory')}>
           <Ionicons name="add" size={24} color="#000" />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
        {METAL_OPTIONS.map(m => (
          <Pressable 
            key={m} 
            onPress={() => setMetalFilter(m)}
            style={[
              styles.filterTab, 
              { borderColor: theme.border },
              metalFilter === m && { backgroundColor: theme.brand, borderColor: theme.brand }
            ]}
          >
            <Text style={[styles.filterText, { color: metalFilter === m ? '#000' : theme.text }]}>{m.toUpperCase()}</Text>
          </Pressable>
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
  
  statsHeader: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginTop: 20 },
  miniStat: { flex: 1, padding: 12, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  miniLabel: { fontSize: 9, fontWeight: 'bold', opacity: 0.5, marginBottom: 5 },
  miniVal: { fontSize: 16, fontWeight: 'bold' },

  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 10, marginBottom: 15, marginTop: 20 },
  searchIcon: { position: 'absolute', left: 35, zIndex: 1, opacity: 0.5 },
  searchInput: { flex: 1, height: 50, borderRadius: 18, paddingLeft: 45, borderWidth: 1, fontSize: 13 },
  addIconBtn: { width: 50, height: 50, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 4 },

  filterScroll: { maxHeight: 50, marginBottom: 5 },
  filterTab: { height: 35, paddingHorizontal: 15, borderRadius: 12, borderWidth: 1, justifyContent: 'center' },
  filterText: { fontSize: 10, fontWeight: 'bold' },

  card: { flexDirection: 'row', padding: 15, borderRadius: 25, marginBottom: 15, alignItems: 'center', borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  iconBox: { width: 55, height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  info: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemType: { fontSize: 15, fontWeight: 'bold', letterSpacing: 0.3 },
  lowStockBadge: { backgroundColor: '#e74c3c', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  lowStockText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  metalText: { fontSize: 11, marginTop: 3, opacity: 0.6 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  deleteBtn: { padding: 8, backgroundColor: 'rgba(231, 76, 60, 0.1)', borderRadius: 12, marginLeft: 10 }
});

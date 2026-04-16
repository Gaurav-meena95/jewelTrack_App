import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  RefreshControl,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useColorScheme } from 'react-native';
import api from '../../utils/api';
import { Ionicons } from '@expo/vector-icons';

export default function Customers() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchCustomers = async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await api.get('/customers/register/get');
      if (response.data.success) {
        const data = response.data.data.customer;
        // The API returns all customers if no phone query is provided
        const sortedData = Array.isArray(data) ? data : [data];
        setCustomers(sortedData);
        setFilteredCustomers(sortedData);
      }
    } catch (error: any) {
      console.error('Fetch Customers Error:', error.message);
      Alert.alert('Error', 'Failed to fetch customers list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (search === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter((c: any) => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        c.phone.includes(search)
      );
      setFilteredCustomers(filtered);
    }
  }, [search, customers]);

  const onRefresh = useCallback(() => {
    fetchCustomers(true);
  }, []);

  const renderCustomerItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.customerCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={() => router.push(`/customer-detail/${item._id}`)}
    >
      <View style={[styles.avatar, { backgroundColor: theme.brand + '20' }]}>
        <Text style={[styles.avatarText, { color: theme.brand }]}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.customerInfo}>
        <Text style={[styles.customerName, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.customerPhone, { color: theme.text, opacity: 0.6 }]}>
          <Ionicons name="call-outline" size={14} /> {item.phone}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={theme.icon} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Search Header */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="search" size={20} color={theme.icon} style={{ marginRight: 10 }} />
          <TextInput 
            placeholder="Search by name or phone..."
            placeholderTextColor="#888"
            style={[styles.searchInput, { color: theme.text }]}
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={theme.icon} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: theme.brand }]}
          onPress={() => router.push('/add-customer')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.brand} />
          <Text style={{ marginTop: 10, color: theme.text, opacity: 0.6 }}>Loading customers...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          renderItem={renderCustomerItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={80} color={theme.icon} style={{ opacity: 0.3 }} />
              <Text style={[styles.emptyHighlight, { color: theme.text }]}>No Customers Found</Text>
              <Text style={[styles.emptySub, { color: theme.text }]}>
                {search ? "Try a different search term" : "Start by adding your first customer"}
              </Text>
              <TouchableOpacity 
                style={[styles.emptyBtn, { borderColor: theme.brand }]}
                onPress={() => router.push('/add-customer')}
              >
                <Text style={{ color: theme.brand, fontWeight: 'bold' }}>Add Customer</Text>
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
  searchContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    gap: 10, 
    alignItems: 'center' 
  },
  searchBar: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    height: 50, 
    borderRadius: 15, 
    borderWidth: 1 
  },
  searchInput: { flex: 1, fontSize: 16 },
  addButton: { 
    width: 50, 
    height: 50, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  customerCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderRadius: 18, 
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  avatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 15
  },
  avatarText: { fontSize: 20, fontWeight: 'bold' },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 17, fontWeight: 'bold', marginBottom: 4 },
  customerPhone: { fontSize: 14 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyHighlight: { fontSize: 20, fontWeight: 'bold', marginTop: 20 },
  emptySub: { fontSize: 14, opacity: 0.6, marginTop: 8, textAlign: 'center' },
  emptyBtn: { marginTop: 25, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10, borderWidth: 1 }
});

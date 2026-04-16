import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../../constants/theme';
import { useColorScheme } from 'react-native';
import api from '../../../../utils/api';
import { Ionicons, MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Logic mirrors web: interest = remain * item.interestRate * days / 3000
const calculateLiveInterest = (item: any) => {
  if (item.status === 'closed') return 0;
  const days = Math.floor((Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const remain = item.remainingAmount !== undefined ? item.remainingAmount : item.price;
  const interest = (remain * item.interestRate * days) / 3000;
  return interest;
};

export default function CollateralComponent() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, closed

  // Calculator State
  const [showCalc, setShowCalc] = useState(false);
  const [calc, setCalc] = useState({ principal: '', rate: '', days: '' });
  const [calcResult, setCalcResult] = useState<string | null>(null);

  // Detail Modal State
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

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

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter(i => i.status === filter);
  }, [items, filter]);

  const handleRunCalc = () => {
    const p = parseFloat(calc.principal);
    const r = parseFloat(calc.rate);
    const d = parseFloat(calc.days);
    if (!p || !r || !d) return Alert.alert('Invalid', 'Please fill all calculator fields');
    const res = (p * r * d) / 3000;
    setCalcResult(res.toFixed(2));
  };

  const renderItem = ({ item }: { item: any }) => {
    const customer = item.customerId || { name: 'Unknown', phone: 'N/A' };
    const liveInterest = calculateLiveInterest(item);
    const remains = item.remainingAmount !== undefined ? item.remainingAmount : item.price;
    const totalDue = remains + liveInterest;

    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <TouchableOpacity 
            style={styles.headerLeft}
            onPress={() => { setSelectedItem(item); setShowDetail(true); }}
          >
             <View style={[styles.iconBox, { backgroundColor: '#d2a90715' }]}>
                <Ionicons name="shield-checkmark" size={24} color="#d2a907" />
             </View>
             <View>
                <Text style={[styles.customerName, { color: theme.text }]}>{customer.name}</Text>
                <Text style={[styles.customerPhone, { color: theme.text, opacity: 0.6 }]}>+91 {customer.phone}</Text>
             </View>
          </TouchableOpacity>
          <View style={[styles.statusBadgeSmall, { backgroundColor: item.status === 'active' ? '#2ecc7115' : '#e74c3c15' }]}>
            <Text style={{ color: item.status === 'active' ? '#2ecc71' : '#e74c3c', fontSize: 10, fontWeight: 'bold' }}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.itemRow}>
           <Text style={[styles.itemName, { color: theme.text }]}>{item.jewellery}</Text>
           <Text style={[styles.itemWeight, { color: theme.text, opacity: 0.5 }]}>{item.weight}g</Text>
        </View>

        <View style={styles.metricsGrid}>
           <View style={styles.metricItem}>
             <Text style={styles.metricLabel}>Principal</Text>
             <Text style={[styles.metricVal, { color: theme.text }]}>₹{item.price}</Text>
           </View>
           <View style={styles.metricItem}>
             <Text style={[styles.metricLabel, { color: '#d2a907' }]}>Interest ({item.interestRate}%)</Text>
             <Text style={[styles.metricVal, { color: '#d2a907' }]}>+₹{liveInterest.toFixed(0)}</Text>
           </View>
           <View style={styles.metricItem}>
             <Text style={[styles.metricLabel, { color: '#e74c3c' }]}>Total Due</Text>
             <Text style={[styles.metricVal, { color: '#e74c3c' }]}>₹{totalDue.toFixed(0)}</Text>
           </View>
        </View>

        <TouchableOpacity 
           style={[styles.manageBtn, { borderColor: theme.brand }]}
           onPress={() => { setSelectedItem(item); setShowDetail(true); }}
        >
           <Text style={{ color: theme.brand, fontWeight: 'bold', fontSize: 12 }}>MANAGE ACCOUNT & HISTORY</Text>
           <Ionicons name="chevron-forward" size={14} color={theme.brand} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      
      {/* Header with Calculator & New Girvi */}
      <View style={styles.topActions}>
         <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: theme.brand }]}
            onPress={() => router.push('/create-collateral')}
         >
            <Ionicons name="add" size={20} color="#000" />
            <Text style={styles.actionBtnText}>New Girvi</Text>
         </TouchableOpacity>
         
         <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}
            onPress={() => setShowCalc(true)}
         >
            <Ionicons name="calculator-outline" size={20} color={theme.brand} />
            <Text style={[styles.actionBtnText, { color: theme.text }]}>Calculator</Text>
         </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {['all', 'active', 'closed'].map(f => (
          <TouchableOpacity 
            key={f} 
            onPress={() => setFilter(f)}
            style={[
              styles.filterTab, 
              { borderColor: theme.border },
              filter === f && { backgroundColor: theme.brand, borderColor: theme.brand }
            ]}
          >
            <Text style={[styles.filterTabText, { color: filter === f ? '#000' : theme.text, opacity: filter === f ? 1 : 0.6 }]}>
              {f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchCollaterals(true)} tintColor={theme.brand} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="shield-off-outline" size={80} color={theme.icon} style={{ opacity: 0.2 }} />
              <Text style={[styles.emptyText, { color: theme.text, opacity: 0.5 }]}>No records found</Text>
            </View>
          }
        />
      )}

      {/* Quick Calculator Modal */}
      <Modal visible={showCalc} transparent animationType="fade">
        <View style={styles.modalOverlay}>
           <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={styles.modalHeader}>
                 <Text style={[styles.modalTitle, { color: theme.text }]}>Interest Calculator</Text>
                 <TouchableOpacity onPress={() => setShowCalc(false)}>
                   <Ionicons name="close" size={24} color={theme.text} />
                 </TouchableOpacity>
              </View>
              
              <View style={styles.calcForm}>
                 <TextInput 
                    style={[styles.calcInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                    placeholder="Principal Amount" placeholderTextColor="#999" keyboardType="numeric"
                    value={calc.principal} onChangeText={(v)=>setCalc({...calc, principal: v})}
                 />
                 <TextInput 
                    style={[styles.calcInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                    placeholder="Rate % (Monthly)" placeholderTextColor="#999" keyboardType="numeric"
                    value={calc.rate} onChangeText={(v)=>setCalc({...calc, rate: v})}
                 />
                 <TextInput 
                    style={[styles.calcInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                    placeholder="Number of Days" placeholderTextColor="#999" keyboardType="numeric"
                    value={calc.days} onChangeText={(v)=>setCalc({...calc, days: v})}
                 />
              </View>

              {calcResult && (
                <View style={styles.resultBox}>
                   <Text style={{ color: theme.text, fontSize: 12, opacity: 0.6 }}>Estimated Interest</Text>
                   <Text style={{ color: theme.brand, fontSize: 24, fontWeight: 'bold' }}>₹{calcResult}</Text>
                </View>
              )}

              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.brand }]} onPress={handleRunCalc}>
                 <Text style={{ fontWeight: 'bold', color: '#000' }}>CALCULATE 30/3000 RULE</Text>
              </TouchableOpacity>
           </View>
        </View>
      </Modal>

      {/* Detail & History Modal */}
      <Modal visible={showDetail} transparent animationType="slide">
        <View style={styles.modalOverlay}>
           <View style={[styles.detailContent, { backgroundColor: theme.card }]}>
              <View style={styles.modalHeader}>
                 <Text style={[styles.modalTitle, { color: theme.text }]}>Collateral File</Text>
                 <TouchableOpacity onPress={() => setShowDetail(false)}>
                   <Ionicons name="close" size={24} color={theme.text} />
                 </TouchableOpacity>
              </View>

              <ScrollView>
                 <View style={styles.detailHeader}>
                    <Text style={[styles.detName, { color: theme.text }]}>{selectedItem?.customerId?.name}</Text>
                    <Text style={[styles.detSub, { color: theme.text, opacity: 0.5 }]}>{selectedItem?.jewellery} • {selectedItem?.weight}g</Text>
                 </View>

                 <View style={styles.detailStats}>
                    <View style={styles.dStat}>
                       <Text style={styles.dLabel}>Amount</Text>
                       <Text style={[styles.dVal, { color: theme.text }]}>₹{selectedItem?.price}</Text>
                    </View>
                    <View style={styles.dStat}>
                       <Text style={styles.dLabel}>Paid</Text>
                       <Text style={[styles.dVal, { color: '#2ecc71' }]}>₹{selectedItem?.totalPaid || 0}</Text>
                    </View>
                    <View style={styles.dStat}>
                       <Text style={styles.dLabel}>Status</Text>
                       <Text style={[styles.dVal, { color: selectedItem?.status === 'active' ? '#d2a907' : '#e74c3c' }]}>{selectedItem?.status?.toUpperCase()}</Text>
                    </View>
                 </View>

                 <Text style={[styles.sectionTitle, { color: theme.text }]}>Transaction History</Text>
                 {!selectedItem?.paymentHistory || selectedItem.paymentHistory.length === 0 ? (
                    <Text style={{ textAlign: 'center', opacity: 0.4, marginVertical: 20 }}>No payments recorded yet.</Text>
                 ) : (
                    selectedItem.paymentHistory.map((h: any, idx: number) => (
                      <View key={idx} style={[styles.historyRow, { borderBottomColor: theme.border }]}>
                         <View>
                            <Text style={{ color: theme.text, fontWeight: 'bold' }}>{h.type.toUpperCase()}</Text>
                            <Text style={{ color: theme.text, fontSize: 11, opacity: 0.5 }}>{new Date(h.date).toLocaleDateString()}</Text>
                         </View>
                         <Text style={{ color: '#2ecc71', fontWeight: 'bold' }}>+ ₹{h.amount}</Text>
                      </View>
                    ))
                 )}
              </ScrollView>

              <View style={styles.detailBtns}>
                 <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.brand, flex: 1 }]}>
                    <Text style={{ fontWeight: 'bold' }}>Record Payment</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#e74c3c', flex: 1 }]} onPress={() => Alert.alert('Coming Soon', 'Account closure logic...')}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close Account</Text>
                 </TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topActions: { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 10 },
  actionBtn: { height: 50, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingHorizontal: 20 },
  actionBtnText: { fontWeight: 'bold', fontSize: 14 },

  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginVertical: 10 },
  filterTab: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  filterTabText: { fontSize: 11, fontWeight: 'bold' },

  card: { padding: 20, borderRadius: 25, marginBottom: 15, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  customerName: { fontSize: 18, fontWeight: 'bold' },
  customerPhone: { fontSize: 12, marginTop: 2 },
  statusBadgeSmall: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  divider: { height: 1, width: '100%', marginBottom: 15, opacity: 0.3 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  itemName: { fontSize: 16, fontWeight: 'bold' },
  itemWeight: { fontSize: 14 },
  
  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.02)', padding: 15, borderRadius: 15, marginBottom: 15 },
  metricItem: { alignItems: 'flex-start' },
  metricLabel: { fontSize: 9, fontWeight: 'bold', marginBottom: 4, opacity: 0.6 },
  metricVal: { fontSize: 15, fontWeight: 'bold' },

  manageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, gap: 8 },

  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 20, fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 25, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  calcForm: { gap: 15, marginBottom: 20 },
  calcInput: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 15 },
  resultBox: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)', padding: 15, borderRadius: 15, marginBottom: 20 },
  submitBtn: { height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  detailContent: { borderRadius: 30, padding: 25, maxHeight: '80%' },
  detailHeader: { marginBottom: 20 },
  detName: { fontSize: 22, fontWeight: 'bold' },
  detSub: { fontSize: 14, marginTop: 4 },
  detailStats: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  dStat: { flex: 1, padding: 12, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.03)' },
  dLabel: { fontSize: 10, opacity: 0.5, marginBottom: 4 },
  dVal: { fontSize: 14, fontWeight: 'bold' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 15, opacity: 0.8 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  detailBtns: { flexDirection: 'row', gap: 12, marginTop: 25 }
});

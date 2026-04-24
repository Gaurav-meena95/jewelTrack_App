import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, Modal, TextInput,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../../constants/theme';
import { useColorScheme } from 'react-native';
import api from '../../../../utils/api';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { roundMoney } from '../../../../utils/money';
import CustomAlert from '../../../../components/ui/CustomAlert';
import { useAlert } from '../../../../hooks/use-alert';
import Pressable from '../../../../components/ui/Pressable';

// Logic mirrors web: interest = remain * item.interestRate * days / 3000
const calculateLiveInterest = (item: any) => {
  if (item.status === 'closed') return 0;
  const days = Math.floor((Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const remain = item.remainingAmount !== undefined ? item.remainingAmount : item.price;
  const interest = (remain * item.interestRate * days) / 3000;
  return roundMoney(interest);
};

export default function CollateralComponent() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { alertState, showAlert, hideAlert } = useAlert();
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [showCalc, setShowCalc] = useState(false);
  const [calc, setCalc] = useState({ principal: '', rate: '', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] });
  const [calcResult, setCalcResult] = useState<string | null>(null);

  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const fetchCollaterals = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const response = await api.get('/customers/collatral/me');
      if (response.data.success) {
        setItems(response.data.data.data || []);
      }
    } catch (error: any) {
      console.error('Fetch Collaterals Error:', error.message);
      showAlert('Error', 'Failed to load collateral records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCollaterals();
  }, []);

  const filteredItems = useMemo(() => {
    let filtered = items;
    if (filter !== 'all') filtered = filtered.filter(i => i.status === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(i => 
        (i.customerId?.name || '').toLowerCase().includes(q) || 
        String(i.phone).includes(q)
      );
    }
    return filtered;
  }, [items, filter, searchQuery]);

  const handleRunCalc = () => {
    const p = parseFloat(calc.principal);
    const r = parseFloat(calc.rate);
    const start = new Date(calc.startDate);
    const end = new Date(calc.endDate);
    
    if (!p || !r || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return Alert.alert('Invalid', 'Please fill all calculator fields correctly');
    }
    
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return Alert.alert('Invalid', 'End date cannot be before start date');
    
    const res = (p * r * days) / 3000;
    setCalcResult(roundMoney(res).toString());
  };

  const handleRecordPayment = async (item: any, amount: number, isAdjustment: boolean) => {
    if (!amount || amount <= 0) return showAlert('Error', 'Enter a valid amount');
    
    try {
      setLoading(true);
      const remain = item.remainingAmount !== undefined ? item.remainingAmount : item.price;
      const newPaid = (item.totalPaid || 0) + amount;
      const newRemain = Math.max(0, remain - amount);
      const newStatus = (isAdjustment || newRemain <= 0) ? 'closed' : 'active';

      const payload = {
        ...item,
        totalPaid: newPaid,
        remainingAmount: newRemain,
        status: newStatus,
        paymentHistory: [
          ...(item.paymentHistory || []),
          { amount, type: isAdjustment ? 'adjustment' : 'payment', date: new Date(), note: isAdjustment ? 'Negotiated Closure' : 'Regular Payment' }
        ]
      };

      const res = await api.patch(`/customers/collatral/update?phone=${item.phone}&collatral_id=${item._id}`, payload);
      if (res.data.success) {
        showAlert('Success', isAdjustment ? 'Account Closed!' : 'Payment Recorded!');
        setShowDetail(false);
        fetchCollaterals(true);
      }
    } catch (err: any) {
      showAlert('Error', err.response?.data?.message || 'Failed to update record');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, phone: string) => {
    showAlert(
      'Confirm Delete',
      'Are you sure you want to delete this closed record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.delete(`/customers/collatral/delete?phone=${phone}&collatral_id=${id}`);
              fetchCollaterals(true);
            } catch (err) {
              showAlert('Error', 'Failed to delete record');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const customer = item.customerId || { name: 'Unknown', phone: 'N/A' };
    const liveInterest = calculateLiveInterest(item);
    const remains = item.remainingAmount !== undefined ? item.remainingAmount : item.price;
    const totalDue = remains + liveInterest;

    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <Pressable 
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
          </Pressable>
          <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 10 }}>
             {item.status === 'closed' && (
               <Pressable onPress={() => handleDelete(item._id, item.phone)}>
                 <Ionicons name="trash-outline" size={20} color="#e74c3c" />
               </Pressable>
             )}
             <View style={[styles.statusBadgeSmall, { backgroundColor: item.status === 'active' ? '#2ecc7115' : '#e74c3c15' }]}>
               <Text style={{ color: item.status === 'active' ? '#2ecc71' : '#e74c3c', fontSize: 10, fontWeight: 'bold' }}>
                 {item.status.toUpperCase()}
               </Text>
             </View>
          </View>
        </View>
        
        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.itemRow}>
           <Text style={[styles.itemName, { color: theme.text }]}>{item.jewellery}</Text>
           <Text style={[styles.itemWeight, { color: theme.text, opacity: 0.5 }]}>{item.weight}g</Text>
        </View>

        <View style={[styles.metricsGrid, { backgroundColor: theme.background }]}>
           <View style={styles.metricItem}>
             <Text style={[styles.metricLabel, { color: theme.text }]}>Principal</Text>
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

        <Pressable 
           style={[styles.manageBtn, { borderColor: theme.brand }]}
           onPress={() => { setSelectedItem(item); setShowDetail(true); }}
        >
           <Text style={{ color: theme.brand, fontWeight: 'bold', fontSize: 12 }}>MANAGE ACCOUNT & HISTORY</Text>
           <Ionicons name="chevron-forward" size={14} color={theme.brand} />
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.icon} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
          placeholder="Search by name or phone..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {['all', 'active', 'closed'].map(f => (
          <Pressable 
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
          </Pressable>
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
                 <Pressable onPress={() => setShowCalc(false)}>
                   <Ionicons name="close" size={24} color={theme.text} />
                 </Pressable>
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
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TextInput 
                        style={[styles.calcInput, { flex: 1, backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                        placeholder="Start Date (YYYY-MM-DD)" placeholderTextColor="#999"
                        value={calc.startDate} onChangeText={(v)=>setCalc({...calc, startDate: v})}
                    />
                    <TextInput 
                        style={[styles.calcInput, { flex: 1, backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                        placeholder="End Date (YYYY-MM-DD)" placeholderTextColor="#999"
                        value={calc.endDate} onChangeText={(v)=>setCalc({...calc, endDate: v})}
                    />
                  </View>
               </View>

              {calcResult && (
                <View style={[styles.resultBox, { borderColor: theme.border, backgroundColor: theme.background }]}>
                   <Text style={{ color: theme.text, fontSize: 12, opacity: 0.6 }}>Estimated Interest</Text>
                   <Text style={{ color: theme.brand, fontSize: 24, fontWeight: 'bold' }}>₹{calcResult}</Text>
                </View>
              )}

              <Pressable style={[styles.submitBtn, { backgroundColor: theme.brand }]} onPress={handleRunCalc}>
                 <Text style={{ fontWeight: 'bold', color: '#000' }}>CALCULATE</Text>
              </Pressable>
           </View>
        </View>
      </Modal>

      {/* Detail & History Modal */}
      <Modal visible={showDetail} transparent animationType="slide">
        <View style={styles.modalOverlay}>
           <View style={[styles.detailContent, { backgroundColor: theme.card }]}>
              <View style={styles.modalHeader}>
                 <Text style={[styles.modalTitle, { color: theme.text }]}>Collateral File</Text>
                 <Pressable onPress={() => setShowDetail(false)}>
                   <Ionicons name="close" size={24} color={theme.text} />
                 </Pressable>
              </View>

              <ScrollView>
                 <View style={styles.detailHeader}>
                    <Text style={[styles.detName, { color: theme.text }]}>{selectedItem?.customerId?.name}</Text>
                    <Text style={[styles.detSub, { color: theme.text, opacity: 0.5 }]}>{selectedItem?.jewellery} • {selectedItem?.weight}g</Text>
                 </View>

                 <View style={styles.detailStats}>
                    <View style={[styles.dStat, { backgroundColor: theme.background }]}>
                       <Text style={[styles.dLabel, { color: theme.text }]}>Amount</Text>
                       <Text style={[styles.dVal, { color: theme.text }]}>₹{selectedItem?.price}</Text>
                    </View>
                    <View style={[styles.dStat, { backgroundColor: theme.background }]}>
                       <Text style={[styles.dLabel, { color: theme.text }]}>Paid</Text>
                       <Text style={[styles.dVal, { color: '#2ecc71' }]}>₹{selectedItem?.totalPaid || 0}</Text>
                    </View>
                    <View style={[styles.dStat, { backgroundColor: theme.background }]}>
                       <Text style={[styles.dLabel, { color: theme.text }]}>Status</Text>
                       <Text style={[styles.dVal, { color: selectedItem?.status === 'active' ? '#d2a907' : '#e74c3c' }]}>{selectedItem?.status?.toUpperCase()}</Text>
                    </View>
                 </View>

                 <Text style={[styles.sectionTitle, { color: theme.text }]}>Transaction History</Text>
                 {!selectedItem?.paymentHistory || selectedItem.paymentHistory.length === 0 ? (
                    <Text style={{ textAlign: 'center', opacity: 0.4, marginVertical: 20, color: theme.text }}>No payments recorded yet.</Text>
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

                  <View style={styles.paymentInputBox}>
                    <Text style={[styles.modalLabel, { color: theme.text }]}>Record Payment (₹)</Text>
                    <TextInput 
                      style={[styles.calcInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                      placeholder="Enter Amount" keyboardType="numeric"
                      onChangeText={(v) => { if(selectedItem) selectedItem.tempAmount = v; }}
                    />
                  </View>

                  <View style={styles.detailBtns}>
                    <Pressable 
                      style={[styles.actionBtn, { backgroundColor: theme.brand, flex: 1 }]}
                      onPress={() => handleRecordPayment(selectedItem, parseFloat(selectedItem?.tempAmount || '0'), false)}
                    >
                       <Text style={{ fontWeight: 'bold', color: '#000' }}>Record Pay</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.actionBtn, { backgroundColor: '#e74c3c', flex: 1 }]} 
                      onPress={() => handleRecordPayment(selectedItem, parseFloat(selectedItem?.tempAmount || '0'), true)}
                    >
                       <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close Account</Text>
                    </Pressable>
                  </View>
           </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onDismiss={hideAlert}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topActions: { flexDirection: 'row', gap: 10, padding: 20, paddingBottom: 10 },
  actionBtn: { height: 48, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingHorizontal: 18 },
  actionBtnText: { fontWeight: 'bold', fontSize: 13, letterSpacing: 0.3 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  searchIcon: { position: 'absolute', left: 35, zIndex: 1, opacity: 0.5 },
  searchInput: { flex: 1, height: 48, borderRadius: 15, paddingLeft: 45, paddingRight: 15, borderWidth: 1, fontSize: 13 },

  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginVertical: 10 },
  filterTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  filterTabText: { fontSize: 10, fontWeight: 'bold' },

  card: { padding: 18, borderRadius: 25, marginBottom: 15, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  customerName: { fontSize: 16, fontWeight: 'bold', letterSpacing: 0.3 },
  customerPhone: { fontSize: 10, marginTop: 2, opacity: 0.6 },
  statusBadgeSmall: { paddingVertical: 3, paddingHorizontal: 7, borderRadius: 6 },
  divider: { height: 1, width: '100%', marginBottom: 15, opacity: 0.3 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  itemName: { fontSize: 14, fontWeight: 'bold', letterSpacing: 0.2 },
  itemWeight: { fontSize: 12, opacity: 0.7 },
  
  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderRadius: 15, marginBottom: 15 },
  metricItem: { alignItems: 'flex-start' },
  metricLabel: { fontSize: 8, fontWeight: 'bold', marginBottom: 4, opacity: 0.5 },
  metricVal: { fontSize: 13, fontWeight: 'bold' },

  manageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, gap: 8 },

  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 20, fontSize: 14, opacity: 0.6 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 25, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  calcForm: { gap: 12, marginBottom: 20 },
  calcInput: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 15, fontSize: 13 },
  resultBox: { alignItems: 'center', borderWidth: 1, padding: 12, borderRadius: 15, marginBottom: 20 },
  submitBtn: { height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  detailContent: { borderRadius: 30, padding: 25, maxHeight: '80%' },
  detailHeader: { marginBottom: 20 },
  detName: { fontSize: 19, fontWeight: 'bold', letterSpacing: 0.5 },
  detSub: { fontSize: 12, marginTop: 4, opacity: 0.6 },
  detailStats: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  dStat: { flex: 1, padding: 10, borderRadius: 15 },
  dLabel: { fontSize: 9, opacity: 0.5, marginBottom: 4, fontWeight: 'bold' },
  dVal: { fontSize: 13, fontWeight: 'bold' },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 12, opacity: 0.8, letterSpacing: 0.5 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  paymentInputBox: { marginTop: 20 },
  modalLabel: { fontSize: 11, fontWeight: 'bold', marginBottom: 8, opacity: 0.5 },
  detailBtns: { flexDirection: 'row', gap: 10, marginTop: 20 }
});

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  RefreshControl,
  FlatList
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useColorScheme } from 'react-native';
import api from '../../utils/api';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

export default function CustomerDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', father_name: '', phone: '', email: '', address: '' });

  const fetchDetails = async () => {
    try {
      const response = await api.get(`/customers/register/detail?customerId=${id}`);
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error: any) {
      console.error('Fetch Details Error:', error.message);
      Alert.alert('Error', 'Failed to load customer details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const openEditModal = () => {
    if (data?.customer) {
      setEditForm({
        name: data.customer.name || '',
        father_name: data.customer.father_name || '',
        phone: data.customer.phone || '',
        email: data.customer.email || '',
        address: data.customer.address || ''
      });
      setEditModalVisible(true);
    }
  };

  const handleUpdate = async () => {
    if (!editForm.name || !editForm.phone) {
      return Alert.alert('Error', 'Name and Phone are required.');
    }
    setEditing(true);
    try {
      const res = await api.patch(`/customers/register/update?customerId=${id}`, editForm);
      if (res.data.success) {
        Alert.alert('Success', 'Customer updated successfully!');
        setEditModalVisible(false);
        fetchDetails();
      }
    } catch (err: any) {
      Alert.alert('Update Failed', err.response?.data?.message || 'Failed to update customer');
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Customer',
      'Are you sure you want to delete this customer? All their history will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(`/customers/register/delete?customerId=${id}`);
              if (res.data.success) {
                Alert.alert('Success', 'Customer deleted successfully');
                router.back();
              }
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete customer');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.brand} />
      </View>
    );
  }

  const Section = ({ title, icon, color, data, renderItem, emptyText }: any) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      </View>
      
      {data && data.length > 0 ? (
        data.map((item: any) => renderItem(item))
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.emptyText, { color: theme.text }]}>{emptyText}</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchDetails();}} tintColor={theme.brand} />}
    >
      {/* Profile Header */}
      <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
        <View style={[styles.avatarLarge, { backgroundColor: theme.brand + '20' }]}>
          <Text style={[styles.avatarTextLarge, { color: theme.brand }]}>
            {data?.customer?.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.name, { color: theme.text }]}>{data?.customer?.name}</Text>
        <Text style={[styles.fatherName, { color: theme.text, opacity: 0.6 }]}>s/o {data?.customer?.father_name}</Text>
        
        <View style={styles.contactRow}>
          <View style={styles.contactItem}>
            <Ionicons name="call" size={16} color={theme.brand} />
            <Text style={[styles.contactText, { color: theme.text }]}>{data?.customer?.phone}</Text>
          </View>
          {data?.customer?.email && (
            <View style={styles.contactItem}>
              <Ionicons name="mail" size={16} color={theme.brand} />
              <Text style={[styles.contactText, { color: theme.text }]}>{data?.customer?.email}</Text>
            </View>
          )}
        </View>

        <View style={[styles.addressBox, { backgroundColor: theme.background }]}>
          <Ionicons name="location" size={16} color={theme.icon} />
          <Text style={[styles.addressText, { color: theme.text }]}>{data?.customer?.address}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: theme.brand + '15' }]}
            onPress={openEditModal}
          >
            <Ionicons name="create-outline" size={20} color={theme.brand} />
            <Text style={{ color: theme.brand, fontWeight: 'bold', marginLeft: 5 }}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#e74c3c15' }]} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#e74c3c" />
            <Text style={{ color: '#e74c3c', fontWeight: 'bold', marginLeft: 5 }}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* History Sections */}
      <View style={styles.content}>
        
        <Section 
          title="Active Collaterals (Girvi)"
          icon="shield-checkmark"
          color="#e74c3c"
          data={data?.collaterals}
          emptyText="No jewelry collateral found"
          renderItem={(item: any) => (
            <TouchableOpacity key={item._id} style={[styles.historyItem, { backgroundColor: theme.card }]}>
              <View>
                <Text style={[styles.itemTitle, { color: theme.text }]}>{item.jewellery}</Text>
                <Text style={[styles.itemSub, { color: theme.text }]}>{item.weight}g | {item.interestRate}% Interest</Text>
              </View>
              <Text style={[styles.itemPrice, { color: '#e74c3c' }]}>₹ {item.price}</Text>
            </TouchableOpacity>
          )}
        />

        <Section 
          title="Invoices & Bills"
          icon="receipt"
          color="#f1c40f"
          data={data?.bills}
          emptyText="No bills generated yet"
          renderItem={(item: any) => (
            <TouchableOpacity key={item._id} style={[styles.historyItem, { backgroundColor: theme.card }]}>
              <View>
                <Text style={[styles.itemTitle, { color: theme.text }]}>#{item._id.slice(-6).toUpperCase()}</Text>
                <Text style={[styles.itemSub, { color: theme.text }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.itemPrice, { color: theme.text }]}>₹ {item.invoice.grandTotal}</Text>
                <Text style={[styles.statusBadge, { color: item.payment.paymentStatus === 'paid' ? '#2ecc71' : '#e67e22' }]}>
                  {item.payment.paymentStatus.toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />

        <Section 
          title="Active Orders"
          icon="time"
          color="#2ecc71"
          data={data?.orders}
          emptyText="No pending orders"
          renderItem={(item: any) => (
            <TouchableOpacity key={item._id} style={[styles.historyItem, { backgroundColor: theme.card }]}>
              <View>
                <Text style={[styles.itemTitle, { color: theme.text }]}>{item.items[0]?.itemName}...</Text>
                <Text style={[styles.itemSub, { color: theme.text }]}>Due: {item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString() : 'N/A'}</Text>
              </View>
              <Text style={[styles.itemPrice, { color: theme.text }]}>₹ {item.Total}</Text>
            </TouchableOpacity>
          )}
        />

      </View>
      <View style={{ height: 50 }} />


      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
           <ScrollView contentContainerStyle={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
             <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Customer</Text>

             <Text style={[styles.modalLabel, { color: theme.text }]}>Full Name *</Text>
             <TextInput 
                style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                placeholder="Full Name"
                value={editForm.name}
                onChangeText={(val) => setEditForm({...editForm, name: val})}
             />
             
             <Text style={[styles.modalLabel, { color: theme.text }]}>Father/Husband Name</Text>
             <TextInput 
                style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                placeholder="Father's Name"
                value={editForm.father_name}
                onChangeText={(val) => setEditForm({...editForm, father_name: val})}
             />
             
             <Text style={[styles.modalLabel, { color: theme.text }]}>Phone Number *</Text>
             <TextInput 
                style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                placeholder="10 digit phone"
                keyboardType="phone-pad"
                value={editForm.phone}
                onChangeText={(val) => setEditForm({...editForm, phone: val})}
             />

             <Text style={[styles.modalLabel, { color: theme.text }]}>Email Address (Optional)</Text>
             <TextInput 
                style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                placeholder="Email Address"
                autoCapitalize="none"
                value={editForm.email}
                onChangeText={(val) => setEditForm({...editForm, email: val})}
             />

             <Text style={[styles.modalLabel, { color: theme.text }]}>Complete Address</Text>
             <TextInput 
                style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, height: 80, textAlignVertical: 'top' }]} 
                placeholder="Street Address"
                multiline
                value={editForm.address}
                onChangeText={(val) => setEditForm({...editForm, address: val})}
             />

              <View style={styles.modalBtns}>
                 <TouchableOpacity 
                   style={[styles.modalCloseBtn, { borderColor: theme.border }]} 
                   onPress={() => setEditModalVisible(false)}
                 >
                   <Text style={{ color: theme.text, fontWeight: 'bold' }}>Cancel</Text>
                 </TouchableOpacity>

                 <TouchableOpacity 
                   style={[styles.modalSubmitBtn, { backgroundColor: theme.brand }]} 
                   onPress={handleUpdate}
                   disabled={editing}
                 >
                   {editing ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>Update</Text>}
                 </TouchableOpacity>
              </View>
           </ScrollView>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileCard: { 
    margin: 20, 
    padding: 25, 
    borderRadius: 25, 
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  avatarLarge: { 
    width: 90, 
    height: 90, 
    borderRadius: 45, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 15
  },
  avatarTextLarge: { fontSize: 36, fontWeight: 'bold' },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  fatherName: { fontSize: 16, marginBottom: 15 },
  contactRow: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactText: { fontSize: 14, fontWeight: '500' },
  addressBox: { 
    flexDirection: 'row', 
    padding: 15, 
    borderRadius: 15, 
    width: '100%', 
    gap: 10,
    marginBottom: 20
  },
  addressText: { flex: 1, fontSize: 13, lineHeight: 18 },
  actionRow: { flexDirection: 'row', gap: 15, width: '100%' },
  actionBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    height: 50, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  content: { paddingHorizontal: 20 },
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 },
  sectionIcon: { padding: 8, borderRadius: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  historyItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 18, 
    borderRadius: 15, 
    marginBottom: 10 
  },
  itemTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  itemSub: { fontSize: 12, opacity: 0.6 },
  itemPrice: { fontSize: 16, fontWeight: 'bold' },
  statusBadge: { fontSize: 10, fontWeight: '800', marginTop: 4 },
  emptyCard: { padding: 25, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed' },
  emptyText: { fontSize: 14, opacity: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { padding: 25, borderRadius: 20, borderWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  modalLabel: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginTop: 10, opacity: 0.8 },
  modalInput: { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 14 },
  modalBtns: { flexDirection: 'row', gap: 15, marginTop: 25 },
  modalCloseBtn: { flex: 1, padding: 15, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  modalSubmitBtn: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center' }
});

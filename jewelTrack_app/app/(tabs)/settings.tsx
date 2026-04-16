import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, useColorScheme, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import api from '../../utils/api';
import { saveUser } from '../../utils/auth';

export default function Settings() {
  const { logout } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const [user, setUser] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    shopName: '',
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  useEffect(() => {
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        setForm({
          shopName: parsed.shopName || '',
          name: parsed.name || '',
          email: parsed.email || '',
          phone: parsed.phone || '',
          password: ''
        });
      }
    };
    loadUser();
  }, [modalVisible]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
             await logout();
             router.replace('/');
          }
        }
      ]
    );
  };

  const handleUpdateProfile = async () => {
    if (!form.shopName || !form.name || !form.email || !form.phone) {
      return Alert.alert('Error', 'Missing required fields.');
    }
    setLoading(true);
    try {
       const res = await api.patch('/auth/setting', form);
       if (res.data.success) {
         Alert.alert('Success', 'Profile updated successfully.');
         await saveUser(res.data.data.user);
         setModalVisible(false);
       }
    } catch (e: any) {
       Alert.alert('Update Failed', e.response?.data?.message || 'Failed to update profile');
    } finally {
       setLoading(false);
    }
  };

  const SettingItem = ({ icon, title, subtitle, color, onPress, value }: any) => (
    <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={onPress}>
      <View style={styles.settingItemLeft}>
        <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <View>
          <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.settingSubtitle, { color: theme.text, opacity: 0.6 }]}>{subtitle}</Text>}
        </View>
      </View>
      {value ? (
        <Text style={{ color: theme.text, opacity: 0.8, fontSize: 13 }}>{value}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={20} color={theme.icon} style={{ opacity: 0.5 }} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { borderColor: theme.brand, backgroundColor: theme.card }]}>
           <Text style={[styles.avatarText, { color: theme.brand }]}>
               {user?.name ? user.name.charAt(0).toUpperCase() : 'J'}
           </Text>
        </View>
        <View style={styles.profileInfo}>
           <Text style={[styles.shopName, { color: theme.text }]}>{user?.shopName || 'Premium Jewellery'}</Text>
           <Text style={[styles.ownerName, { color: theme.text, opacity: 0.7 }]}>{user?.name} | {user?.role?.toUpperCase()}</Text>
           <View style={[styles.proBadge, { backgroundColor: theme.brand + '20' }]}>
             <Ionicons name="star" size={12} color={theme.brand} />
             <Text style={{ color: theme.brand, fontSize: 12, fontWeight: 'bold', marginLeft: 4 }}>PRO MEMBER</Text>
           </View>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <Text style={[styles.sectionTitle, { color: theme.text, opacity: 0.8 }]}>Account Details</Text>
      <View style={styles.section}>
         <SettingItem icon="person-outline" title="Edit Profile" subtitle="Update your shop details" color="#3498db" onPress={() => setModalVisible(true)} />
         <SettingItem icon="mail-outline" title="Email" value={user?.email} color="#9b59b6" />
         <SettingItem icon="call-outline" title="Phone" value={user?.phone} color="#2ecc71" />
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text, opacity: 0.8 }]}>Shop Settings</Text>
      <View style={styles.section}>
         <SettingItem icon="pricetag-outline" title="Metal Rates Configuration" subtitle="Set daily gold/silver rates" color="#e67e22" onPress={() => Alert.alert('Coming Soon', 'Rates configuration coming soon!')} />
         <SettingItem icon="print-outline" title="Invoice Print Setup" subtitle="Store logo and T&C" color="#1abc9c" onPress={() => Alert.alert('Coming Soon', 'Invoice setup coming soon!')} />
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text, opacity: 0.8 }]}>Security</Text>
      <View style={styles.section}>
         <SettingItem icon="lock-closed-outline" title="Change Password" subtitle="Secure your account" color="#e74c3c" onPress={() => setModalVisible(true)} />
         <TouchableOpacity 
           style={[styles.logoutBtn, { borderColor: theme.border, backgroundColor: theme.card }]} 
           onPress={handleLogout}
         >
           <Ionicons name="log-out-outline" size={24} color="#e74c3c" />
           <Text style={styles.logoutText}>Log Out Account</Text>
         </TouchableOpacity>
      </View>

      <View style={styles.versionContainer}>
         <Text style={[styles.versionText, { color: theme.text, opacity: 0.4 }]}>JewelTrack App Version 1.0.0</Text>
      </View>

      {/* Edit Profile Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
           <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
             <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Account</Text>

             <Text style={[styles.modalLabel, { color: theme.text }]}>Shop Name</Text>
             <TextInput 
                style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                placeholder="Shop Name"
                placeholderTextColor="#999"
                value={form.shopName}
                onChangeText={(val) => setForm({...form, shopName: val})}
             />
             
             <Text style={[styles.modalLabel, { color: theme.text }]}>Owner Name</Text>
             <TextInput 
                style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                placeholder="Owner Name"
                placeholderTextColor="#999"
                value={form.name}
                onChangeText={(val) => setForm({...form, name: val})}
             />
             
             <Text style={[styles.modalLabel, { color: theme.text }]}>Email Address</Text>
             <TextInput 
                style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                placeholder="Email Address"
                placeholderTextColor="#999"
                value={form.email}
                autoCapitalize="none"
                onChangeText={(val) => setForm({...form, email: val})}
             />
             
             <Text style={[styles.modalLabel, { color: theme.text }]}>Phone Number</Text>
             <TextInput 
                style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                placeholder="Phone Number"
                placeholderTextColor="#999"
                value={form.phone}
                keyboardType="phone-pad"
                onChangeText={(val) => setForm({...form, phone: val})}
             />
             
             <Text style={[styles.modalLabel, { color: theme.text }]}>New Password (Optional)</Text>
             <TextInput 
                style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                placeholder="Leave blank to keep same"
                placeholderTextColor="#999"
                secureTextEntry
                value={form.password}
                onChangeText={(val) => setForm({...form, password: val})}
             />

              <View style={styles.modalBtns}>
                 <TouchableOpacity 
                   style={[styles.modalCloseBtn, { borderColor: theme.border }]} 
                   onPress={() => setModalVisible(false)}
                 >
                   <Text style={{ color: theme.text, fontWeight: 'bold' }}>Cancel</Text>
                 </TouchableOpacity>

                 <TouchableOpacity 
                   style={[styles.modalSubmitBtn, { backgroundColor: theme.brand }]} 
                   onPress={handleUpdateProfile}
                   disabled={loading}
                 >
                   {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text>}
                 </TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  avatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 30, fontWeight: 'bold' },
  profileInfo: { marginLeft: 15, flex: 1 },
  shopName: { fontSize: 20, fontWeight: 'bold' },
  ownerName: { fontSize: 13, marginTop: 4 },
  proBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 6 },
  divider: { height: 1, width: '100%', marginBottom: 25, opacity: 0.5 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 15, marginLeft: 5 },
  section: { marginBottom: 30 },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderRadius: 15, marginBottom: 10, borderWidth: 1 },
  settingItemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  settingTitle: { fontSize: 15, fontWeight: '500' },
  settingSubtitle: { fontSize: 11, marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 15, marginTop: 5, borderWidth: 1 },
  logoutText: { color: '#e74c3c', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  versionContainer: { alignItems: 'center', marginTop: 20, marginBottom: 50 },
  versionText: { fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', padding: 25, borderRadius: 20, borderWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  modalLabel: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginTop: 10, opacity: 0.8 },
  modalInput: { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 14 },
  modalBtns: { flexDirection: 'row', gap: 15, marginTop: 25 },
  modalCloseBtn: { flex: 1, padding: 15, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  modalSubmitBtn: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center' }
});

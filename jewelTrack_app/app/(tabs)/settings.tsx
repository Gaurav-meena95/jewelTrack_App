import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, Alert, useColorScheme, 
  Modal, TextInput, ActivityIndicator, 
  Platform, KeyboardAvoidingView 
} from 'react-native';
import { Colors } from '../../constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import api from '../../utils/api';
import { saveUser, clearTokens } from '../../utils/auth';

import { Fonts } from '../../constants/theme';

// ─── Sub-components defined OUTSIDE parent to prevent re-mount on re-render ───

const SettingSection = ({ title, children, theme }: any) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: theme.text, opacity: 0.5 }]}>{title.toUpperCase()}</Text>
    <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
      {children}
    </View>
  </View>
);

const ActionItem = ({ icon, label, color, onPress, value, last, theme }: any) => (
  <TouchableOpacity 
    style={[styles.actionItem, !last && { borderBottomWidth: 1, borderBottomColor: theme.border }]} 
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.actionLabel, { color: theme.text, fontFamily: Fonts.medium }]}>{label}</Text>
      {value && <Text style={[styles.actionValue, { color: theme.text }]}>{value}</Text>}
    </View>
    {onPress && <Ionicons name="chevron-forward" size={14} color={theme.icon} style={{ opacity: 0.3 }} />}
  </TouchableOpacity>
);

const Tag = ({ label, onRemove, theme }: any) => (
  <View style={[styles.tag, { backgroundColor: theme.brand + '15', borderColor: theme.brand + '30' }]}>
    <Text style={[styles.tagText, { color: theme.text }]}>{label}</Text>
    <TouchableOpacity onPress={onRemove} style={styles.tagRemove}>
      <Ionicons name="close-circle" size={16} color={theme.brand} />
    </TouchableOpacity>
  </View>
);

export default function Settings() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const [user, setUser] = useState<any>(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    shopName: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    itemNames: [] as string[],
    purities: [] as string[]
  });

  const [newItemName, setNewItemName] = useState('');
  const [newPurity, setNewPurity] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success) {
        const u = res.data.data.user;
        setUser(u);
        setForm({
          shopName: u.shopName || '',
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          password: '',
          itemNames: u.itemNames || [],
          purities: u.purities || []
        });
        await saveUser(u);
      }
    } catch (e) {
      console.log('Fetch Profile Error', e);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
       // Strip empty password so backend doesn't try to validate/hash it
       const payload: any = { ...form };
       if (!payload.password || payload.password.trim() === '') {
         delete payload.password;
       }
       const res = await api.patch('/auth/shopkeeper/setting', payload);
       if (res.data.success) {
         Alert.alert('Success', 'Business preferences calibrated! ✨');
         setProfileModalVisible(false);
         fetchProfile();
       }
    } catch (e: any) {
       console.log('[Settings] Update failed —', e.response?.data || e.message);
       Alert.alert('Update Failed', e.response?.data?.message || 'Failed to update profile');
    } finally {
       setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await clearTokens();   // clears all AsyncStorage
          setUser(null);         // reset local state immediately
          router.replace('/login');  // go straight to login, skip index session check
        }
      }
    ]);
  };

  const addItemName = () => {
    if (newItemName.trim() && !form.itemNames.includes(newItemName.trim())) {
      setForm(prev => ({ ...prev, itemNames: [...prev.itemNames, newItemName.trim()] }));
      setNewItemName('');
    }
  };

  const removeItemName = (item: string) => {
    setForm(prev => ({ ...prev, itemNames: prev.itemNames.filter(i => i !== item) }));
  };

  const addPurity = () => {
    if (newPurity.trim() && !form.purities.includes(newPurity.trim())) {
      setForm(prev => ({ ...prev, purities: [...prev.purities, newPurity.trim()] }));
      setNewPurity('');
    }
  };

  const removePurity = (p: string) => {
    setForm(prev => ({ ...prev, purities: prev.purities.filter(i => i !== p) }));
  };


  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      
      {/* PROFILE HEADER */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.brand + '15', borderColor: theme.brand }]}>
          <Text style={[styles.avatarText, { color: theme.brand, fontFamily: Fonts.bold }]}>
            {user?.name?.charAt(0).toUpperCase() || 'J'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.shopName, { color: theme.text, fontFamily: Fonts.bold }]}>{user?.shopName}</Text>
          <Text style={[styles.ownerName, { color: theme.text }]}>{user?.name} • Pro Merchant</Text>
        </View>
      </View>

      {/* ACCOUNT SETTINGS */}
      <SettingSection title="Account & Identity" theme={theme}>
        <ActionItem theme={theme} icon="person-outline" label="Business Profile" value="Name, Email, Shop" color="#d2a907" onPress={() => setProfileModalVisible(true)} />
        <ActionItem theme={theme} icon="lock-closed-outline" label="Security" value="Update Password" color="#e74c3c" onPress={() => setProfileModalVisible(true)} />
        <ActionItem theme={theme} icon="call-outline" label="Contact verified" value={user?.phone} color="#2ecc71" last />
      </SettingSection>

      {/* FEEDBACK & SUPPORT */}
      <SettingSection title="Feedback & Support" theme={theme}>
        <ActionItem theme={theme} icon="chatbubble-ellipses-outline" label="Request a Feature" value="Tell us what's missing" color="#3498db" onPress={() => Alert.alert('Feature Request', 'Send your suggestions to support@jeweltrack.com')} />
        <ActionItem theme={theme} icon="bug-outline" label="Report a Bug" value="Help us improve" color="#e67e22" onPress={() => Alert.alert('Report Bug', 'Our engineers are ready! Please email details to tech@jeweltrack.com')} />
        <ActionItem theme={theme} icon="star-outline" label="Rate JewelTrack" value="Love using the app?" color="#f1c40f" last onPress={() => Alert.alert('Rating', 'Redirecting to App Store...')} />
      </SettingSection>

      {/* BUSINESS PRESETS */}
      <SettingSection title="Inventory Presets" theme={theme}>
        <View style={styles.presetBox}>
           <Text style={[styles.presetTitle, { color: theme.text }]}>Predefined Item Names</Text>
           <View style={styles.tagCloud}>
              {form.itemNames.map(item => <Tag key={item} label={item} onRemove={() => removeItemName(item)} theme={theme} />)}
           </View>
           <View style={styles.inlineAdd}>
              <TextInput 
                style={[styles.inlineInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                placeholder="Add new item (e.g. Ring)" placeholderTextColor="#999"
                value={newItemName} onChangeText={setNewItemName}
                returnKeyType="done" onSubmitEditing={addItemName}
              />
              <TouchableOpacity style={[styles.inlineBtn, { backgroundColor: theme.brand }]} onPress={addItemName}>
                 <Ionicons name="add" size={20} color="#000" />
              </TouchableOpacity>
           </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.presetBox}>
           <Text style={[styles.presetTitle, { color: theme.text }]}>Purity Presets</Text>
           <View style={styles.tagCloud}>
              {form.purities.map(p => <Tag key={p} label={p} onRemove={() => removePurity(p)} theme={theme} />)}
           </View>
           <View style={styles.inlineAdd}>
              <TextInput 
                style={[styles.inlineInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                placeholder="Add purity (e.g. 22K)" placeholderTextColor="#999"
                value={newPurity} onChangeText={setNewPurity}
                returnKeyType="done" onSubmitEditing={addPurity}
              />
              <TouchableOpacity style={[styles.inlineBtn, { backgroundColor: theme.brand }]} onPress={addPurity}>
                 <Ionicons name="add" size={20} color="#000" />
              </TouchableOpacity>
           </View>
        </View>
      </SettingSection>

      {/* SAVE GLOBAL BUTTON */}
      <TouchableOpacity 
        style={[styles.saveBtn, { backgroundColor: theme.brand }]} 
        onPress={handleUpdateProfile}
        disabled={saving}
      >
        {saving ? <ActivityIndicator color="#000" /> : <><Ionicons name="cloud-upload-outline" size={20} color="#000" /><Text style={styles.saveBtnText}>Apply All Changes</Text></>}
      </TouchableOpacity>

      {/* LOGOUT */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
        <Text style={styles.logoutText}>Log Out Session</Text>
      </TouchableOpacity>

      {/* EDIT MODAL */}
      <Modal visible={profileModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
           <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text, fontFamily: Fonts.bold }]}>Edit Business Identity</Text>
              
              <View style={styles.modalForm}>
                <TextInput style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} placeholder="Shop Name" value={form.shopName} onChangeText={(v)=>setForm({...form, shopName: v})} />
                <TextInput style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} placeholder="Owner Name" value={form.name} onChangeText={(v)=>setForm({...form, name: v})} />
                <TextInput style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} placeholder="Email" value={form.email} onChangeText={(v)=>setForm({...form, email: v})} autoCapitalize="none" />
                <TextInput style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} placeholder="New Password" value={form.password} onChangeText={(v)=>setForm({...form, password: v})} secureTextEntry />
              </View>

              <View style={styles.modalBtns}>
                 <TouchableOpacity style={[styles.mBtn, { borderColor: theme.border }]} onPress={()=>setProfileModalVisible(false)}><Text style={{ color: theme.text }}>Cancel</Text></TouchableOpacity>
                 <TouchableOpacity style={[styles.mBtn, { backgroundColor: theme.brand }]} onPress={handleUpdateProfile}><Text style={{ color: '#000', fontWeight: 'bold' }}>Update</Text></TouchableOpacity>
              </View>
           </View>
        </KeyboardAvoidingView>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 30, gap: 12 },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24 },
  shopName: { fontSize: 18 },
  ownerName: { fontSize: 11, opacity: 0.5, marginTop: 2 },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', marginBottom: 10, marginLeft: 5, letterSpacing: 1 },
  sectionCard: { borderRadius: 20, overflow: 'hidden' },

  actionItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  actionIcon: { width: 35, height: 35, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 13 },
  actionValue: { fontSize: 11, opacity: 0.4, marginTop: 2 },

  presetBox: { padding: 18 },
  presetTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 12 },
  tagCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, gap: 5 },
  tagText: { fontSize: 11 },
  tagRemove: { marginLeft: 2 },
  inlineAdd: { flexDirection: 'row', gap: 10 },
  inlineInput: { flex: 1, height: 42, borderRadius: 12, borderWidth: 1, paddingHorizontal: 15, fontSize: 12 },
  inlineBtn: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  divider: { height: 1 },

  saveBtn: { flexDirection: 'row', height: 55, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 4 },
  saveBtnText: { fontSize: 15, fontWeight: 'bold' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, padding: 15, gap: 10 },
  logoutText: { color: '#e74c3c', fontWeight: 'bold', fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 25, padding: 25, borderWidth: 1 },
  modalTitle: { fontSize: 16, marginBottom: 20 },
  modalForm: { gap: 12, marginBottom: 25 },
  modalInput: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 15, fontSize: 13 },
  modalBtns: { flexDirection: 'row', gap: 15 },
  mBtn: { flex: 1, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 }
});

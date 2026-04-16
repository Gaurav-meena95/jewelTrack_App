import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/theme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function Settings() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout from JewelTrack? 🔐',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            await logout();
            router.replace('/'); // Go to landing page
          } 
        }
      ]
    );
  };

  const SettingItem = ({ icon, label, onPress, color = theme.text, sub ]: any) => (
    <TouchableOpacity 
      style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]} 
      onPress={onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        {sub && <Text style={[styles.subLabel, { color: theme.text, opacity: 0.5 }]}>{sub}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.icon} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Profile Header */}
      <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
        <View style={[styles.avatar, { backgroundColor: theme.brand + '20' }]}>
          <Text style={[styles.avatarText, { color: theme.brand }]}>
            {user?.name?.charAt(0).toUpperCase() || 'J'}
          </Text>
        </View>
        <Text style={[styles.shopName, { color: theme.text }]}>{user?.shopName || 'JewelTrack Shop'}</Text>
        <Text style={[styles.ownerName, { color: theme.text, opacity: 0.6 }]}>Owner: {user?.name}</Text>
        <Text style={[styles.email, { color: theme.brand }]}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text, opacity: 0.5 }]}>SHOP CONFIGURATION</Text>
        <SettingItem 
          icon="pricetags-outline" 
          label="Today's Metal Rates" 
          sub="Set Gold & Silver prices"
          color="#f1c40f"
          onPress={() => Alert.alert('Info', 'Rates configuration coming soon!')}
        />
        <SettingItem 
          icon="business-outline" 
          label="Shop Profile" 
          sub="Update address & contact"
          onPress={() => Alert.alert('Info', 'Profile updates coming soon!')}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text, opacity: 0.5 }]}>APP SETTINGS</Text>
        <SettingItem 
          icon="notifications-outline" 
          label="Notifications" 
          onPress={() => {}}
        />
        <SettingItem 
          icon="shield-checkmark-outline" 
          label="Privacy & Security" 
          onPress={() => {}}
        />
        <SettingItem 
          icon="help-circle-outline" 
          label="Help & Support" 
          onPress={() => {}}
        />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#e74c3c" />
        <Text style={styles.logoutText}>Log Out Account</Text>
      </TouchableOpacity>

      <Text style={[styles.version, { color: theme.text, opacity: 0.3 }]}>JewelTrack v1.0.0 • Made with ❤️</Text>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  profileCard: { 
    padding: 30, 
    borderRadius: 25, 
    alignItems: 'center', 
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  avatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 15
  },
  avatarText: { fontSize: 32, fontWeight: 'bold' },
  shopName: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  ownerName: { fontSize: 14, marginBottom: 5 },
  email: { fontSize: 14, fontWeight: '500' },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1, marginLeft: 5 },
  settingItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderRadius: 18, 
    marginBottom: 12,
    borderWidth: 1 
  },
  iconBox: { padding: 10, borderRadius: 12, marginRight: 15 },
  label: { fontSize: 16, fontWeight: '600' },
  subLabel: { fontSize: 12, marginTop: 2 },
  logoutBtn: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 10, 
    padding: 18, 
    borderRadius: 15, 
    backgroundColor: '#e74c3c10',
    marginTop: 10,
    marginBottom: 20
  },
  logoutText: { color: '#e74c3c', fontSize: 16, fontWeight: 'bold' },
  version: { textAlign: 'center', fontSize: 12 }
});

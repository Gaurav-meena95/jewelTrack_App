import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, Dimensions, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts } from '../constants/theme';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown, FadeIn } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function LandingPage() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const features = [
    { id: '1', name: 'Smart CRM', icon: 'people' },
    { id: '2', name: 'Digital Invoicing', icon: 'receipt' },
    { id: '3', name: 'Live Inventory', icon: 'diamond' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Background Decorators */}
      <View style={[styles.bgCircle, { backgroundColor: theme.brand, top: -height * 0.1, left: -width * 0.2, opacity: isDark ? 0.05 : 0.08 }]} />
      <View style={[styles.bgCircle, { backgroundColor: theme.brand, bottom: -height * 0.1, right: -width * 0.2, opacity: isDark ? 0.05 : 0.08 }]} />

      <View style={styles.mainContent}>
        {/* Upper Content with Animation */}
        <Animated.View entering={FadeInDown.delay(100).duration(1000).springify()} style={styles.topSection}>
          <View style={[styles.iconContainer, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff', borderColor: theme.brand, borderWidth: 1 }]}>
            {/* Soft Glow */}
            <View style={[styles.glow, { backgroundColor: theme.brand }]} />
            <FontAwesome5 name="gem" size={55} color={theme.brand} style={{ zIndex: 2 }} />
          </View>
          
          <Text style={[styles.title, { color: theme.text }]}>JewelTrack</Text>
          <Text style={[styles.subtitle, { color: theme.text, opacity: 0.6 }]}>
            The Ultimate Management Suite for Next-Gen Jewellers
          </Text>

          {/* Features Pills */}
          <Animated.View entering={FadeIn.delay(500).duration(800)} style={styles.featuresRow}>
            {features.map((item, index) => (
              <View key={item.id} style={[styles.featurePill, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name={item.icon as any} size={14} color={theme.brand} />
                <Text style={[styles.featureText, { color: theme.text, opacity: 0.8 }]}>{item.name}</Text>
              </View>
            ))}
          </Animated.View>

        </Animated.View>

        {/* Buttons Section */}
        <Animated.View entering={FadeInUp.delay(300).duration(800).springify()} style={styles.bottomSection}>
          
          <Text style={[styles.trustedText, { color: theme.text, opacity: 0.5 }]}>Trusted by 500+ Showrooms</Text>
          
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: theme.brand }]}
            onPress={() => router.push('/signup')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Create Free Account</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.secondaryButton, { borderColor: theme.border, backgroundColor: isDark ? '#1E1E1E' : '#fafafa' }]}
            onPress={() => router.push('/login')}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Log In to Dashboard</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
             <MaterialIcons name="security" size={12} color={theme.brand} />
             <Text style={[styles.footerText, { color: theme.text, opacity: 0.4 }]}>
               256-bit Secure & Encrypted Connection
             </Text>
          </View>
        </Animated.View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  bgCircle: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    paddingVertical: 40,
    zIndex: 2,
  },
  topSection: {
    alignItems: 'center',
    marginTop: height * 0.08,
  },
  iconContainer: {
    width: 130,
    height: 130,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 35,
    // iOS Shadow
    shadowColor: "#d2a907",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    // Android Shadow
    elevation: 15,
  },
  glow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 35,
    opacity: 0.2,
    transform: [{ scale: 1.2 }],
    zIndex: 1,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 35,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomSection: {
    width: '100%',
    gap: 15,
  },
  trustedText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  primaryButton: {
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: "#d2a907",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 20,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
  }
});

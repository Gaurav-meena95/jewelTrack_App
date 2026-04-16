import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

export default function LandingPage() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light'; // Detects phone theme
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Upper Content with Animation */}
      <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.topSection}>
        <View style={[styles.iconContainer, { backgroundColor: theme.card }]}>
          <FontAwesome5 name="gem" size={60} color={theme.brand} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>JewelTrack</Text>
        <Text style={[styles.subtitle, { color: theme.text, opacity: 0.7 }]}>
          Premium Shop Management System
        </Text>
      </Animated.View>

      {/* Buttons Section */}
      <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.bottomSection}>
        
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: theme.brand }]}
          onPress={() => router.push('/signup')}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.secondaryButton, { borderColor: theme.brand }]}
          onPress={() => router.push('/login')}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.brand }]}>Sign In</Text>
        </TouchableOpacity>

        <Text style={[styles.footerText, { color: theme.text, opacity: 0.5 }]}>
          v1.0.0 | Secure & Encrypted
        </Text>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingVertical: 60,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 60,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    // iOS Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    // Android Shadow
    elevation: 8,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  bottomSection: {
    width: '100%',
    gap: 15,
  },
  primaryButton: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 10,
  }
});

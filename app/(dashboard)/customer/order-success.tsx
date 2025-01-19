import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function OrderSuccessScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Order Confirmed',
          headerShadowVisible: false,
          headerLeft: () => null, // Disable back button
        }}
      />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#10B981" />
        </View>
        
        <Text style={styles.title}>Order Confirmed!</Text>
        <Text style={styles.message}>
          Your order has been successfully placed. You will receive a confirmation
          email with your order details and tracking information.
        </Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={24} color="#6B7280" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Estimated Delivery</Text>
              <Text style={styles.infoValue}>24-48 hours</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { marginTop: 16 }]}>
            <Ionicons name="notifications-outline" size={24} color="#6B7280" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Status Updates</Text>
              <Text style={styles.infoValue}>You'll receive notifications about your delivery</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.trackButton}
          onPress={() => {
            // Navigate to active orders screen
            router.push('/(dashboard)/customer/active-orders');
          }}
        >
          <Text style={styles.trackButtonText}>Track Order</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.homeButton}
          onPress={() => {
            // Navigate back to home
            router.push('/(dashboard)/customer');
          }}
        >
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  infoValue: {
    fontSize: 14,
    color: '#6B7280',
    letterSpacing: 0.2,
  },
  bottomContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  trackButton: {
    backgroundColor: '#0066FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  trackButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  homeButton: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
}); 
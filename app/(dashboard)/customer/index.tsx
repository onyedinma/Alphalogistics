import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { StorageService } from '@/services/storage';
import { OrderService } from '@/services/orders';
import { Order } from '@/types';

export default function CustomerDashboard() {
  const user = auth().currentUser;
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const orders = await OrderService.getActiveOrders();
        setActiveOrders(orders);
      } catch (error) {
        console.error('Error loading orders:', error);
      }
    };

    loadOrders();
  }, []);

  const handleSignOut = async () => {
    try {
      await auth().signOut();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNewOrder = async () => {
    try {
      await StorageService.clearOrderData();
      await StorageService.initializeOrderDraft();
      router.push('/(dashboard)/customer/new-order');
    } catch (error) {
      console.error('Error starting new order:', error);
      router.push('/(dashboard)/customer/new-order');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Dashboard',
          headerRight: () => (
            <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
              <Ionicons name="log-out-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.welcomeCard}>
        <ThemedText style={styles.welcomeText}>
          Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
        </ThemedText>
        <ThemedText style={styles.statsText}>
          Your Delivery Partner
        </ThemedText>
      </View>

      <View style={styles.quickStats}>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => router.push('/(dashboard)/customer/active-orders')}
        >
          <Ionicons name="bicycle" size={24} color="#007AFF" />
          <ThemedText style={styles.statNumber}>{activeOrders.length}</ThemedText>
          <ThemedText style={styles.statLabel}>Active Orders</ThemedText>
        </TouchableOpacity>

        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          <ThemedText style={styles.statNumber}>0</ThemedText>
          <ThemedText style={styles.statLabel}>Completed</ThemedText>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="alert-circle" size={24} color="#FF9800" />
          <ThemedText style={styles.statNumber}>0</ThemedText>
          <ThemedText style={styles.statLabel}>Issues</ThemedText>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity 
          style={styles.menuCard}
          onPress={handleNewOrder}
        >
          <Ionicons name="add-circle" size={28} color="#007AFF" />
          <View style={styles.menuContent}>
            <ThemedText style={styles.menuTitle}>New Order</ThemedText>
            <ThemedText style={styles.menuDescription}>Create a new delivery request</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuCard}
          onPress={() => router.push('/(dashboard)/customer/active-orders')}
        >
          <Ionicons name="time-outline" size={28} color="#007AFF" />
          <View style={styles.menuContent}>
            <ThemedText style={styles.menuTitle}>Track Orders</ThemedText>
            <ThemedText style={styles.menuDescription}>Track active and completed deliveries</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuCard}
          onPress={() => router.push('/(dashboard)/customer/order-history')}
        >
          <Ionicons name="document-text-outline" size={28} color="#007AFF" />
          <View style={styles.menuContent}>
            <ThemedText style={styles.menuTitle}>History</ThemedText>
            <ThemedText style={styles.menuDescription}>View past deliveries and analytics</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuCard}
          onPress={() => router.push('/(dashboard)/customer/profile')}
        >
          <Ionicons name="person-outline" size={28} color="#007AFF" />
          <View style={styles.menuContent}>
            <ThemedText style={styles.menuTitle}>Profile</ThemedText>
            <ThemedText style={styles.menuDescription}>Manage account and preferences</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  signOutButton: {
    paddingHorizontal: 10,
  },
  welcomeCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  statsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  menuContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  menuCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuContent: {
    flex: 1,
    marginLeft: 16,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { StorageService } from '@/services/storage';

export default function CustomerDashboard() {
  const user = auth().currentUser;

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
      // Clear any existing order data and initialize a new draft
      await StorageService.clearAll();
      await StorageService.initializeOrderDraft();
      router.push('/(dashboard)/customer/new-order');
    } catch (error) {
      console.error('Error starting new order:', error);
      // Still proceed to new order screen even if clearing fails
      router.push('/(dashboard)/customer/new-order');
    }
  };

  return (
    <View style={styles.container}>
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
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity 
          style={styles.menuCard}
          onPress={handleNewOrder}
        >
          <Ionicons name="add-circle" size={28} color="#007AFF" />
          <View>
            <ThemedText style={styles.menuTitle}>New Order</ThemedText>
            <ThemedText style={styles.menuDescription}>Create a new delivery request</ThemedText>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuCard}
          onPress={() => router.push('/(dashboard)/customer/active-orders')}
        >
          <Ionicons name="time-outline" size={28} color="#007AFF" />
          <View>
            <ThemedText style={styles.menuTitle}>Track Orders</ThemedText>
            <ThemedText style={styles.menuDescription}>Track active and completed deliveries</ThemedText>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuCard}
          onPress={() => router.push('/(dashboard)/customer/order-history')}
        >
          <Ionicons name="document-text-outline" size={28} color="#007AFF" />
          <View>
            <ThemedText style={styles.menuTitle}>History</ThemedText>
            <ThemedText style={styles.menuDescription}>View past deliveries</ThemedText>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuCard}
          onPress={() => router.push('/(dashboard)/customer/profile')}
        >
          <Ionicons name="person-outline" size={28} color="#007AFF" />
          <View>
            <ThemedText style={styles.menuTitle}>Profile</ThemedText>
            <ThemedText style={styles.menuDescription}>Manage your account</ThemedText>
          </View>
        </TouchableOpacity>
      </View>
    </View>
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
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  menuContainer: {
    marginTop: 16,
  },
  menuCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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

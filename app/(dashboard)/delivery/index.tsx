import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const DeliveryDashboard = () => {
  const [refreshing, setRefreshing] = useState(false);
  const user = auth().currentUser;

  const handleSignOut = async () => {
    try {
      await auth().signOut();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Add refresh logic here (e.g., fetch new deliveries)
    setRefreshing(false);
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Stack.Screen
        options={{
          title: 'Delivery Dashboard',
          headerRight: () => (
            <TouchableOpacity onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back, {user?.displayName || 'Delivery Partner'}!</Text>
      </View>

      <View style={styles.actionCards}>
        <TouchableOpacity style={styles.card}>
          <Ionicons name="bicycle-outline" size={32} color="#007AFF" />
          <Text style={styles.cardTitle}>Active Deliveries</Text>
          <Text style={styles.cardDescription}>View and manage current deliveries</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Ionicons name="map-outline" size={32} color="#007AFF" />
          <Text style={styles.cardTitle}>Route Map</Text>
          <Text style={styles.cardDescription}>View optimal delivery routes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Ionicons name="document-text-outline" size={32} color="#007AFF" />
          <Text style={styles.cardTitle}>Delivery History</Text>
          <Text style={styles.cardDescription}>View completed deliveries</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Ionicons name="stats-chart-outline" size={32} color="#007AFF" />
          <Text style={styles.cardTitle}>Performance</Text>
          <Text style={styles.cardDescription}>View your delivery statistics</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: '#333',
  },
  actionCards: {
    padding: 15,
    gap: 15,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e4e8',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#333',
    marginTop: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default DeliveryDashboard;

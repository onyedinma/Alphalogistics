import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Order } from '@/types';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

export default function ActiveOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) {
      setError('Please log in to view your orders');
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = firestore()
        .collection('orders')
        .where('customerId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .onSnapshot(
          (snapshot) => {
            const allOrders = snapshot.docs
              .map(doc => ({
                id: doc.id,
                ...doc.data()
              } as Order));
            
            setOrders(allOrders);
            setLoading(false);
            setError(null);
          },
          (error) => {
            console.error('Error fetching orders:', error);
            setLoading(false);
            setError('Unable to load orders. Please try again later.');
          }
        );

      return () => unsubscribe();
    } catch (error) {
      console.error('Failed to subscribe to orders:', error);
      setLoading(false);
      setError('An unexpected error occurred');
    }
  }, []);

  const handleOrderPress = (orderId: string) => {
    try {
      if (!orderId || typeof orderId !== 'string') {
        throw new Error('Invalid order ID');
      }
      router.push(`/customer/order/${orderId}`);
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Unable to view order details. Please try again.');
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'accepted': return '#2196F3';
      case 'picked_up': return '#9C27B0';
      case 'in_transit': return '#4CAF50';
      case 'delivered': return '#4CAF50';
      case 'cancelled': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'accepted': return 'checkmark-circle-outline';
      case 'picked_up': return 'cube-outline';
      case 'in_transit': return 'bicycle-outline';
      case 'delivered': return 'checkmark-done-outline';
      case 'cancelled': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        {error === 'Please log in to view your orders' && (
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => router.replace('/auth/login')}
          >
            <ThemedText style={styles.createButtonText}>Go to Login</ThemedText>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Track Orders',
          headerBackTitle: 'Dashboard',
        }}
      />
      <View style={styles.header}>
        <ThemedText style={styles.title}>Track Orders</ThemedText>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => router.push('/customer/new-order')}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <ThemedText style={styles.createButtonText}>New Order</ThemedText>
        </TouchableOpacity>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={48} color="#666" />
          <ThemedText style={styles.emptyText}>No orders found</ThemedText>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => router.push('./create-order')}
          >
            <ThemedText style={styles.createButtonText}>Create New Order</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.orderList}>
          {orders.map(order => (
            <TouchableOpacity
              key={order.id}
              onPress={() => handleOrderPress(order.id)}
              style={styles.orderItem}
            >
              <ThemedText style={styles.orderText}>{order.trackingNumber}</ThemedText>
              <ThemedText style={styles.orderStatus}>{getStatusColor(order.status)}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  orderList: {
    padding: 16,
  },
  orderItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  orderStatus: {
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});
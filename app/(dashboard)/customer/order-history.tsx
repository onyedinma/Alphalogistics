import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Order } from './types';
import { Ionicons } from '@expo/vector-icons';  // Add this import
import { TouchableOpacity } from 'react-native-gesture-handler';

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    const unsubscribe = firestore()
      .collection('orders')
      .where('customerId', '==', user.uid)
      .where('status', 'in', ['delivered', 'cancelled'])
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const historyOrders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Order));
          setOrders(historyOrders);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching orders:', error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  const handleOrderPress = (orderId: string) => {
    router.push(`./order/${orderId}`);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'delivered': return '#4CAF50';
      case 'cancelled': return '#F44336';
      default: return '#666';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Order History',
          headerBackTitle: 'Dashboard',
        }}
      />

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={48} color="#666" />
          <ThemedText style={styles.emptyText}>No order history</ThemedText>
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
              style={styles.orderCard}
              onPress={() => handleOrderPress(order.id)}
            >
              <View style={styles.orderHeader}>
                <View>
                  <ThemedText style={styles.trackingNumber}>#{order.trackingNumber}</ThemedText>
                  <ThemedText style={styles.date}>
                    {formatDate(order.updatedAt)}
                  </ThemedText>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                  <ThemedText style={styles.statusText}>
                    {order.status.toUpperCase()}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.orderDetails}>
                <View style={styles.locationInfo}>
                  <Ionicons name="location" size={16} color="#007AFF" />
                  <ThemedText style={styles.locationText} numberOfLines={1}>
                    {order.deliveryLocation.address}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.orderFooter}>
                <ThemedText style={styles.price}>
                  ${order.pricing.total.toFixed(2)}
                </ThemedText>
                <ThemedText style={styles.itemCount}>
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                </ThemedText>
              </View>
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
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trackingNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  orderDetails: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingVertical: 12,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
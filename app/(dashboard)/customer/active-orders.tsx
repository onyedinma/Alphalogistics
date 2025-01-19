import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

interface Order {
  id: string;
  status: string;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  sender: {
    name: string;
    address: string;
    phone: string;
    state: string;
  };
  receiver: {
    name: string;
    address: string;
    phone: string;
    state: string;
  };
  delivery: {
    scheduledPickup: FirebaseFirestoreTypes.Timestamp;
    vehicle: string;
    fee?: number;
  };
  items: Array<{
    name: string;
    quantity: number;
    category: string;
    description?: string;
  }>;
}

const formatDate = (timestamp: FirebaseFirestoreTypes.Timestamp | null | undefined): string => {
  if (!timestamp || !timestamp.toDate) return 'Not scheduled';
  try {
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Not scheduled';
  }
};

export default function ActiveOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) {
      router.replace('/auth');
      return;
    }

    const unsubscribe = firestore()
      .collection('orders')
      .where('customerId', '==', user.uid)
      .where('status', 'in', ['pending', 'processing', 'in_transit'])
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const ordersList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          } as Order));
          setOrders(ordersList);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching orders:', error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'processing':
        return '#3498db';
      case 'in_transit':
        return '#2ecc71';
      default:
        return '#666';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  const renderOrderCard = ({ item }: { item: Order }) => {
    // Safely access nested properties with null checks
    const pickupAddress = item?.sender?.address || 'Address not available';
    const deliveryAddress = item?.receiver?.address || 'Address not available';
    const scheduledPickup = formatDate(item?.delivery?.scheduledPickup);
    const vehicle = item?.delivery?.vehicle || 'Not specified';
    const itemCount = item?.items?.length || 0;
    const orderDate = formatDate(item?.createdAt);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => router.push({
          pathname: "/(dashboard)/customer/order-details",
          params: { orderId: item.id }
        })}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <ThemedText style={styles.orderId}>#{item.id.slice(-6)}</ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <ThemedText style={styles.statusText}>
                {item.status.replace('_', ' ').toUpperCase()}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={styles.date}>{orderDate}</ThemedText>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.locationInfo}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <View style={styles.addressContainer}>
              <ThemedText style={styles.addressLabel}>Pickup</ThemedText>
              <ThemedText style={styles.address} numberOfLines={1}>
                {pickupAddress}
              </ThemedText>
            </View>
          </View>

          <View style={styles.locationInfo}>
            <Ionicons name="location" size={20} color="#666" />
            <View style={styles.addressContainer}>
              <ThemedText style={styles.addressLabel}>Delivery</ThemedText>
              <ThemedText style={styles.address} numberOfLines={1}>
                {deliveryAddress}
              </ThemedText>
            </View>
          </View>

          <View style={styles.deliveryInfo}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <ThemedText style={styles.infoText}>{scheduledPickup}</ThemedText>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="car-outline" size={16} color="#666" />
              <ThemedText style={styles.infoText}>{vehicle}</ThemedText>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="cube-outline" size={16} color="#666" />
              <ThemedText style={styles.infoText}>{itemCount} items</ThemedText>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Active Orders",
          headerShadowVisible: false,
        }}
      />

      <FlatList
        data={orders}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color="#666" />
            <ThemedText style={styles.emptyStateText}>No active orders</ThemedText>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
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
    fontWeight: '500',
    marginLeft: 4,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  orderDetails: {
    gap: 12,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressContainer: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  address: {
    fontSize: 14,
    color: '#333',
  },
  deliveryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 24,
  },
  newOrderButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  newOrderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
  },
});
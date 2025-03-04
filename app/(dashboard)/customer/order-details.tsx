import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

interface OrderItem {
  name: string;
  category: string;
  subcategory: string;
  quantity: number;
  weight: number;
  value: number;
  isFragile?: boolean;
  requiresSpecialHandling?: boolean;
  specialInstructions?: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
}

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
  items: OrderItem[];
  delivery: {
    scheduledPickup: FirebaseFirestoreTypes.Timestamp;
    vehicle: string;
    fee: number;
  };
  pricing: {
    itemValue: number;
    deliveryFee: number;
    total: number;
  };
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

export default function OrderDetails() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user || !orderId) return;

    const unsubscribe = firestore()
      .collection('orders')
      .doc(orderId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            setOrder({
              id: doc.id,
              ...doc.data()
            } as Order);
          }
          setIsLoading(false);
        },
        (error) => {
          console.error('Error fetching order:', error);
          setIsLoading(false);
        }
      );

    return () => unsubscribe();
  }, [orderId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'processing':
        return '#2196F3';
      case 'in_transit':
        return '#4CAF50';
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'processing':
        return 'refresh-outline';
      case 'in_transit':
        return 'bicycle-outline';
      case 'delivered':
        return 'checkmark-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-outline';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#666" />
        <ThemedText style={styles.errorText}>Order not found</ThemedText>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Stack.Screen
        options={{
          title: `Order #${order?.id.slice(-6)}`,
          headerBackTitle: 'Orders',
        }}
      />

      <View style={styles.section}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order?.status || '') }]}>
            <Ionicons name={getStatusIcon(order?.status || '')} size={20} color="#fff" />
            <ThemedText style={styles.statusText}>
              {(order?.status || '').replace('_', ' ').toUpperCase()}
            </ThemedText>
          </View>
          <ThemedText style={styles.date}>
            {formatDate(order?.createdAt)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Pickup Details</ThemedText>
        <View style={styles.contactCard}>
          <View style={styles.contactRow}>
            <Ionicons name="person-outline" size={20} color="#666" />
            <ThemedText style={styles.contactText}>{order?.sender?.name || 'N/A'}</ThemedText>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={20} color="#666" />
            <ThemedText style={styles.contactText}>{order?.sender?.phone || 'N/A'}</ThemedText>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <View style={styles.addressContainer}>
              <ThemedText style={styles.contactText}>{order?.sender?.address || 'N/A'}</ThemedText>
              <ThemedText style={styles.stateText}>{order?.sender?.state || 'N/A'}</ThemedText>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Delivery Details</ThemedText>
        <View style={styles.contactCard}>
          <View style={styles.contactRow}>
            <Ionicons name="person-outline" size={20} color="#666" />
            <ThemedText style={styles.contactText}>{order?.receiver?.name || 'N/A'}</ThemedText>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={20} color="#666" />
            <ThemedText style={styles.contactText}>{order?.receiver?.phone || 'N/A'}</ThemedText>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <View style={styles.addressContainer}>
              <ThemedText style={styles.contactText}>{order?.receiver?.address || 'N/A'}</ThemedText>
              <ThemedText style={styles.stateText}>{order?.receiver?.state || 'N/A'}</ThemedText>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Delivery Information</ThemedText>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <View>
                <ThemedText style={styles.infoLabel}>Pickup Date</ThemedText>
                <ThemedText style={styles.infoText}>
                  {formatDate(order?.delivery?.scheduledPickup)}
                </ThemedText>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="car-outline" size={20} color="#666" />
              <View>
                <ThemedText style={styles.infoLabel}>Vehicle Type</ThemedText>
                <ThemedText style={styles.infoText}>{order?.delivery?.vehicle || 'N/A'}</ThemedText>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Items ({order?.items?.length || 0})</ThemedText>
        {order?.items?.map((item, index) => (
          <View key={index} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <ThemedText style={styles.itemName}>{item.name}</ThemedText>
              <ThemedText style={styles.itemQuantity}>x{item.quantity}</ThemedText>
            </View>
            <View style={styles.itemDetails}>
              <View style={styles.itemInfo}>
                <ThemedText style={styles.itemLabel}>Category</ThemedText>
                <ThemedText style={styles.itemValue}>{item.category}</ThemedText>
              </View>
              <View style={styles.itemInfo}>
                <ThemedText style={styles.itemLabel}>Weight</ThemedText>
                <ThemedText style={styles.itemValue}>{item.weight} kg</ThemedText>
              </View>
              <View style={styles.itemInfo}>
                <ThemedText style={styles.itemLabel}>Value</ThemedText>
                <ThemedText style={styles.itemValue}>₦{item.value}</ThemedText>
              </View>
            </View>
            {item.specialInstructions && (
              <View style={styles.specialInstructions}>
                <ThemedText style={styles.itemLabel}>Special Instructions</ThemedText>
                <ThemedText style={styles.itemValue}>{item.specialInstructions}</ThemedText>
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  contactText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  addressContainer: {
    flex: 1,
  },
  stateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemQuantity: {
    fontSize: 16,
    color: '#666',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemInfo: {
    alignItems: 'center',
  },
  itemLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  itemValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  specialInstructions: {
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 12,
    marginTop: 12,
  },
  instructionsLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 14,
    color: '#333',
  },
  tags: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 12,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
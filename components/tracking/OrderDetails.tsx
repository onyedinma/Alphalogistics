import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '@/types';
import { formatEstimatedDelivery, getDeliveryStatus } from '@/utils/date';

interface OrderDetailsProps {
  order: Order;
  onPress?: () => void;
}

export function OrderDetails({ order, onPress }: OrderDetailsProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.trackingInfo}>
          <ThemedText style={styles.trackingNumber}>
            #{order.trackingNumber}
          </ThemedText>
          <View style={styles.statusBadge}>
            <ThemedText style={styles.statusText}>
              {getDeliveryStatus(order)}
            </ThemedText>
          </View>
        </View>
        <ThemedText style={styles.date}>
          {formatEstimatedDelivery(new Date(order.estimatedDelivery))}
        </ThemedText>
      </View>

      <View style={styles.content}>
        <View style={styles.locationInfo}>
          <View style={styles.locationPoint}>
            <Ionicons name="radio-button-on" size={16} color="#4CAF50" />
            <View style={styles.locationText}>
              <ThemedText style={styles.locationLabel}>Pickup</ThemedText>
              <ThemedText style={styles.address}>
                {order.pickupLocation.address}
              </ThemedText>
            </View>
          </View>
          <View style={styles.locationDivider} />
          <View style={styles.locationPoint}>
            <Ionicons name="location" size={16} color="#F44336" />
            <View style={styles.locationText}>
              <ThemedText style={styles.locationLabel}>Delivery</ThemedText>
              <ThemedText style={styles.address}>
                {order.deliveryLocation.address}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.itemInfo}>
          <View style={styles.itemCount}>
            <Ionicons name="cube-outline" size={20} color="#666" />
            <ThemedText style={styles.itemText}>
              {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
            </ThemedText>
          </View>
          <View style={styles.price}>
            <Ionicons name="cash-outline" size={20} color="#666" />
            <ThemedText style={styles.priceText}>
              ₦{order.pricing.total.toLocaleString()}
            </ThemedText>
          </View>
        </View>

        {order.currentLocation && (
          <View style={styles.currentLocation}>
            <Ionicons name="navigate-circle-outline" size={20} color="#2196F3" />
            <ThemedText style={styles.currentLocationText}>
              {order.currentLocation}
            </ThemedText>
          </View>
        )}
      </View>

      {onPress && (
        <View style={styles.footer}>
          <ThemedText style={styles.viewDetails}>View Details</ThemedText>
          <Ionicons name="chevron-forward" size={20} color="#007AFF" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  trackingInfo: {
    flex: 1,
  },
  trackingNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statusBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    gap: 16,
  },
  locationInfo: {
    gap: 12,
  },
  locationPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  locationDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginLeft: 7,
  },
  locationText: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  address: {
    fontSize: 14,
    color: '#333',
  },
  itemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  itemCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemText: {
    fontSize: 14,
    color: '#666',
  },
  price: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  currentLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  currentLocationText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  viewDetails: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 4,
  },
}); 
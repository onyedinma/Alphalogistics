import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { OrderItem, Location, OrderPricing, OrderInsurance } from '@/types';
import { Ionicons } from '@expo/vector-icons';

interface OrderReviewProps {
  items: OrderItem[];
  pickup: Location;
  delivery: Location;
  pricing: OrderPricing;
  insurance?: OrderInsurance;
  onConfirm: () => void;
  onEdit: (step: number) => void;
  loading?: boolean;
}

export function OrderReview({
  items,
  pickup,
  delivery,
  pricing,
  insurance,
  onConfirm,
  onEdit,
  loading
}: OrderReviewProps) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Items</ThemedText>
          <TouchableOpacity onPress={() => onEdit(1)}>
            <Ionicons name="pencil" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
        {items.map(item => (
          <View key={item.id} style={styles.item}>
            <ThemedText style={styles.itemText}>
              {item.quantity}x {item.description}
            </ThemedText>
            {item.weight && (
              <ThemedText style={styles.itemDetail}>{item.weight}kg</ThemedText>
            )}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Locations</ThemedText>
          <TouchableOpacity onPress={() => onEdit(2)}>
            <Ionicons name="pencil" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.locationContainer}>
          <View style={styles.locationItem}>
            <Ionicons name="location-outline" size={24} color="#666" />
            <View style={styles.locationDetails}>
              <ThemedText style={styles.locationLabel}>Pickup</ThemedText>
              <ThemedText style={styles.locationAddress}>{pickup.address}</ThemedText>
              {pickup.details && (
                <ThemedText style={styles.locationDetail}>{pickup.details}</ThemedText>
              )}
            </View>
          </View>
          <View style={styles.locationDivider} />
          <View style={styles.locationItem}>
            <Ionicons name="location" size={24} color="#007AFF" />
            <View style={styles.locationDetails}>
              <ThemedText style={styles.locationLabel}>Delivery</ThemedText>
              <ThemedText style={styles.locationAddress}>{delivery.address}</ThemedText>
              {delivery.details && (
                <ThemedText style={styles.locationDetail}>{delivery.details}</ThemedText>
              )}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Pricing & Protection</ThemedText>
          <TouchableOpacity onPress={() => onEdit(3)}>
            <Ionicons name="pencil" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.pricingDetails}>
          <View style={styles.pricingRow}>
            <ThemedText>Base Price</ThemedText>
            <ThemedText>${pricing.basePrice.toFixed(2)}</ThemedText>
          </View>
          <View style={styles.pricingRow}>
            <ThemedText>Distance Cost</ThemedText>
            <ThemedText>${pricing.distancePrice.toFixed(2)}</ThemedText>
          </View>
          <View style={styles.pricingRow}>
            <ThemedText>Weight Cost</ThemedText>
            <ThemedText>${pricing.weightPrice.toFixed(2)}</ThemedText>
          </View>
          {insurance && (
            <View style={styles.pricingRow}>
              <ThemedText>Insurance ({insurance.type})</ThemedText>
              <ThemedText>${pricing.insurancePrice.toFixed(2)}</ThemedText>
            </View>
          )}
          <View style={styles.totalRow}>
            <ThemedText style={styles.totalText}>Total</ThemedText>
            <ThemedText style={styles.totalAmount}>${pricing.total.toFixed(2)}</ThemedText>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
        onPress={onConfirm}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.confirmButtonText}>
            Confirm and Pay
          </ThemedText>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemText: {
    fontSize: 16,
  },
  itemDetail: {
    color: '#666',
  },
  locationContainer: {
    gap: 12,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  locationDetails: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 16,
  },
  locationDetail: {
    color: '#666',
    marginTop: 4,
  },
  locationDivider: {
    height: 24,
    borderLeftWidth: 2,
    borderLeftColor: '#007AFF',
    marginLeft: 12,
  },
  pricingDetails: {
    gap: 8,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalText: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '600',
    color: '#007AFF',
  },
  confirmButton: {
    margin: 16,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
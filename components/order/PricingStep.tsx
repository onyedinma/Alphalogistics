import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { OrderItem, Location, OrderPricing, OrderInsurance } from '@/types';
import { calculatePricing, INSURANCE_OPTIONS } from '@/utils/pricing';
import { Ionicons } from '@expo/vector-icons';

interface PricingStepProps {
  items: OrderItem[];
  pickup: Location;
  delivery: Location;
  onComplete: (pricing: OrderPricing, insurance?: OrderInsurance) => void;
}

export function PricingStep({ items, pickup, delivery, onComplete }: PricingStepProps) {
  const [selectedInsurance, setSelectedInsurance] = useState<OrderInsurance | undefined>();
  const [pricing, setPricing] = useState<OrderPricing | null>(null);

  useEffect(() => {
    const newPricing = calculatePricing(items, pickup, delivery, selectedInsurance);
    setPricing(newPricing);
  }, [items, pickup, delivery, selectedInsurance]);

  if (!pricing) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Delivery Summary</ThemedText>
        <View style={styles.row}>
          <ThemedText>Base Price</ThemedText>
          <ThemedText>${pricing.basePrice.toFixed(2)}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText>Distance Cost</ThemedText>
          <ThemedText>${pricing.distancePrice.toFixed(2)}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText>Weight Cost</ThemedText>
          <ThemedText>${pricing.weightPrice.toFixed(2)}</ThemedText>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Insurance Options</ThemedText>
        <View style={styles.insuranceOptions}>
          <TouchableOpacity
            style={[
              styles.insuranceOption,
              selectedInsurance?.type === 'basic' && styles.selectedInsurance,
            ]}
            onPress={() => setSelectedInsurance({
              type: 'basic',
              coverage: INSURANCE_OPTIONS.basic.coverage,
              cost: 0, // Will be calculated
            })}
          >
            <Ionicons 
              name="shield-outline" 
              size={24} 
              color={selectedInsurance?.type === 'basic' ? '#fff' : '#007AFF'} 
            />
            <ThemedText style={[
              styles.insuranceTitle,
              selectedInsurance?.type === 'basic' && styles.selectedText,
            ]}>
              Basic Protection
            </ThemedText>
            <ThemedText style={[
              styles.insuranceDetails,
              selectedInsurance?.type === 'basic' && styles.selectedText,
            ]}>
              Up to ${INSURANCE_OPTIONS.basic.coverage}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.insuranceOption,
              selectedInsurance?.type === 'premium' && styles.selectedInsurance,
            ]}
            onPress={() => setSelectedInsurance({
              type: 'premium',
              coverage: INSURANCE_OPTIONS.premium.coverage,
              cost: 0, // Will be calculated
            })}
          >
            <Ionicons 
              name="shield-checkmark-outline" 
              size={24} 
              color={selectedInsurance?.type === 'premium' ? '#fff' : '#007AFF'} 
            />
            <ThemedText style={[
              styles.insuranceTitle,
              selectedInsurance?.type === 'premium' && styles.selectedText,
            ]}>
              Premium Protection
            </ThemedText>
            <ThemedText style={[
              styles.insuranceDetails,
              selectedInsurance?.type === 'premium' && styles.selectedText,
            ]}>
              Up to ${INSURANCE_OPTIONS.premium.coverage}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.totalSection}>
        <View style={styles.row}>
          <ThemedText style={styles.totalText}>Total</ThemedText>
          <ThemedText style={styles.totalAmount}>${pricing.total.toFixed(2)}</ThemedText>
        </View>
      </View>

      <TouchableOpacity
        style={styles.confirmButton}
        onPress={() => onComplete(pricing, selectedInsurance)}
      >
        <ThemedText style={styles.confirmButtonText}>
          Proceed to Payment
        </ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  insuranceOptions: {
    gap: 12,
  },
  insuranceOption: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 8,
  },
  selectedInsurance: {
    backgroundColor: '#007AFF',
  },
  insuranceTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  insuranceDetails: {
    color: '#666',
  },
  selectedText: {
    color: '#fff',
  },
  totalSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
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
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
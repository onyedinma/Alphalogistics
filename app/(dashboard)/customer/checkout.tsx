import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createOrder } from '@/services/orders';
import { OrderItem, Location, OrderPricing, OrderInsurance, CreateOrderParams } from '@/types';

interface ItemDetails {
  category: string;
  subcategory: string;
  name: string;
  weight: string;
  quantity: string;
  value: string;
  imageUri?: string;
  isFragile?: boolean;
  requiresSpecialHandling?: boolean;
  specialInstructions?: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
}

interface ItemList {
  items: ItemDetails[];
  totalWeight: number;
  totalValue: number;
}

export default function CheckoutScreen() {
  const [itemList, setItemList] = useState<ItemList | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'transfer' | 'cash'>('card');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const itemDetailsString = await AsyncStorage.getItem('itemDetails');
      const pickupLocationString = await AsyncStorage.getItem('pickupLocation');
      const deliveryLocationString = await AsyncStorage.getItem('deliveryLocation');
      const pricingString = await AsyncStorage.getItem('pricing');

      if (!itemDetailsString || !pickupLocationString || !deliveryLocationString || !pricingString) {
        console.error('Missing required data:', {
          hasItems: !!itemDetailsString,
          hasPickup: !!pickupLocationString,
          hasDelivery: !!deliveryLocationString,
          hasPricing: !!pricingString
        });
        return;
      }

      const items: ItemDetails[] = JSON.parse(itemDetailsString);
      const totalWeight = items.reduce((sum, item) => sum + (parseFloat(item.weight) * parseInt(item.quantity)), 0);
      const totalValue = items.reduce((sum, item) => sum + (parseFloat(item.value) * parseInt(item.quantity)), 0);

      setItemList({
        items,
        totalWeight,
        totalValue
      });
    } catch (error) {
      console.error('Error loading items:', error);
      Alert.alert('Error', 'Failed to load items');
    }
  };

  const calculateDeliveryFee = (weight: number) => {
    // Base fee
    let fee = 1000;
    
    // Add fee based on weight
    if (weight <= 5) {
      fee += weight * 200;
    } else if (weight <= 20) {
      fee += 1000 + (weight - 5) * 150;
    } else {
      fee += 3250 + (weight - 20) * 100;
    }

    return Math.round(fee);
  };

  const handleProceed = async () => {
    try {
      // Load all required data from AsyncStorage
      const [
        itemDetailsString,
        pickupLocationString,
        deliveryLocationString,
        pricingString,
        insuranceString,
        orderDetailsString,
        senderDetailsString,
        receiverDetailsString,
        scheduledPickupString,
        vehicleDetailsString,
        deliveryPreferencesString,
        rtoInformationString
      ] = await Promise.all([
        AsyncStorage.getItem('itemDetails'),
        AsyncStorage.getItem('pickupLocation'),
        AsyncStorage.getItem('deliveryLocation'),
        AsyncStorage.getItem('pricing'),
        AsyncStorage.getItem('insurance'),
        AsyncStorage.getItem('orderDetails'),
        AsyncStorage.getItem('senderDetails'),
        AsyncStorage.getItem('receiverDetails'),
        AsyncStorage.getItem('scheduledPickup'),
        AsyncStorage.getItem('vehicleDetails'),
        AsyncStorage.getItem('deliveryPreferences'),
        AsyncStorage.getItem('rtoInformation')
      ]);

      // Check for required data
      if (!itemDetailsString || !pickupLocationString || !deliveryLocationString || 
          !pricingString || !orderDetailsString || !senderDetailsString || 
          !receiverDetailsString || !scheduledPickupString || !vehicleDetailsString) {
        Alert.alert('Error', 'Missing order information. Please complete all required details.');
        return;
      }

      // Parse all the data
      const itemDetails = JSON.parse(itemDetailsString);
      const pickupLocation = JSON.parse(pickupLocationString) as Location;
      const deliveryLocation = JSON.parse(deliveryLocationString) as Location;
      const pricing = JSON.parse(pricingString) as OrderPricing;
      const insurance = insuranceString ? JSON.parse(insuranceString) as OrderInsurance : undefined;
      const orderDetails = JSON.parse(orderDetailsString);
      const senderDetails = JSON.parse(senderDetailsString);
      const receiverDetails = JSON.parse(receiverDetailsString);
      const scheduledPickup = JSON.parse(scheduledPickupString);
      const vehicleDetails = JSON.parse(vehicleDetailsString);
      const deliveryPreferences = deliveryPreferencesString ? JSON.parse(deliveryPreferencesString) : undefined;
      const rtoInformation = rtoInformationString ? JSON.parse(rtoInformationString) : undefined;

      // Map ItemDetails to OrderItem
      const items: OrderItem[] = itemDetails.map((item: any, index: number) => ({
        id: `temp-${index}`,
        description: `${item.name} (${item.category} - ${item.subcategory})`,
        quantity: parseInt(item.quantity),
        weight: parseFloat(item.weight),
        value: parseFloat(item.value),
        imageUrl: item.imageUri,
        isFragile: item.isFragile,
        requiresSpecialHandling: item.requiresSpecialHandling,
        specialInstructions: item.specialInstructions,
        dimensions: item.dimensions ? {
          length: parseFloat(item.dimensions.length),
          width: parseFloat(item.dimensions.width),
          height: parseFloat(item.dimensions.height),
        } : undefined
      }));

      // Create the complete order object
      await createOrder({
        items,
        pickupLocation,
        deliveryLocation,
        pricing,
        insurance,
        sender: senderDetails,
        receiver: receiverDetails,
        scheduledPickup,
        vehicle: vehicleDetails,
        deliveryPreferences,
        rtoInformation,
        paymentMethod: selectedPaymentMethod
      });

      // Clear all stored data
      await AsyncStorage.multiRemove([
        'itemDetails',
        'pickupLocation',
        'deliveryLocation',
        'pricing',
        'insurance',
        'orderDetails',
        'senderDetails',
        'receiverDetails',
        'scheduledPickup',
        'vehicleDetails',
        'deliveryPreferences',
        'rtoInformation'
      ]);

      router.push('/customer/order-success');
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', 'Failed to create order. Please try again.');
    }
  };

  if (!itemList) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Checkout',
            headerShadowVisible: false,
          }}
        />
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No items to checkout</Text>
        </View>
      </View>
    );
  }

  const deliveryFee = calculateDeliveryFee(itemList.totalWeight);
  const total = itemList.totalValue + deliveryFee;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Checkout',
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items ({itemList.items.length})</Text>
              <Text style={styles.summaryValue}>₦{itemList.totalValue.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Weight</Text>
              <Text style={styles.summaryValue}>{itemList.totalWeight.toFixed(2)}kg</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>₦{deliveryFee.toLocaleString()}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₦{total.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentOptions}>
            <TouchableOpacity 
              style={[
                styles.paymentOption,
                selectedPaymentMethod === 'card' && styles.selectedPaymentOption
              ]}
              onPress={() => setSelectedPaymentMethod('card')}
            >
              <Ionicons 
                name="card-outline" 
                size={24} 
                color={selectedPaymentMethod === 'card' ? '#0066FF' : '#6B7280'} 
              />
              <Text style={[
                styles.paymentOptionText,
                selectedPaymentMethod === 'card' && styles.selectedPaymentOptionText
              ]}>
                Card
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.paymentOption,
                selectedPaymentMethod === 'transfer' && styles.selectedPaymentOption
              ]}
              onPress={() => setSelectedPaymentMethod('transfer')}
            >
              <Ionicons 
                name="swap-horizontal-outline" 
                size={24} 
                color={selectedPaymentMethod === 'transfer' ? '#0066FF' : '#6B7280'} 
              />
              <Text style={[
                styles.paymentOptionText,
                selectedPaymentMethod === 'transfer' && styles.selectedPaymentOptionText
              ]}>
                Transfer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.paymentOption,
                selectedPaymentMethod === 'cash' && styles.selectedPaymentOption
              ]}
              onPress={() => setSelectedPaymentMethod('cash')}
            >
              <Ionicons 
                name="cash-outline" 
                size={24} 
                color={selectedPaymentMethod === 'cash' ? '#0066FF' : '#6B7280'} 
              />
              <Text style={[
                styles.paymentOptionText,
                selectedPaymentMethod === 'cash' && styles.selectedPaymentOptionText
              ]}>
                Cash
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Proceed Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[styles.proceedButton, isLoading && styles.disabledButton]}
          onPress={handleProceed}
          disabled={isLoading}
        >
          <Text style={styles.proceedButtonText}>
            {isLoading ? 'Processing...' : `Pay ₦${total.toLocaleString()}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    letterSpacing: 0.2,
  },
  summaryValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: 0.2,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.2,
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedPaymentOption: {
    backgroundColor: '#EBF5FF',
    borderColor: '#0066FF',
  },
  paymentOptionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  selectedPaymentOptionText: {
    color: '#0066FF',
    fontWeight: '600',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  proceedButton: {
    backgroundColor: '#0066FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
}); 
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
import { OrderService } from '@/services/orders';
import { OrderItem, Location, OrderPricing, OrderInsurance, CreateOrderParams, OrderDraft, ItemDetails } from './types';
import { StorageService } from '@/services/storage';
import { Timestamp } from 'firebase/firestore';

interface ItemList {
  items: ItemDetails[];
  totalWeight: number;
  totalValue: number;
}

export default function CheckoutScreen() {
  const [itemList, setItemList] = useState<ItemList | null>(null);
  const [orderDraft, setOrderDraft] = useState<OrderDraft | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<{
    type: 'card' | 'cash' | 'wallet';
    details?: any;
  }>({ type: 'card' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadOrderData();
  }, []);

  const loadOrderData = async () => {
    try {
      const orderDraftStr = await AsyncStorage.getItem('orderDraft');
      if (!orderDraftStr) {
        console.error('Order draft not found');
        return;
      }

      const draft: OrderDraft = JSON.parse(orderDraftStr);
      setOrderDraft(draft);
      
      // Check for required sections
      if (!draft.delivery?.scheduledPickup || !draft.delivery?.vehicle ||
          !draft.items?.length || !draft.locations?.pickup?.address ||
          !draft.pricing?.itemValue || !draft.pricing?.deliveryFee) {
        console.error('Missing required data');
        return;
      }

      // Set item list with the loaded items
      const items = draft.items;
      const totalWeight = items.reduce((sum: number, item) => 
        sum + (parseFloat(item.weight) * parseInt(item.quantity)), 0);
      const totalValue = items.reduce((sum: number, item) => 
        sum + (parseFloat(item.value) * parseInt(item.quantity)), 0);

      setItemList({
        items,
        totalWeight,
        totalValue
      });
    } catch (error) {
      console.error('Error loading order data:', error);
      Alert.alert('Error', 'Failed to load order data');
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
      const orderDraft = await StorageService.getOrderDraft();
      if (!orderDraft) {
        Alert.alert('Error', 'Order details not found');
        return;
      }

      // Validate required fields with proper type checking
      const missingFields: string[] = [];

      if (!orderDraft.sender?.name) missingFields.push('Sender name');
      if (!orderDraft.sender?.address) missingFields.push('Sender address');
      if (!orderDraft.sender?.phone) missingFields.push('Sender phone');
      if (!orderDraft.sender?.state) missingFields.push('Sender state');

      if (!orderDraft.receiver?.name) missingFields.push('Receiver name');
      if (!orderDraft.receiver?.address) missingFields.push('Receiver address');
      if (!orderDraft.receiver?.phone) missingFields.push('Receiver phone');
      if (!orderDraft.receiver?.state) missingFields.push('Receiver state');

      if (!orderDraft.delivery?.scheduledPickup) missingFields.push('Pickup date');
      if (!orderDraft.delivery?.vehicle) missingFields.push('Vehicle type');

      if (!orderDraft.items || orderDraft.items.length === 0) {
        missingFields.push('Item details');
      }

      if (!orderDraft.pricing?.itemValue || !orderDraft.pricing?.deliveryFee) {
        missingFields.push('Pricing information');
      }

      if (missingFields.length > 0) {
        Alert.alert(
          'Missing Information',
          `Please complete the following details:\n${missingFields.join('\n')}`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      // Map items to OrderItem type with proper type conversion
      const items: OrderItem[] = (orderDraft.items || []).map((item) => ({
        id: `temp-${Math.random().toString(36).substring(2, 11)}`,
        name: item.name,
        category: item.category,
        subcategory: item.subcategory,
        quantity: parseInt(item.quantity),
        weight: parseFloat(item.weight),
        value: parseFloat(item.value),
        imageUrl: item.imageUri,
        isFragile: item.isFragile || false,
        requiresSpecialHandling: item.requiresSpecialHandling || false,
        specialInstructions: item.specialInstructions,
        dimensions: item.dimensions ? {
          length: parseFloat(item.dimensions.length),
          width: parseFloat(item.dimensions.width),
          height: parseFloat(item.dimensions.height)
        } : undefined
      }));

      // Format the pickup date
      const pickupDate = orderDraft.delivery?.scheduledPickup ? new Date(orderDraft.delivery.scheduledPickup) : new Date();

      // Create the complete order object with proper types
      await OrderService.createOrder({
        items,
        pickupLocation: orderDraft.locations?.pickup,
        deliveryLocation: orderDraft.locations?.delivery,
        pricing: {
          basePrice: orderDraft.pricing?.deliveryFee,
          total: orderDraft.pricing?.total
        },
        sender: {
          name: orderDraft.sender?.name,
          phone: orderDraft.sender?.phone,
          address: orderDraft.sender?.address,
          state: orderDraft.sender?.state
        },
        receiver: {
          name: orderDraft.receiver?.name || '',
          phone: orderDraft.receiver?.phone || '',
          address: orderDraft.receiver?.address || '',
          state: orderDraft.receiver?.state || ''
        },
        delivery: {
          scheduledPickup: orderDraft.delivery?.scheduledPickup,
          vehicle: orderDraft.delivery?.vehicle
        },
        paymentMethod: selectedPaymentMethod
      });

      // Clear all order data
      await StorageService.clearOrderData();

      router.push('/customer/order-success');
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', 'Failed to create order. Please try again.');
    }
  };

  if (!itemList || !orderDraft) {
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
        {/* Sender Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sender Details</Text>
          <View style={styles.detailsCard}>
            <Text style={styles.detailsName}>{orderDraft.sender.name}</Text>
            <Text style={styles.detailsText}>{orderDraft.sender.phone}</Text>
            <Text style={styles.detailsText}>{orderDraft.sender.address}</Text>
          </View>
        </View>

        {/* Receiver Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receiver Details</Text>
          <View style={styles.detailsCard}>
            <Text style={styles.detailsName}>{orderDraft.receiver.name}</Text>
            <Text style={styles.detailsText}>{orderDraft.receiver.phone}</Text>
            <Text style={styles.detailsText}>{orderDraft.receiver.address}</Text>
          </View>
        </View>

        {/* Delivery Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Pickup Date:</Text>
              <Text style={styles.detailsValue}>
                {orderDraft.delivery?.scheduledPickup ? new Date(orderDraft.delivery.scheduledPickup).toLocaleDateString() : ''}
              </Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Vehicle Type:</Text>
              <Text style={styles.detailsValue}>{orderDraft.delivery.vehicle}</Text>
            </View>
          </View>
        </View>

        {/* Items List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items ({itemList.items.length})</Text>
          {itemList.items.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDetails}>
                {item.category} - {item.subcategory}
              </Text>
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>Quantity:</Text>
                <Text style={styles.itemValue}>{item.quantity}</Text>
              </View>
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>Weight:</Text>
                <Text style={styles.itemValue}>{item.weight}kg</Text>
              </View>
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>Value:</Text>
                <Text style={styles.itemValue}>₦{parseFloat(item.value).toLocaleString()}</Text>
              </View>
              {item.specialInstructions && (
                <Text style={styles.specialInstructions}>
                  Note: {item.specialInstructions}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items Value</Text>
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
                selectedPaymentMethod.type === 'card' && styles.selectedPaymentOption
              ]}
              onPress={() => setSelectedPaymentMethod({ type: 'card' })}
            >
              <Ionicons 
                name="card-outline" 
                size={24} 
                color={selectedPaymentMethod.type === 'card' ? '#0066FF' : '#6B7280'} 
              />
              <Text style={[
                styles.paymentOptionText,
                selectedPaymentMethod.type === 'card' && styles.selectedPaymentOptionText
              ]}>
                Card
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPaymentMethod.type === 'wallet' && styles.selectedPaymentOption
              ]}
              onPress={() => setSelectedPaymentMethod({ type: 'wallet' })}
            >
              <Ionicons 
                name="wallet-outline" 
                size={24} 
                color={selectedPaymentMethod.type === 'wallet' ? '#0066FF' : '#6B7280'} 
              />
              <Text style={[
                styles.paymentOptionText,
                selectedPaymentMethod.type === 'wallet' && styles.selectedPaymentOptionText
              ]}>
                Wallet
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPaymentMethod.type === 'cash' && styles.selectedPaymentOption
              ]}
              onPress={() => setSelectedPaymentMethod({ type: 'cash' })}
            >
              <Ionicons 
                name="cash-outline" 
                size={24} 
                color={selectedPaymentMethod.type === 'cash' ? '#0066FF' : '#6B7280'} 
              />
              <Text style={[
                styles.paymentOptionText,
                selectedPaymentMethod.type === 'cash' && styles.selectedPaymentOptionText
              ]}>
                Cash
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.payButton}
          onPress={handleProceed}
        >
          <Text style={styles.payButtonText}>
            Pay ₦{total.toLocaleString()}
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
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailsName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailsLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailsValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  itemValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  specialInstructions: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
  },
  paymentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  paymentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedPaymentOption: {
    backgroundColor: '#EBF5FF',
    borderColor: '#0066FF',
  },
  paymentOptionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedPaymentOptionText: {
    color: '#0066FF',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  payButton: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
}); 
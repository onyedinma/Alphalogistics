import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { StorageService } from '@/services/storage';
import { OrderDraft, ContactDetails, ItemDetails, SenderDetails } from './types';  // Add ItemDetails to imports
import { COLORS, SHADOWS } from '@/constants/theme';

export default function DeliveryDetailsScreen() {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedVehicle, setSelectedVehicle] = useState('car');
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [items, setItems] = useState<ItemDetails[]>([]);
  
  const [senderDetails, setSenderDetails] = useState<SenderDetails>({
    name: '',
    phone: '',
    address: '',
    state: ''
  });

  const [receiverDetails, setReceiverDetails] = useState<ContactDetails>({
    name: '',
    phone: '',
    address: '',
    state: '',
    deliveryMethod: 'delivery',
    landmark: '',
    locality: '',
    city: ''
  });

  // Add new state for expanded sections
  const [expandedSections, setExpandedSections] = useState({
    sender: true,
    receiver: true,
    schedule: true,
    items: true
  });

  useEffect(() => {
    loadDraftDetails();
  }, []);

  const loadDraftDetails = async () => {
    try {
      const draft = await StorageService.getOrderDraft();
      if (draft) {
        // Load items from draft
        if (draft.items) {
          setItems(draft.items);
        }
        // The draft contains the items and pricing information 
        // that was saved in the previous screen
        if (draft.sender) {
          // Remove deliveryMethod when setting sender details
          setSenderDetails({
            name: draft.sender.name,
            phone: draft.sender.phone,
            address: draft.sender.address,
            state: draft.sender.state
          });
        }
        if (draft.receiver) {
          setReceiverDetails(draft.receiver);
          setDeliveryMethod(draft.receiver.deliveryMethod);
        }
        if (draft.delivery?.scheduledPickup) {
          setSelectedDate(new Date(draft.delivery.scheduledPickup));
        }
        if (draft.delivery?.vehicle) {
          setSelectedVehicle(draft.delivery.vehicle);
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    // Sender validation
    if (!senderDetails.name) errors.push('Sender name is required');
    if (!senderDetails.phone) errors.push('Sender phone is required');
    if (!senderDetails.address) errors.push('Sender address is required');
    if (!senderDetails.state) errors.push('Sender state is required');

    // Receiver validation
    if (!receiverDetails.name) errors.push('Receiver name is required');
    if (!receiverDetails.phone) errors.push('Receiver phone is required');
    if (!receiverDetails.state) errors.push('Receiver state is required');

    // Only validate address if delivery method is 'delivery'
    if (deliveryMethod === 'delivery') {
      if (!receiverDetails.address) errors.push('Receiver address is required');
      // Remove landmark and locality validation
    }

    return errors;
  };

  const handleSubmit = async () => {
    try {
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        Alert.alert('Validation Error', validationErrors.join('\n'));
        return;
      }
  
      const draft = await StorageService.getOrderDraft();
      if (!draft) throw new Error('No order draft found');
  
      const deliveryFee = calculateDeliveryFee(
        draft.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0)
      );
  
      const updatedDraft: OrderDraft = {
        ...draft,
        sender: {
          name: senderDetails.name,
          phone: senderDetails.phone,
          address: senderDetails.address,
          state: senderDetails.state
        },
        receiver: receiverDetails,
        delivery: {
          scheduledPickup: selectedDate.toISOString(),
          vehicle: selectedVehicle,
          fee: deliveryFee
        },
        locations: {
          pickup: {
            address: senderDetails.address,
            city: '',
            state: senderDetails.state,
            postalCode: '',
            country: 'Nigeria',
            instructions: ''
          },
          delivery: {
            address: receiverDetails.address,
            city: receiverDetails.city || '',
            state: receiverDetails.state,
            postalCode: '',
            country: 'Nigeria',
            instructions: ''
          }
        },
        pricing: {
          ...draft.pricing,
          deliveryFee: deliveryFee,
          total: draft.pricing.itemValue + deliveryFee
        }
      };
  
      console.log('Saving delivery details:', JSON.stringify(updatedDraft, null, 2));
      await StorageService.saveOrderDraft(updatedDraft);
      router.push('/customer/checkout');
    } catch (error) {
      console.error('Error saving delivery details:', error);
      Alert.alert('Error', 'Failed to save delivery details');
    }
  };
  
  const calculateDeliveryFee = (weight: number): number => {
    try {
      if (typeof weight !== 'number' || isNaN(weight) || weight < 0) {
        console.error('Invalid weight value:', weight);
        return 0;
      }
  
      let fee = 1000;
      if (weight <= 5) {
        fee += weight * 200;
      } else if (weight <= 20) {
        fee += 1000 + (weight - 5) * 150;
      } else {
        fee += 3250 + (weight - 20) * 100;
      }
  
      return Math.round(fee);
    } catch (error) {
      console.error('Error calculating delivery fee:', error);
      return 0;
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Add function to update item
  const handleUpdateItem = (index: number, updates: Partial<ItemDetails>) => {
    const updatedItems = [...items];
    const currentItem = updatedItems[index];
    
    // Handle quantity update with proper number handling
    if ('quantity' in updates) {
      const newQuantity = typeof updates.quantity === 'number' ? updates.quantity : Number(currentItem.quantity);
      updatedItems[index] = {
        ...currentItem,
        quantity: newQuantity
      };
    }

    setItems(updatedItems);

    // Update the draft with new items using proper number calculations
    StorageService.getOrderDraft().then(draft => {
      if (draft) {
        const updatedDraft: OrderDraft = {
          ...draft,
          items: updatedItems,
          pricing: {
            ...draft.pricing,
            itemValue: updatedItems.reduce((sum, item) => 
              sum + (Number(item.value) * Number(item.quantity)), 0)
          }
        };
        StorageService.saveOrderDraft(updatedDraft);
      }
    });
  };

  // Add function to remove item
  const handleRemoveItem = (index: number) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedItems = items.filter((_, i) => i !== index);
            setItems(updatedItems);
            
            // Update the draft without this item
            StorageService.getOrderDraft().then(draft => {
              if (draft) {
                const updatedDraft: OrderDraft = {
                  ...draft,
                  items: updatedItems,
                  pricing: {
                    ...draft.pricing,
                    itemValue: updatedItems.reduce((sum, item) => sum + (item.value * item.quantity), 0)
                  }
                };
                StorageService.saveOrderDraft(updatedDraft);
              }
            });
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Delivery Details',
          headerShadowVisible: false,
          headerStyle: { 
            backgroundColor: COLORS.background,
          },
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
            letterSpacing: 0.5,
          },
        }}
      />
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={[
          styles.contentContainer,
          { backgroundColor: COLORS.background }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Sender Details Section */}
        <TouchableOpacity 
          style={styles.sectionHeader} 
          onPress={() => toggleSection('sender')}
        >
          <Text style={styles.sectionTitle}>Sender Details</Text>
          <Ionicons
            name={expandedSections.sender ? "chevron-up" : "chevron-down"}
            size={24}
            color={COLORS.text}
          />
        </TouchableOpacity>
        {expandedSections.sender && (
          <View style={styles.card}>
            <TextInput
              style={styles.input}
              value={senderDetails.name}
              onChangeText={(text) => setSenderDetails(prev => ({ ...prev, name: text }))}
              placeholder="Full Name"
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              value={senderDetails.phone}
              onChangeText={(text) => setSenderDetails(prev => ({ ...prev, phone: text }))}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              value={senderDetails.address}
              onChangeText={(text) => setSenderDetails(prev => ({ ...prev, address: text }))}
              placeholder="Address"
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              value={senderDetails.state}
              onChangeText={(text) => setSenderDetails(prev => ({ ...prev, state: text }))}
              placeholder="State"
              placeholderTextColor="#999"
            />
          </View>
        )}

        {/* Receiver Details Section */}
        <TouchableOpacity 
          style={styles.sectionHeader} 
          onPress={() => toggleSection('receiver')}
        >
          <Text style={styles.sectionTitle}>Receiver Details</Text>
          <Ionicons
            name={expandedSections.receiver ? "chevron-up" : "chevron-down"}
            size={24}
            color={COLORS.text}
          />
        </TouchableOpacity>
        {expandedSections.receiver && (
          <View style={styles.card}>
            <TextInput
              style={styles.input}
              value={receiverDetails.name}
              onChangeText={(text) => setReceiverDetails(prev => ({ ...prev, name: text }))}
              placeholder="Full Name"
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              value={receiverDetails.phone}
              onChangeText={(text) => setReceiverDetails(prev => ({ ...prev, phone: text }))}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              value={receiverDetails.state}
              onChangeText={(text) => setReceiverDetails(prev => ({ ...prev, state: text }))}
              placeholder="State"
              placeholderTextColor="#999"
            />

            {/* Delivery Method Selection */}
            <View style={styles.methodSelector}>
              <TouchableOpacity
                style={[styles.methodButton, deliveryMethod === 'delivery' && styles.methodButtonActive]}
                onPress={() => setDeliveryMethod('delivery')}
              >
                <Text style={[styles.methodButtonText, deliveryMethod === 'delivery' && styles.methodButtonTextActive]}>
                  Delivery
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodButton, deliveryMethod === 'pickup' && styles.methodButtonActive]}
                onPress={() => setDeliveryMethod('pickup')}
              >
                <Text style={[styles.methodButtonText, deliveryMethod === 'pickup' && styles.methodButtonTextActive]}>
                  Pickup
                </Text>
              </TouchableOpacity>
            </View>

            {deliveryMethod === 'delivery' && (
              <>
                <TextInput
                  style={styles.input}
                  value={receiverDetails.address}
                  onChangeText={(text) => setReceiverDetails(prev => ({ ...prev, address: text }))}
                  placeholder="Delivery Address"
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={styles.input}
                  value={receiverDetails.landmark}
                  onChangeText={(text) => setReceiverDetails(prev => ({ ...prev, landmark: text }))}
                  placeholder="Landmark"
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={styles.input}
                  value={receiverDetails.locality}
                  onChangeText={(text) => setReceiverDetails(prev => ({ ...prev, locality: text }))}
                  placeholder="Locality"
                  placeholderTextColor="#999"
                />
              </>
            )}
          </View>
        )}

        {/* Delivery Schedule Section */}
        <TouchableOpacity 
          style={styles.sectionHeader} 
          onPress={() => toggleSection('schedule')}
        >
          <Text style={styles.sectionTitle}>Delivery Schedule</Text>
          <Ionicons
            name={expandedSections.schedule ? "chevron-up" : "chevron-down"}
            size={24}
            color={COLORS.text}
          />
        </TouchableOpacity>
        {expandedSections.schedule && (
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
              <Text style={styles.dateButtonText}>
                {selectedDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            {/* Vehicle Selection */}
            <View style={styles.vehicleSelector}>
              <TouchableOpacity
                style={[styles.vehicleButton, selectedVehicle === 'bike' && styles.vehicleButtonActive]}
                onPress={() => setSelectedVehicle('bike')}
              >
                <Ionicons name="bicycle" size={24} color={selectedVehicle === 'bike' ? '#fff' : '#666'} />
                <Text style={[styles.vehicleButtonText, selectedVehicle === 'bike' && styles.vehicleButtonTextActive]}>
                  Bike
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.vehicleButton, selectedVehicle === 'car' && styles.vehicleButtonActive]}
                onPress={() => setSelectedVehicle('car')}
              >
                <Ionicons name="car" size={24} color={selectedVehicle === 'car' ? '#fff' : '#666'} />
                <Text style={[styles.vehicleButtonText, selectedVehicle === 'car' && styles.vehicleButtonTextActive]}>
                  Car
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.vehicleButton, selectedVehicle === 'truck' && styles.vehicleButtonActive]}
                onPress={() => setSelectedVehicle('truck')}
              >
                <Ionicons name="bus" size={24} color={selectedVehicle === 'truck' ? '#fff' : '#666'} />
                <Text style={[styles.vehicleButtonText, selectedVehicle === 'truck' && styles.vehicleButtonTextActive]}>
                  Truck
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Items Section */}
        <TouchableOpacity 
          style={styles.sectionHeader} 
          onPress={() => toggleSection('items')}
        >
          <Text style={styles.sectionTitle}>Items ({items.length})</Text>
          <Ionicons
            name={expandedSections.items ? "chevron-up" : "chevron-down"}
            size={24}
            color={COLORS.text}
          />
        </TouchableOpacity>
        {expandedSections.items && items.length > 0 && (
          <View style={styles.card}>
            {items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={styles.itemActions}>
                      <TouchableOpacity 
                        style={styles.itemAction}
                        onPress={() => handleUpdateItem(index, {
                          quantity: item.quantity + 1
                        })}
                      >
                        <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.itemAction}
                        onPress={() => handleRemoveItem(index)}
                      >
                        <Ionicons name="trash-outline" size={24} color="#FF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.itemDetails}>
                    {item.category} - {item.subcategory}
                  </Text>
                  <View style={styles.itemSpecs}>
                    <Text style={styles.itemSpec}>
                      Qty: {item.quantity} • Weight: {item.weight}kg
                    </Text>
                    <Text style={styles.itemValue}>₦{(Number(item.value) * Number(item.quantity)).toLocaleString()}</Text>
                  </View>
                  {item.specialInstructions && (
                    <Text style={styles.itemNotes}>{item.specialInstructions}</Text>
                  )}
                </View>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Value</Text>
              <Text style={styles.totalValue}>
                ₦{items.reduce((sum, item) => 
                  sum + (Number(item.value) * Number(item.quantity)), 0
                ).toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={handleSubmit}>
          <Text style={styles.continueButtonText}>Continue to Checkout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// Update styles for a sleeker look
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const, // Type assertion to fix fontWeight
    color: COLORS.text,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: COLORS.text,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
    }),
  },
  methodSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
    backgroundColor: '#F9FAFB',
    padding: 4,
    borderRadius: 12,
  },
  methodButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  methodButtonActive: {
    backgroundColor: COLORS.primary,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  itemRow: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
    padding: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  itemDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  itemSpecs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  itemAction: {
    padding: 4,
  },
  itemSpec: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  itemValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.primary,
  },
  itemText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  itemValues: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  vehicleSelector: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  vehicleButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  vehicleButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500' as const,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    marginBottom: 12,
    borderRadius: 12,
  },
  itemNotes: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  methodButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500' as const,
  },
  methodButtonTextActive: {
    color: '#fff',
  },
  vehicleButtonText: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
    fontWeight: '500' as const,
  },
  vehicleButtonTextActive: {
    color: '#fff',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.primary,
  },
});
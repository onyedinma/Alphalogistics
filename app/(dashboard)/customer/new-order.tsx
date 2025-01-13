import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, Platform, Text, ScrollView, Modal, ActivityIndicator, Switch, TextInput } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StorageService } from '@/services/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ContactDetails } from '@/types';

type Vehicle = 'bike' | 'car' | 'van' | 'truck';

interface VehicleInfo {
  type: Vehicle;
  icon: string;
  description?: string;
  maxWeight?: number;
  maxDimensions?: string;
}

interface OrderFormState {
  vehicle: Vehicle | null;
  pickupDate: Date | null;
  sender: ContactDetails | null;
  receiver: ContactDetails | null;
}

interface DeliveryPreferences {
  acceptRTOCharges: boolean;
  acknowledgeRTOPolicy: boolean;
  deliveryAttemptPreferences: {
    preferredTimeSlots: string[];
    alternateContact?: string;
    alternateContactPhone?: string;
    leaveWithNeighbor: boolean;
    leaveAtDoorIfAbsent: boolean;
  };
}

interface IssueCategory {
  id: string;
  name: string;
  description: string;
  requiresPhoto: boolean;
  requiresComment: boolean;
}

const ISSUE_CATEGORIES: IssueCategory[] = [
  {
    id: 'damaged',
    name: 'Damaged Package',
    description: 'Package appears damaged during transit',
    requiresPhoto: true,
    requiresComment: true
  },
  {
    id: 'wrong_address',
    name: 'Wrong Address',
    description: 'Delivery address is incorrect or incomplete',
    requiresPhoto: false,
    requiresComment: true
  },
  {
    id: 'customer_unavailable',
    name: 'Customer Unavailable',
    description: 'Customer not available at delivery location',
    requiresPhoto: false,
    requiresComment: true
  }
];

interface DeliveryIssue {
  category: string;
  description: string;
  photoUri?: string;
  timestamp: Date;
  status: 'open' | 'resolved' | 'escalated';
}

const VEHICLES: VehicleInfo[] = [
  { 
    type: 'bike', 
    icon: 'bicycle-outline',
    maxWeight: 20,
    description: 'Best for small packages: Documents, small electronics, etc.'
  },
  { 
    type: 'car', 
    icon: 'car-outline',
    maxWeight: 100,
    description: 'Suitable for medium-sized items: Multiple boxes, furniture pieces, etc.'
  },
  { 
    type: 'van', 
    icon: 'car-sport-outline',
    maxWeight: 500,
    description: 'Ideal for big and bulky items: A refrigerator, A washing machine, etc.'
  },
  { 
    type: 'truck', 
    icon: 'bus-outline',
    maxWeight: 1000,
    description: 'Perfect for large deliveries: Multiple furniture items, commercial goods, etc.'
  }
];

const MIN_PICKUP_HOURS = 2; // Minimum hours from now for pickup
const MAX_PICKUP_DAYS = 14; // Maximum days in advance for pickup

const COST_PER_KM = {
  bike: 5,
  car: 10,
  van: 15,
  truck: 20
};

const BASE_COST = {
  bike: 100,
  car: 200,
  van: 400,
  truck: 800
};

const calculateDistance = async (pickup: string, delivery: string): Promise<{ distance: number; duration: number }> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
        pickup
      )}&destinations=${encodeURIComponent(delivery)}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    
    if (data.rows[0]?.elements[0]?.status === 'OK') {
      return {
        distance: data.rows[0].elements[0].distance.value / 1000, // Convert to km
        duration: data.rows[0].elements[0].duration.value / 60 // Convert to minutes
      };
    }
    throw new Error('Unable to calculate distance');
  } catch (error) {
    console.error('Error calculating distance:', error);
    return { distance: 0, duration: 0 };
  }
};

const recommendVehicle = (distance: number, totalWeight: number): Vehicle => {
  if (totalWeight > 500 || distance > 100) return 'truck';
  if (totalWeight > 100 || distance > 50) return 'van';
  if (totalWeight > 20 || distance > 20) return 'car';
  return 'bike';
};

const calculateDeliveryCost = (distance: number, vehicle: Vehicle): number => {
  const baseCost = BASE_COST[vehicle];
  const costPerKm = COST_PER_KM[vehicle];
  return baseCost + (distance * costPerKm);
};

const validateSenderDetails = (details: ContactDetails | null): boolean => {
  if (!details) return false;
  return !!(details.name && details.address && details.phone && details.state);
};

const validateReceiverDetails = (details: ContactDetails | null): boolean => {
  if (!details) return false;
  return !!(details.name && details.address && details.phone && details.state);
};

const validateDeliveryPreferences = (prefs: DeliveryPreferences): boolean => {
  if (prefs.acceptRTOCharges && !prefs.acknowledgeRTOPolicy) return false;
  return true;
};

// Add new error handling utility
const handleError = (error: any, context: string) => {
  console.error(`Error in ${context}:`, error);
  const message = error?.message || 'An unexpected error occurred';
  Alert.alert('Error', `${context}: ${message}. Please try again.`);
};

// Add validation for business hours
const validateBusinessHours = (date: Date): boolean => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const time = hours + minutes / 60;

  // Business hours: 8 AM to 6 PM
  if (time < 8 || time > 18) {
    Alert.alert(
      'Outside Business Hours',
      'Pickup time must be between 8:00 AM and 6:00 PM'
    );
    return false;
  }
  return true;
};

export default function NewOrder() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(null);
  const [senderDetails, setSenderDetails] = useState<ContactDetails | null>(null);
  const [receiverDetails, setReceiverDetails] = useState<ContactDetails | null>(null);
  const [deliveryPreferences, setDeliveryPreferences] = useState<DeliveryPreferences>({
    acceptRTOCharges: false,
    acknowledgeRTOPolicy: false,
    deliveryAttemptPreferences: {
      preferredTimeSlots: [],
      leaveWithNeighbor: false,
      leaveAtDoorIfAbsent: false
    }
  });
  const [issues, setIssues] = useState<DeliveryIssue[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [distanceInfo, setDistanceInfo] = useState<{ distance: number; duration: number }>({ distance: 0, duration: 0 });
  const [estimatedCost, setEstimatedCost] = useState<number>(0);

  const params = useLocalSearchParams<{
    senderName?: string;
    senderAddress?: string;
    senderState?: string;
    senderPhone?: string;
    receiverName?: string;
    receiverAddress?: string;
    receiverState?: string;
    receiverPhone?: string;
  }>();

  // Define the order form state and its setter
  const [orderFormState, setOrderFormState] = useState<OrderFormState>({
    vehicle: null,
    pickupDate: null,
    sender: null,
    receiver: null
  });

  // Add auto-save functionality
  useEffect(() => {
    const saveChanges = async () => {
      if (!hasUnsavedChanges) return;
      
      try {
        await Promise.all([
          StorageService.updateOrderSection('locations', {
            pickup: {
              address: senderDetails?.address || '',
              contactName: senderDetails?.name || '',
              contactPhone: senderDetails?.phone || '',
              alternatePhone: senderDetails?.alternatePhone,
              instructions: senderDetails?.deliveryInstructions,
              coordinates: undefined
            },
            delivery: {
              address: receiverDetails?.address || '',
              contactName: receiverDetails?.name || '',
              contactPhone: receiverDetails?.phone || '',
              alternatePhone: receiverDetails?.alternatePhone,
              instructions: receiverDetails?.deliveryInstructions,
              coordinates: undefined
            }
          }),
          StorageService.updateOrderSection('delivery', {
            scheduledPickup: pickupDate?.toISOString() || '',
            vehicle: {
              type: selectedVehicle || 'bike',
            },
            preferences: {
              timeSlots: deliveryPreferences.deliveryAttemptPreferences.preferredTimeSlots,
              leaveWithNeighbor: deliveryPreferences.deliveryAttemptPreferences.leaveWithNeighbor,
              leaveAtDoor: deliveryPreferences.deliveryAttemptPreferences.leaveAtDoorIfAbsent
            }
          })
        ]);
        setHasUnsavedChanges(false);
      } catch (error) {
        handleError(error, 'Auto-save failed');
      }
    };

    const timer = setTimeout(saveChanges, 2000);
    return () => clearTimeout(timer);
  }, [senderDetails, receiverDetails, selectedVehicle, pickupDate, deliveryPreferences, hasUnsavedChanges]);

  // Enhanced loadDetails with better error handling
  const loadDetails = async () => {
    try {
      setIsLoading(true);
      const orderDraft = await StorageService.getOrderDraft();
      
      if (!orderDraft) {
        console.log('No existing draft found, starting fresh');
        return;
      }

      // Load locations data with validation
      if (orderDraft.locations) {
        const { pickup, delivery } = orderDraft.locations;
        if (pickup?.contactName && pickup?.address && pickup?.contactPhone) {
          setSenderDetails({
            name: pickup.contactName,
            address: pickup.address,
            phone: pickup.contactPhone,
            state: params.senderState || '',
            alternatePhone: pickup.alternatePhone,
            deliveryInstructions: pickup.instructions,
          });
        }
        if (delivery?.contactName && delivery?.address && delivery?.contactPhone) {
          setReceiverDetails({
            name: delivery.contactName,
            address: delivery.address,
            phone: delivery.contactPhone,
            state: params.receiverState || '',
            alternatePhone: delivery.alternatePhone,
            deliveryInstructions: delivery.instructions,
          });
        }
      }

      // Enhanced delivery data loading with validation
      if (orderDraft.delivery) {
        const { scheduledPickup, vehicle, preferences, rto } = orderDraft.delivery;
        
        if (scheduledPickup) {
          const pickupDateObj = new Date(scheduledPickup);
          if (!isNaN(pickupDateObj.getTime()) && validatePickupDate(pickupDateObj)) {
            setPickupDate(pickupDateObj);
          }
        }

        if (vehicle?.type && VEHICLES.find(v => v.type === vehicle.type)) {
          setSelectedVehicle(vehicle.type as Vehicle);
        }

        setDeliveryPreferences({
          acceptRTOCharges: rto?.acceptCharges || false,
          acknowledgeRTOPolicy: rto?.acknowledgePolicy || false,
          deliveryAttemptPreferences: {
            preferredTimeSlots: preferences?.timeSlots || [],
            leaveWithNeighbor: preferences?.leaveWithNeighbor || false,
            leaveAtDoorIfAbsent: preferences?.leaveAtDoor || false,
            alternateContact: rto?.alternateContact || undefined,
            alternateContactPhone: rto?.alternatePhone || undefined,
          },
        });
      }
    } catch (error) {
      handleError(error, 'Failed to load saved details');
    } finally {
      setIsLoading(false);
    }
  };

  // Add vehicle weight validation
  const validateVehicleWeight = async (): Promise<boolean> => {
    try {
      const orderDraft = await StorageService.getOrderDraft();
      if (!orderDraft?.items || !selectedVehicle) return true;

      const totalWeight = orderDraft.items.reduce((sum, item) => {
        return sum + (parseFloat(item.weight) * parseInt(item.quantity));
      }, 0);

      const selectedVehicleInfo = VEHICLES.find(v => v.type === selectedVehicle);
      if (!selectedVehicleInfo?.maxWeight) return true;

      if (totalWeight > selectedVehicleInfo.maxWeight) {
        Alert.alert(
          'Vehicle Capacity Exceeded',
          `The total weight of items (${totalWeight.toFixed(2)}kg) exceeds the maximum capacity of the selected vehicle (${selectedVehicleInfo.maxWeight}kg). Please select a larger vehicle.`
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating vehicle weight:', error);
      return true; // Allow to proceed if validation fails
    }
  };

  const validatePickupDate = (date: Date): boolean => {
    const now = new Date();
    const minTime = new Date(now.getTime() + MIN_PICKUP_HOURS * 60 * 60 * 1000);
    const maxTime = new Date(now.getTime() + MAX_PICKUP_DAYS * 24 * 60 * 60 * 1000);

    if (date < minTime) {
      Alert.alert(
        'Invalid Date',
        `Pickup must be at least ${MIN_PICKUP_HOURS} hours from now.`
      );
      return false;
    }

    if (date > maxTime) {
      Alert.alert(
        'Invalid Date',
        `Pickup cannot be more than ${MAX_PICKUP_DAYS} days in advance.`
      );
      return false;
    }

    return true;
  };

  // Enhanced handleContinue with better error handling and validation
  const handleContinue = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Enhanced validation
      if (!validateSenderDetails(senderDetails)) {
        Alert.alert('Missing Information', 'Please complete all sender details');
        return;
      }

      if (!validateReceiverDetails(receiverDetails)) {
        Alert.alert('Missing Information', 'Please complete all receiver details');
        return;
      }

      if (!selectedVehicle) {
        Alert.alert('Vehicle Required', 'Please select a delivery vehicle');
        return;
      }

      if (!pickupDate) {
        Alert.alert('Pickup Date Required', 'Please select a pickup date');
        return;
      }

      if (!validatePickupDate(pickupDate) || !validateBusinessHours(pickupDate)) {
        return;
      }

      if (!validateDeliveryPreferences(deliveryPreferences)) {
        Alert.alert('Delivery Preferences', 'Please acknowledge RTO policy if accepting RTO charges');
        return;
      }

      if (!(await validateVehicleWeight())) {
        return;
      }

      // Save data with enhanced error handling
      await Promise.all([
        StorageService.updateOrderSection('locations', {
          pickup: {
            address: senderDetails!.address,
            contactName: senderDetails!.name,
            contactPhone: senderDetails!.phone,
            alternatePhone: senderDetails!.alternatePhone,
            instructions: senderDetails!.deliveryInstructions,
            coordinates: undefined
          },
          delivery: {
            address: receiverDetails!.address,
            contactName: receiverDetails!.name,
            contactPhone: receiverDetails!.phone,
            alternatePhone: receiverDetails!.alternatePhone,
            instructions: receiverDetails!.deliveryInstructions,
            coordinates: undefined
          }
        }),
        StorageService.updateOrderSection('delivery', {
          scheduledPickup: pickupDate.toISOString(),
          vehicle: {
            type: selectedVehicle,
            maxWeight: VEHICLES.find(v => v.type === selectedVehicle)?.maxWeight,
          },
          preferences: {
            timeSlots: deliveryPreferences.deliveryAttemptPreferences.preferredTimeSlots,
            leaveWithNeighbor: deliveryPreferences.deliveryAttemptPreferences.leaveWithNeighbor,
            leaveAtDoor: deliveryPreferences.deliveryAttemptPreferences.leaveAtDoorIfAbsent,
            specialInstructions: deliveryPreferences.deliveryAttemptPreferences.alternateContact,
          },
          rto: {
            acceptCharges: deliveryPreferences.acceptRTOCharges,
            acknowledgePolicy: deliveryPreferences.acknowledgeRTOPolicy,
            alternateContact: deliveryPreferences.deliveryAttemptPreferences.alternateContact,
            alternatePhone: deliveryPreferences.deliveryAttemptPreferences.alternateContactPhone,
          },
        })
      ]);

      router.push('/(dashboard)/customer/item-details');
    } catch (error) {
      handleError(error, 'Failed to save pickup details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate && validatePickupDate(selectedDate)) {
      setTempSelectedDate(selectedDate);
      setShowConfirmModal(true);
    }
  };

  const handleConfirmDate = () => {
    if (tempSelectedDate) {
      setPickupDate(tempSelectedDate);
    }
    setShowConfirmModal(false);
  };

  const handleCancelDate = () => {
    setTempSelectedDate(null);
    setShowConfirmModal(false);
  };

  const handleChangeSender = () => {
    router.push({
      pathname: '/(dashboard)/customer/sender',
      params: {
        ...(senderDetails && {
          name: senderDetails.name,
          address: senderDetails.address,
          state: senderDetails.state,
          phone: senderDetails.phone
        }),
        ...(receiverDetails && {
          receiverName: receiverDetails.name,
          receiverAddress: receiverDetails.address,
          receiverState: receiverDetails.state,
          receiverPhone: receiverDetails.phone
        })
      }
    });
  };

  const handleChangeReceiver = () => {
    router.push({
      pathname: '/(dashboard)/customer/receiver',
      params: {
        ...(receiverDetails && {
          name: receiverDetails.name,
          address: receiverDetails.address,
          state: receiverDetails.state,
          phone: receiverDetails.phone
        }),
        ...(senderDetails && {
          senderName: senderDetails.name,
          senderAddress: senderDetails.address,
          senderState: senderDetails.state,
          senderPhone: senderDetails.phone
        })
      }
    });
  };

  const handleAddReceiver = () => {
    router.push('/(dashboard)/customer/receiver-details');
  };

  const getVehicleDescription = (type: Vehicle) => {
    const vehicle = VEHICLES.find(v => v.type === type);
    return vehicle?.description || 'Your selected vehicle would be used in delivering your item to its destination.';
  };

  // Add function to handle delivery issues
  const handleAddIssue = async (
    category: string,
    description: string,
    photoUri?: string
  ) => {
    try {
      const newIssue: DeliveryIssue = {
        category,
        description,
        photoUri,
        timestamp: new Date(),
        status: 'open'
      };

      setIssues(prev => [...prev, newIssue]);
    } catch (error) {
      console.error('Error adding issue:', error);
      Alert.alert('Error', 'Failed to add delivery issue');
    }
  };

  // Add function to calculate estimated RTO charges
  const calculateRTOCharges = () => {
    if (!selectedVehicle) return 0;
    
    // Base RTO charges based on vehicle type
    const baseCharges = {
      bike: 500,
      car: 1000,
      van: 2000,
      truck: 3000
    };

    return baseCharges[selectedVehicle];
  };

  // Add effect for distance and cost calculation
  useEffect(() => {
    const updateDistanceAndCost = async () => {
      if (senderDetails?.address && receiverDetails?.address) {
        try {
          const distance = await calculateDistance(senderDetails.address, receiverDetails.address);
          setDistanceInfo(distance);
          
          // Get total weight from items
          const orderDraft = await StorageService.getOrderDraft();
          const totalWeight = orderDraft?.items?.reduce((sum, item) => 
            sum + (parseFloat(item.weight) * parseInt(item.quantity)), 0) || 0;
          
          // Get recommended vehicle based on distance and weight
          const recommendedVehicle = recommendVehicle(distance.distance, totalWeight);
          if (!selectedVehicle) {
            setSelectedVehicle(recommendedVehicle);
          }
          
          // Calculate cost based on selected or recommended vehicle
          const cost = calculateDeliveryCost(distance.distance, selectedVehicle || recommendedVehicle);
          setEstimatedCost(cost);

          // Update pricing in storage
          await StorageService.updateOrderSection('pricing', {
            itemValue: orderDraft?.pricing?.itemValue || 0,
            deliveryFee: cost,
            total: (orderDraft?.pricing?.itemValue || 0) + cost,
            insurance: orderDraft?.pricing?.insurance
          });

          // Show recommendation if different from selected
          if (selectedVehicle && selectedVehicle !== recommendedVehicle) {
            Alert.alert(
              'Vehicle Recommendation',
              `Based on the distance (${distance.distance.toFixed(1)}km) and weight (${totalWeight}kg), we recommend using a ${recommendedVehicle}. Would you like to switch?`,
              [
                { text: 'Keep Current', style: 'cancel' },
                { 
                  text: 'Switch Vehicle', 
                  onPress: () => setSelectedVehicle(recommendedVehicle)
                }
              ]
            );
          }
        } catch (error) {
          console.error('Error updating distance and cost:', error);
        }
      }
    };

    updateDistanceAndCost();
  }, [senderDetails?.address, receiverDetails?.address, selectedVehicle]);

  // Add useEffect to load data when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        const orderDraft = await StorageService.getOrderDraft();
        if (orderDraft) {
          const mappedState: OrderFormState = {
            vehicle: orderDraft?.delivery?.vehicle?.type || null,
            pickupDate: orderDraft?.delivery?.scheduledPickup ? new Date(orderDraft.delivery.scheduledPickup) : null,
            sender: orderDraft?.locations?.pickup ? {
              name: orderDraft.locations.pickup.contactName,
              address: orderDraft.locations.pickup.address,
              state: '',  // Add default state if not available
              phone: orderDraft.locations.pickup.contactPhone,
              alternatePhone: orderDraft.locations.pickup.alternatePhone,
              deliveryInstructions: orderDraft.locations.pickup.instructions
            } : null,
            receiver: orderDraft?.locations?.delivery ? {
              name: orderDraft.locations.delivery.contactName,
              address: orderDraft.locations.delivery.address,
              state: '',  // Add default state if not available
              phone: orderDraft.locations.delivery.contactPhone,
              alternatePhone: orderDraft.locations.delivery.alternatePhone,
              deliveryInstructions: orderDraft.locations.delivery.instructions
            } : null
          };
          setOrderFormState(mappedState);
        }
      } catch (error) {
        handleError(error, 'Loading order draft');
      }
    };
    loadData();
  }, []);

  // Update the saveData function to match the expected type
  const saveData = async (updatedState: Partial<OrderFormState>) => {
    try {
      const currentDraft = await StorageService.getOrderDraft();
      const newDraft = { ...currentDraft, ...updatedState };
      await StorageService.updateOrderSection('orderDetails', {
        ...newDraft,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleError(error, 'Saving order draft');
    }
  };

  // Provide explicit type for prev parameter
  const handleSenderChange = (newSender: ContactDetails) => {
    setOrderFormState((prev: OrderFormState) => ({ ...prev, sender: newSender }));
    saveData({ sender: newSender });
  };

  // Provide explicit type for prev parameter
  const handleReceiverChange = (newReceiver: ContactDetails) => {
    setOrderFormState((prev: OrderFormState) => ({ ...prev, receiver: newReceiver }));
    saveData({ receiver: newReceiver });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Pickup Details',
          headerShadowVisible: false,
        }}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      )}

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule Pickup Date</Text>
          <TouchableOpacity 
            style={styles.datePickerButton}
            onPress={() => setShowPicker(true)}
          >
            <Ionicons name="calendar-outline" size={24} color="#666" />
            <Text style={styles.datePickerButtonText}>
              {pickupDate ? pickupDate.toLocaleDateString() : 'Select Date'}
            </Text>
          </TouchableOpacity>
          {pickupDate && (
            <Text style={styles.selectedDateText}>
              Selected: {pickupDate.toLocaleDateString()}
            </Text>
          )}
        </View>

        {showPicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={tempSelectedDate || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        <Modal
          visible={showConfirmModal}
          transparent
          animationType="fade"
          onRequestClose={handleCancelDate}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Schedule pickup</Text>
              <Text style={styles.modalText}>
                ALPHALO is scheduled to pickup your item on: {tempSelectedDate?.toLocaleDateString()}. Would you like to proceed?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonOutline]}
                  onPress={handleCancelDate}
                >
                  <Text style={styles.modalButtonOutlineText}>No, Thanks</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonFilled]}
                  onPress={handleConfirmDate}
                >
                  <Text style={styles.modalButtonFilledText}>Yes, please</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Vehicle Type</Text>
          {distanceInfo.distance > 0 && (
            <View style={styles.distanceInfo}>
              <Text style={styles.distanceText}>
                Estimated Distance: {distanceInfo.distance.toFixed(1)}km
              </Text>
              <Text style={styles.durationText}>
                Estimated Duration: {Math.ceil(distanceInfo.duration)}min
              </Text>
              <Text style={styles.costText}>
                Delivery Fee: ₦{estimatedCost.toLocaleString()}
              </Text>
            </View>
          )}
          <View style={styles.vehicleGrid}>
            {VEHICLES.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.type}
                style={[
                  styles.vehicleCard,
                  selectedVehicle === vehicle.type && styles.selectedVehicle,
                ]}
                onPress={() => setSelectedVehicle(vehicle.type)}
              >
                <Ionicons
                  name={vehicle.icon as keyof typeof Ionicons.glyphMap}
                  size={28}
                  color={selectedVehicle === vehicle.type ? '#007AFF' : '#666'}
                />
                <Text style={[
                  styles.vehicleText,
                  selectedVehicle === vehicle.type && styles.selectedVehicleText
                ]}>
                  {vehicle.type}
                </Text>
                <Text style={[
                  styles.vehicleMaxWeight,
                  selectedVehicle === vehicle.type && styles.selectedVehicleText
                ]}>
                  {vehicle.maxWeight}kg
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedVehicle && (
            <View style={styles.vehicleInfo}>
              <Ionicons name="information-circle-outline" size={20} color="#666" />
              <Text style={styles.vehicleInfoText}>
                {getVehicleDescription(selectedVehicle)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsTitle}>Sender's Details</Text>
            {senderDetails && (
              <TouchableOpacity 
                style={styles.changeButton}
                onPress={handleChangeSender}
              >
                <Text style={styles.changeButtonText}>Change Sender</Text>
              </TouchableOpacity>
            )}
          </View>
          {senderDetails ? (
            <View style={styles.detailsContent}>
              <View style={styles.detailsIcon}>
                <Ionicons name="person-outline" size={24} color="#4A90E2" />
              </View>
              <View style={styles.detailsInfo}>
                <Text style={styles.detailsName}>{senderDetails.name}</Text>
                <Text style={styles.detailsAddress}>{senderDetails.address}</Text>
                <Text style={styles.detailsPhone}>{senderDetails.phone}</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleChangeSender}
            >
              <Text style={styles.addButtonText}>Add Sender</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsTitle}>Receiver's Details</Text>
            {receiverDetails && (
              <TouchableOpacity 
                style={styles.changeButton}
                onPress={handleChangeReceiver}
              >
                <Text style={styles.changeButtonText}>Change Receiver</Text>
              </TouchableOpacity>
            )}
          </View>
          {receiverDetails ? (
            <View style={styles.detailsContent}>
              <View style={styles.detailsIcon}>
                <Ionicons name="person-outline" size={24} color="#4A90E2" />
              </View>
              <View style={styles.detailsInfo}>
                <Text style={styles.detailsName}>{receiverDetails.name}</Text>
                <Text style={styles.detailsAddress}>{receiverDetails.address}</Text>
                <Text style={styles.detailsPhone}>{receiverDetails.phone}</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddReceiver}
            >
              <Text style={styles.addButtonText}>Add Receiver</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Preferences</Text>
          
          <View style={styles.preferenceSection}>
            <Text style={styles.preferenceTitle}>Preferred Time Slots</Text>
            <View style={styles.timeSlots}>
              {['Morning (9AM-12PM)', 'Afternoon (12PM-4PM)', 'Evening (4PM-8PM)'].map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.timeSlot,
                    deliveryPreferences.deliveryAttemptPreferences.preferredTimeSlots.includes(slot) && 
                    styles.timeSlotSelected
                  ]}
                  onPress={() => {
                    setDeliveryPreferences(prev => ({
                      ...prev,
                      deliveryAttemptPreferences: {
                        ...prev.deliveryAttemptPreferences,
                        preferredTimeSlots: prev.deliveryAttemptPreferences.preferredTimeSlots.includes(slot)
                          ? prev.deliveryAttemptPreferences.preferredTimeSlots.filter(s => s !== slot)
                          : [...prev.deliveryAttemptPreferences.preferredTimeSlots, slot]
                      }
                    }));
                  }}
                >
                  <Text style={[
                    styles.timeSlotText,
                    deliveryPreferences.deliveryAttemptPreferences.preferredTimeSlots.includes(slot) && 
                    styles.timeSlotTextSelected
                  ]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.rtoSection}>
            <Text style={styles.rtoTitle}>Return to Origin (RTO) Information</Text>
            
            <View style={styles.rtoInfo}>
              <View style={styles.rtoCharges}>
                <Text style={styles.rtoChargesLabel}>Estimated RTO Charges:</Text>
                <Text style={styles.rtoChargesAmount}>₦{calculateRTOCharges().toLocaleString()}</Text>
              </View>
              <Text style={styles.rtoNote}>
                *RTO charges apply only if the package cannot be delivered after 3 attempts
              </Text>
            </View>

            <View style={styles.acknowledgmentContainer}>
              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => setDeliveryPreferences(prev => ({
                  ...prev,
                  acceptRTOCharges: !prev.acceptRTOCharges
                }))}
              >
                <View style={[
                  styles.checkbox,
                  deliveryPreferences.acceptRTOCharges && styles.checkboxChecked
                ]}>
                  {deliveryPreferences.acceptRTOCharges && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  I understand and accept the RTO charges if applicable
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      <TouchableOpacity 
        style={[
          styles.continueButton,
          (!selectedVehicle || !pickupDate || !senderDetails || !receiverDetails) && 
          styles.continueButtonDisabled
        ]} 
        onPress={handleContinue}
        disabled={!selectedVehicle || !pickupDate || !senderDetails || !receiverDetails || isLoading}
      >
        <Text style={styles.continueButtonText}>
          {isLoading ? 'Processing...' : 'Continue'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#000',
    marginBottom: 16,
  },
  dateButton: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  vehicleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  vehicleCard: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E3E3E3',
  },
  selectedVehicle: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  vehicleText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  selectedVehicleText: {
    color: '#007AFF',
  },
  vehicleMaxWeight: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  vehicleInfo: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'flex-start',
  },
  vehicleInfoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    marginLeft: 8,
    color: '#333',
    fontSize: 14,
  },
  detailsCard: {
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
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  changeButton: {
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  changeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  detailsContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailsIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailsInfo: {
    flex: 1,
  },
  detailsName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  detailsAddress: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  detailsPhone: {
    fontSize: 14,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonOutline: {
    backgroundColor: '#F5F5F5',
  },
  modalButtonFilled: {
    backgroundColor: '#000',
  },
  modalButtonOutlineText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonFilledText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  continueButtonDisabled: {
    backgroundColor: '#999',
  },
  acknowledgmentContainer: {
    marginTop: 16,
    gap: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E3E3E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  policyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E3E3E3',
  },
  policyButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3E3E3',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  preferenceSection: {
    marginTop: 20,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  timeSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timeSlotSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#666',
  },
  timeSlotTextSelected: {
    color: '#007AFF',
  },
  optionButton: {
    marginBottom: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  alternateInput: {
    marginTop: 8,
    marginLeft: 36,
    padding: 8,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  rtoSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  rtoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  rtoInfo: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  rtoCharges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rtoChargesLabel: {
    fontSize: 14,
    color: '#666',
  },
  rtoChargesAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  rtoNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3E3E3',
  },
  datePickerButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  selectedDateText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  vehicleScrollContainer: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 12,
  },
  distanceInfo: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  durationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  costText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});


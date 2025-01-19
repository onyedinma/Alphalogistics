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
import { GOOGLE_MAPS_API_KEY, MAPS_CONFIG } from '@/config/maps';

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

const MIN_PICKUP_HOURS = 2;
const MAX_PICKUP_DAYS = 14;

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

const calculateDistance = async (origin: string, destination: string) => {
  try {
    const response = await fetch(
      `${MAPS_CONFIG.DISTANCE_MATRIX_BASE_URL}?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    
    if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
      const { distance, duration } = data.rows[0].elements[0];
      return {
        distance: distance.value / 1000, // Convert to kilometers
        duration: duration.value / 60 // Convert to minutes
      };
    }
    throw new Error('Could not calculate distance');
  } catch (error) {
    console.error('Error calculating distance:', error);
    return { distance: 0, duration: 0 };
  }
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [distanceInfo, setDistanceInfo] = useState<{ distance: number; duration: number }>({ 
    distance: 0, 
    duration: 0 
  });
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

  useEffect(() => {
    loadSavedData();
  }, []);

  useEffect(() => {
    const updateDistance = async () => {
      if (senderDetails?.address && receiverDetails?.address) {
        const result = await calculateDistance(
          `${senderDetails.address}, ${senderDetails.state}, Nigeria`,
          `${receiverDetails.address}, ${receiverDetails.state}, Nigeria`
        );
        setDistanceInfo(result);
        if (selectedVehicle && result.distance > 0) {
          const cost = BASE_COST[selectedVehicle] + (COST_PER_KM[selectedVehicle] * result.distance);
          setEstimatedCost(Math.ceil(cost));
        }
      }
    };

    updateDistance();
  }, [senderDetails?.address, receiverDetails?.address, selectedVehicle]);

  const loadSavedData = async () => {
    try {
      const savedData = await StorageService.getOrderDraft();
      if (savedData) {
        if (savedData.delivery?.vehicle) {
          setSelectedVehicle(savedData.delivery.vehicle as Vehicle);
        }
        if (savedData.delivery?.scheduledPickup) {
          setPickupDate(new Date(savedData.delivery.scheduledPickup));
        }
        if (savedData.sender) {
          setSenderDetails(savedData.sender);
        }
        if (savedData.receiver) {
          setReceiverDetails(savedData.receiver);
        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  // Calculate estimated cost based on vehicle type
  const calculateDeliveryCost = (vehicle: Vehicle) => {
    // Use base cost for now since we can't calculate distance
    const cost = BASE_COST[vehicle];
    setEstimatedCost(cost);
  };

  const handleVehicleSelect = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    calculateDeliveryCost(vehicle);
    setHasUnsavedChanges(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      if (validatePickupDate(selectedDate)) {
        setTempSelectedDate(selectedDate);
        setShowConfirmModal(true);
      }
    }
  };

  const validatePickupDate = (date: Date): boolean => {
    const now = new Date();
    const selectedDateTime = date.getTime();
    const minDateTime = now.getTime() + (MIN_PICKUP_HOURS * 60 * 60 * 1000);

    // For same day pickups, only check if it's at least MIN_PICKUP_HOURS ahead
    if (date.toDateString() === now.toDateString()) {
      if (selectedDateTime < minDateTime) {
        Alert.alert(
          'Invalid Time',
          `Pickup must be at least ${MIN_PICKUP_HOURS} hours from now.`
        );
        return false;
      }
      return validateBusinessHours(date);
    }

    // For future dates
    const maxTime = new Date(now.getTime() + MAX_PICKUP_DAYS * 24 * 60 * 60 * 1000);
    if (date > maxTime) {
      Alert.alert(
        'Invalid Date',
        `Pickup cannot be more than ${MAX_PICKUP_DAYS} days in advance.`
      );
      return false;
    }

    return validateBusinessHours(date);
  };

  const validateBusinessHours = (date: Date): boolean => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const time = hours + minutes / 60;

    if (time < 8 || time > 18) {
      Alert.alert(
        'Outside Business Hours',
        'Pickup time must be between 8:00 AM and 6:00 PM'
      );
      return false;
    }
    return true;
  };

  const handleContinue = async () => {
    if (!selectedVehicle || !pickupDate || !senderDetails || !receiverDetails) {
      Alert.alert('Missing Information', 'Please fill in all required fields before continuing.');
      return;
    }

    try {
      setIsLoading(true);
      await StorageService.saveOrderDraft({
        delivery: {
          scheduledPickup: pickupDate.toISOString(),
          vehicle: selectedVehicle,
          fee: estimatedCost
        },
        sender: senderDetails,
        receiver: {
          ...receiverDetails,
          deliveryMethod: 'delivery'
        },
        locations: {
          pickup: {
            address: senderDetails.address,
            state: senderDetails.state,
            city: '',
            postalCode: '',
            country: 'Nigeria',
            instructions: ''
          },
          delivery: {
            address: receiverDetails.address,
            state: receiverDetails.state,
            city: '',
            postalCode: '',
            country: 'Nigeria',
            instructions: ''
          }
        }
      });
      router.push('/(dashboard)/customer/item-details');
    } catch (error) {
      console.error('Error saving order details:', error);
      Alert.alert('Error', 'Failed to save order details. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
        })
      }
    });
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Schedule pick-up date</Text>
            <TouchableOpacity onPress={() => setShowPicker(true)}>
              <Ionicons name="pencil-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.datePickerButton}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.datePickerButtonText}>
              {pickupDate ? pickupDate.toLocaleDateString() : 'Select Date'}
            </Text>
          </TouchableOpacity>
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
          onRequestClose={() => setShowConfirmModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Confirm Pickup Date</Text>
              <Text style={styles.modalText}>
                ALPHALO is scheduled to pickup your item on: {tempSelectedDate?.toLocaleDateString()}
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonOutline]}
                  onPress={() => {
                    setTempSelectedDate(null);
                    setShowConfirmModal(false);
                  }}
                >
                  <Text style={styles.modalButtonOutlineText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonFilled]}
                  onPress={() => {
                    if (tempSelectedDate) {
                      setPickupDate(tempSelectedDate);
                      setHasUnsavedChanges(true);
                    }
                    setShowConfirmModal(false);
                  }}
                >
                  <Text style={styles.modalButtonFilledText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Pick-up Vehicle</Text>
          <View style={styles.vehicleGrid}>
            {VEHICLES.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.type}
                style={[
                  styles.vehicleCard,
                  selectedVehicle === vehicle.type && styles.selectedVehicle,
                ]}
                onPress={() => handleVehicleSelect(vehicle.type)}
              >
                <View style={styles.vehicleIconContainer}>
                  <Ionicons
                    name={vehicle.icon as keyof typeof Ionicons.glyphMap}
                    size={24}
                    color={selectedVehicle === vehicle.type ? '#000' : '#666'}
                  />
                </View>
                <Text style={[
                  styles.vehicleText,
                  selectedVehicle === vehicle.type && styles.selectedVehicleText
                ]}>
                  {vehicle.type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedVehicle && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#666" />
              <Text style={styles.infoText}>
                Your selected vehicle would be used in delivering your item to its destination.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.contactHeader}>
            <View style={styles.contactTitleContainer}>
              <Ionicons name="business-outline" size={24} color="#1A1A1A" />
              <Text style={styles.contactTitle}>Sender's Details</Text>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleChangeSender}
            >
              <Text style={styles.addButtonText}>Add Sender</Text>
            </TouchableOpacity>
          </View>
          {senderDetails && (
            <View style={styles.contactDetails}>
              <Text style={styles.contactName}>{senderDetails.name}</Text>
              <Text style={styles.contactInfo}>{senderDetails.address}</Text>
              <Text style={styles.contactInfo}>{senderDetails.phone}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.contactHeader}>
            <View style={styles.contactTitleContainer}>
              <Ionicons name="business-outline" size={24} color="#1A1A1A" />
              <Text style={styles.contactTitle}>Receiver's Details</Text>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleChangeReceiver}
            >
              <Text style={styles.addButtonText}>Add Receiver</Text>
            </TouchableOpacity>
          </View>
          {receiverDetails && (
            <View style={styles.contactDetails}>
              <Text style={styles.contactName}>{receiverDetails.name}</Text>
              <Text style={styles.contactInfo}>{receiverDetails.address}</Text>
              <Text style={styles.contactInfo}>{receiverDetails.phone}</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
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
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F9',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  datePickerButton: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  datePickerButtonText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  vehicleCard: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  selectedVehicle: {
    backgroundColor: '#E8E8E8',
  },
  vehicleIconContainer: {
    marginBottom: 4,
  },
  vehicleText: {
    fontSize: 12,
    color: '#666666',
    textTransform: 'lowercase',
  },
  selectedVehicleText: {
    color: '#000000',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#666666',
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  contactDetails: {
    backgroundColor: '#F8FAFB',
    padding: 12,
    borderRadius: 8,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  continueButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
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
});

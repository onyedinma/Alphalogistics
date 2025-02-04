import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Text, Linking } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PhoneInput, { ICountry } from 'react-native-international-phone-number';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Contacts from 'expo-contacts';

interface ContactDetails {
  name: string;
  streetNumber: string;
  landmark: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  address: string;
  phone: string;
  deliveryMethod: 'pickup' | 'delivery';
  pickupCenter?: string;
  specialInstructions?: string;
}

interface OrderDraft {
  receiver?: ContactDetails;
  sender?: {
    name: string;
    address: string;
    phone: string;
  };
  selectedVehicle?: string;
  pickupDate?: string;
}

interface FormErrors {
  [key: string]: string | undefined;
}

export default function ReceiverDetails() {
  const params = useLocalSearchParams<{
    name?: string;
    address?: string;
    phone?: string;
    senderName?: string;
    senderAddress?: string;
    senderPhone?: string;
    selectedVehicle?: string;
    pickupDate?: string;
    returnFromAddressSearch?: string;
    selectedAddress?: string;
    selectedState?: string;
    selectedCountry?: string;
    selectedStreetNumber?: string;
    selectedLocality?: string;
    selectedCity?: string;
    selectedPostalCode?: string;
    showManualEntry?: string;
    selectedLandmark?: string;
  }>();

  const [formData, setFormData] = useState<ContactDetails>({
    name: '',
    streetNumber: '',
    landmark: '',
    locality: '',
    city: '',
    state: '',
    pincode: '',
    address: '',
    phone: '',
    deliveryMethod: 'pickup',
    pickupCenter: '',
    specialInstructions: ''
  });

  const [selectedCountry, setSelectedCountry] = useState<ICountry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Load saved data when component mounts
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedOrderDraft = await AsyncStorage.getItem('orderDraft');
        if (savedOrderDraft) {
          const parsedDraft = JSON.parse(savedOrderDraft);
          if (parsedDraft.receiver) {
            setFormData(prev => ({
              ...prev,
              ...parsedDraft.receiver
            }));
          }
        }

        // After loading from storage, apply any params if they exist
        if (params.name || params.address || params.phone) {
          setFormData(prev => ({
            ...prev,
            name: params.name || prev.name,
            address: params.address || prev.address,
            phone: params.phone || prev.phone
          }));
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
        Alert.alert('Error', 'Failed to load saved data');
      }
    };

    loadSavedData();
  }, [params.name, params.address, params.phone]);

  // Save form data whenever it changes
  useEffect(() => {
    const saveFormData = async () => {
      try {
        const savedOrderDraft = await AsyncStorage.getItem('orderDraft');
        const currentDraft = savedOrderDraft ? JSON.parse(savedOrderDraft) : {};
        
        await AsyncStorage.setItem('orderDraft', JSON.stringify({
          ...currentDraft,
          receiver: formData
        }));
      } catch (error) {
        console.error('Error saving form data:', error);
      }
    };

    // Only save if we have at least one field filled
    if (formData.name || formData.address || formData.state || formData.phone) {
      saveFormData();
    }
  }, [formData]);

  // Handle address search results
  useEffect(() => {
    if (params.returnFromAddressSearch === 'true' && params.selectedAddress) {
      // Show manual entry form automatically when address is selected
      setShowManualEntry(true);

      // Update form data with all address fields
      setFormData(prev => ({
        ...prev,
        deliveryMethod: 'delivery' as const,
        // Keep existing name and phone
        name: prev.name,
        phone: prev.phone,
        // Update main address field and ensure no undefined values
        address: params.selectedAddress || '',
        // Update all manual address fields with the components
        streetNumber: params.selectedStreetNumber || '',
        landmark: params.selectedLandmark || '',
        locality: params.selectedLocality || '',
        city: params.selectedCity || '',
        state: params.selectedState || '',
        pincode: params.selectedPostalCode || '',
        // Clear pickup center since we're in delivery mode
        pickupCenter: '',
        specialInstructions: prev.specialInstructions || ''
      }));

      // Clear any existing errors
      setFormErrors({});
    }
  }, [
    params.returnFromAddressSearch,
    params.selectedAddress,
    params.selectedStreetNumber,
    params.selectedLandmark,
    params.selectedLocality,
    params.selectedCity,
    params.selectedState,
    params.selectedPostalCode
  ]);

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    // Remove all non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    // Check if the number is between 10 and 15 digits
    return /^[0-9]{10,15}$/.test(cleanNumber);
  };

  const handlePhoneNumber = (phoneNumber: string) => {
    // Remove any non-digit characters except plus sign at the start
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '').replace(/^\+/, '');
    setFormData(prev => ({ ...prev, phone: cleanNumber }));
    
    if (cleanNumber && !validatePhoneNumber(cleanNumber)) {
      setFormErrors(prev => ({
        ...prev,
        phone: 'Please enter a valid phone number (10-15 digits)'
      }));
    } else {
      setFormErrors(prev => {
        const { phone, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleDeliveryMethodChange = (method: 'pickup' | 'delivery') => {
    setFormData(prev => ({ 
      ...prev, 
      deliveryMethod: method,
      // Clear the other field when switching methods
      address: method === 'delivery' ? prev.address : '',
      pickupCenter: method === 'pickup' ? prev.pickupCenter : ''
    }));

    // Clear related errors
    setFormErrors(prev => {
      const { address, pickupCenter, ...rest } = prev;
      return rest;
    });
  };

  const handleAddressSearch = async () => {
    try {
      // Save current form state before navigating
      const orderDraft = await AsyncStorage.getItem('orderDraft');
      const currentDraft = orderDraft ? JSON.parse(orderDraft) : {};
      
      await AsyncStorage.setItem('orderDraft', JSON.stringify({
        ...currentDraft,
        receiver: {
          ...currentDraft.receiver,
          name: formData.name.trim(),
          phone: formData.phone.replace(/\s+/g, '').trim(),
          deliveryMethod: formData.deliveryMethod
        }
      }));

      router.push({
        pathname: '/(dashboard)/customer/address-search',
        params: {
          returnTo: 'receiver',
          currentName: formData.name,
          currentPhone: formData.phone,
          currentDeliveryMethod: formData.deliveryMethod
        }
      });
    } catch (error) {
      console.error('Error saving form data:', error);
      Alert.alert('Error', 'Failed to save form data. Please try again.');
    }
  };

  // Validate form data
  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    // Phone validation with more strict format
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s+/g, ''))) {
      errors.phone = 'Phone number must be 10-11 digits';
    }

    // Address validation based on delivery method
    if (formData.deliveryMethod === 'delivery') {
      if (!formData.address.trim()) {
        errors.address = 'Address is required';
      }
    } else {
      if (!formData.pickupCenter) {
        errors.pickupCenter = 'Pickup center is required';
      }
    }

    // State validation
    if (!formData.state.trim()) {
      errors.state = 'State is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Update handleProceed to use validation
  const handleProceed = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', Object.values(formErrors).join('\n'));
      return;
    }

    setIsLoading(true);
    try {
      const orderDraft = await AsyncStorage.getItem('orderDraft');
      const currentDraft = orderDraft ? JSON.parse(orderDraft) : {};
      
      const receiverData = {
        name: formData.name.trim(),
        address: (formData.deliveryMethod === 'delivery' ? formData.address : formData.pickupCenter || '').trim(),
        phone: formData.phone.replace(/\s+/g, '').trim(),
        state: formData.state.trim(),
        deliveryMethod: formData.deliveryMethod,
        pickupCenter: formData.deliveryMethod === 'pickup' ? formData.pickupCenter : undefined
      };

      await AsyncStorage.setItem('orderDraft', JSON.stringify({
        ...currentDraft,
        receiver: receiverData,
        locations: {
          ...currentDraft.locations,
          delivery: {
            address: receiverData.address,
            state: receiverData.state
          }
        }
      }));

      router.replace({
        pathname: '/(dashboard)/customer/new-order',
        params: {
          receiverName: receiverData.name,
          receiverAddress: receiverData.address,
          receiverPhone: receiverData.phone,
          receiverDeliveryMethod: receiverData.deliveryMethod,
          // Preserve sender details if they exist
          ...(params.senderName && {
            senderName: params.senderName,
            senderAddress: params.senderAddress,
            senderPhone: params.senderPhone
          }),
          // Preserve vehicle and date if they exist
          ...(params.selectedVehicle && { selectedVehicle: params.selectedVehicle }),
          ...(params.pickupDate && { pickupDate: params.pickupDate })
        }
      });
    } catch (error) {
      console.error('Error saving receiver details:', error);
      Alert.alert('Error', 'Failed to save receiver details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectContact = async () => {
    try {
      // Check current permission status first
      const { status: existingStatus } = await Contacts.getPermissionsAsync();
      
      if (existingStatus === 'denied') {
        Alert.alert(
          'Permission Required',
          'This app needs access to contacts to select a receiver. Please enable it in your phone settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings',
              onPress: () => Linking.openSettings()
            }
          ]
        );
        return;
      }

      // Request permission if not already granted
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Cannot access contacts without permission. Please enable contacts access in your phone settings to use this feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings',
              onPress: () => Linking.openSettings()
            }
          ]
        );
        return;
      }

      // Get all contacts
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Addresses,
        ],
      });

      if (data.length === 0) {
        Alert.alert('No Contacts', 'No contacts found on your device');
        return;
      }

      // Present contact picker UI
      Alert.alert(
        'Select Contact',
        'Choose how you want to select a contact:',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Select First Contact',
            onPress: () => {
              const contact = data[0];
              updateFormWithContact(contact);
            }
          },
          {
            text: 'View All Contacts',
            onPress: () => {
              // Here you would typically show a modal with all contacts
              // For now, we'll just use the first contact as a placeholder
              const contact = data[0];
              updateFormWithContact(contact);
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error accessing contacts:', error);
      Alert.alert(
        'Error',
        'Failed to access contacts. Please try again later.'
      );
    }
  };

  const updateFormWithContact = (contact: Contacts.Contact) => {
    // Format address from components if available
    let formattedAddress = '';
    if (contact.addresses?.[0]) {
      const addr = contact.addresses[0];
      formattedAddress = [
        addr.street,
        addr.city,
        addr.region,
        addr.postalCode,
        addr.country
      ].filter(Boolean).join(', ');
    }

    // Update form with contact data
    setFormData(prev => ({
      ...prev,
      name: contact.name || prev.name,
      phone: contact.phoneNumbers?.[0]?.number?.replace(/\D/g, '') || prev.phone,
      // If contact has address, update address fields
      ...(contact.addresses?.[0] && {
        address: formattedAddress,
        streetNumber: contact.addresses[0].street || '',
        city: contact.addresses[0].city || '',
        state: contact.addresses[0].region || '',
        pincode: contact.addresses[0].postalCode || '',
      })
    }));

    // Show manual entry if address is available
    if (contact.addresses?.[0]) {
      setShowManualEntry(true);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Receiver's Details",
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select Receivers</Text>
          <TouchableOpacity>
            <Text style={styles.moreReceiversLink}>More Receivers</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Selection Button */}
        <TouchableOpacity
          style={styles.contactButton}
          onPress={handleSelectContact}
        >
          <Ionicons name="people-outline" size={24} color="#007AFF" />
          <Text style={styles.contactButtonText}>Select from Contacts</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#666" />
          <Text style={styles.infoText}>
            Your selected receiver would be used in delivering your item to its destination.
          </Text>
        </View>

        <Text style={styles.label}>Delivery Method</Text>
        <View style={styles.deliveryMethodContainer}>
          <TouchableOpacity 
            style={[
              styles.methodButton,
              formData.deliveryMethod === 'pickup' && styles.selectedMethod
            ]}
            onPress={() => handleDeliveryMethodChange('pickup')}
          >
            <Ionicons 
              name="business-outline" 
              size={20} 
              color={formData.deliveryMethod === 'pickup' ? '#fff' : '#666'} 
            />
            <Text style={[
              styles.methodText,
              formData.deliveryMethod === 'pickup' && styles.selectedMethodText
            ]}>Pick-up Center</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.methodButton,
              formData.deliveryMethod === 'delivery' && styles.selectedMethod
            ]}
            onPress={() => handleDeliveryMethodChange('delivery')}
          >
            <Ionicons 
              name="home-outline" 
              size={20} 
              color={formData.deliveryMethod === 'delivery' ? '#fff' : '#666'} 
            />
            <Text style={[
              styles.methodText,
              formData.deliveryMethod === 'delivery' && styles.selectedMethodText
            ]}>Home Delivery</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Receiver's Name</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Enter Receivers Name"
            placeholderTextColor="#999"
          />
        </View>

        {formData.deliveryMethod === 'delivery' ? (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TouchableOpacity 
                style={[styles.addressInput, formErrors.address && styles.inputError]} 
                onPress={handleAddressSearch}
              >
                <Text style={[
                  styles.addressText,
                  !formData.address && styles.placeholderText
                ]}>
                  {formData.address || 'Search for address'}
                </Text>
                <Ionicons name="search-outline" size={20} color="#4A90E2" />
              </TouchableOpacity>
              {formErrors.address && (
                <Text style={styles.errorText}>{formErrors.address}</Text>
              )}
            </View>

            <TouchableOpacity 
              style={styles.manualEntryButton}
              onPress={() => setShowManualEntry(!showManualEntry)}
            >
              <Ionicons 
                name={showManualEntry ? "create" : "create-outline"} 
                size={20} 
                color="#4A90E2" 
              />
              <Text style={styles.manualEntryText}>
                {showManualEntry ? 'Hide Manual Entry' : 'Enter Address Manually'}
              </Text>
            </TouchableOpacity>

            {showManualEntry && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Street/Door Number</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.streetNumber}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, streetNumber: text }))}
                    placeholder="Enter Street/Door Number"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Landmark (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.landmark}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, landmark: text }))}
                    placeholder="Enter Nearby Landmark"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Locality</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.locality}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, locality: text }))}
                    placeholder="Enter Locality"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>City</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.city}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                    placeholder="Enter City"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Postcode</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.pincode}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, pincode: text }))}
                    placeholder="Enter Postcode"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    maxLength={6}
                  />
                </View>
              </>
            )}
          </>
        ) : (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pickup Center</Text>
            <TextInput
              style={styles.input}
              value={formData.pickupCenter}
              onChangeText={(text) => setFormData(prev => ({ ...prev, pickupCenter: text }))}
              placeholder="Enter Pickup Center"
              placeholderTextColor="#999"
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.phoneInputWrapper}>
            <PhoneInput
              value={formData.phone}
              onChangePhoneNumber={handlePhoneNumber}
              selectedCountry={selectedCountry}
              onChangeSelectedCountry={setSelectedCountry}
              defaultCountry="NG"
              theme="light"
              phoneInputStyles={{
                container: styles.phoneInputContainer,
                flagContainer: styles.flagContainer,
                input: styles.phoneInput
              }}
            />
          </View>
          {formErrors.phone && (
            <Text style={styles.errorText}>{formErrors.phone}</Text>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={[
          styles.proceedButton,
          isLoading && styles.disabledButton
        ]} 
        onPress={handleProceed}
        disabled={isLoading}
      >
        <Text style={styles.proceedButtonText}>
          {isLoading ? 'Saving...' : 'Proceed'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  moreReceiversLink: {
    color: '#4A90E2',
    fontSize: 14,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoText: {
    marginLeft: 8,
    flex: 1,
    color: '#666',
    fontSize: 14,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  deliveryMethodContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    gap: 8,
  },
  selectedMethod: {
    backgroundColor: '#000',
  },
  methodText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedMethodText: {
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  placeholder: {
    flex: 1,
    fontSize: 15,
    color: '#999',
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  phoneInputContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  flagContainer: {
    backgroundColor: '#F9FAFB',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  phoneInput: {
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    color: '#000',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  contactButtonText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  proceedButton: {
    margin: 16,
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
  },
  fullWidth: {
    flex: 1,
  },
  manualEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginBottom: 16,
  },
  addressText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  placeholderText: {
    flex: 1,
    fontSize: 15,
    color: '#999',
  },
  inputError: {
    borderColor: '#FF4444',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 12,
    marginTop: 4,
  },
  manualEntryText: {
    marginLeft: 8,
    color: '#4A90E2',
    fontSize: 14,
  },
}); 
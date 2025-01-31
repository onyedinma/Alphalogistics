import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PhoneInput, { ICountry } from 'react-native-international-phone-number';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as Contacts from 'expo-contacts';

const STATES = {
  NIGERIA: [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
    'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
    'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
    'Yobe', 'Zamfara'
  ],
  GHANA: [
    'Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern', 'Greater Accra',
    'North East', 'Northern', 'Oti', 'Savannah', 'Upper East', 'Upper West', 'Volta',
    'Western', 'Western North'
  ]
};

interface FormErrors {
  name?: string;
  address?: string;
  phone?: string;
  state?: string;
}

interface SearchParams {
  returnFromAddressSearch?: string;
  selectedAddress?: string;
  selectedState?: string;
  selectedCountry?: string;
  selectedStreetNumber?: string;
  selectedLandmark?: string;
  selectedLocality?: string;
  selectedCity?: string;
  selectedPostalCode?: string;
}

interface OrderDraft {
  sender?: {
    name: string;
    address: string;
    state: string;
    phone: string;
  };
}

enum CountryType {
  NIGERIA = 'NIGERIA',
  GHANA = 'GHANA'
}

const validatePhoneNumber = (phoneNumber: string): boolean => {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  return /^[0-9]{10,15}$/.test(cleanNumber);
};

const CONTACTS_PER_PAGE = 20;

interface EnhancedContact extends Contacts.Contact {
  searchableText?: string;
}

// Update findMatchingState to be more precise
const findMatchingState = (addressState: string): string => {
  if (!addressState) return '';
  const normalized = addressState.toLowerCase();
  
  for (const state of STATES.NIGERIA) {
    if (state.toLowerCase().includes(normalized) || 
        normalized.includes(state.toLowerCase())) {
      return state;
    }
  }
  return addressState;
};

// Update form data interface
interface FormData {
  name: string;
  streetNumber: string;
  landmark: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  address: string;
  phone: string;
}

export default function SenderDetails() {
  const params = useLocalSearchParams<SearchParams>();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    streetNumber: '',
    landmark: '',
    locality: '',
    city: '',
    state: '',
    pincode: '',
    address: '',
    phone: ''
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState<ICountry | null>(null);
  const [selectedStateCountry, setSelectedStateCountry] = useState<CountryType>(CountryType.NIGERIA);
  const [isLoading, setIsLoading] = useState(false);
  const [showStates, setShowStates] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStates, setFilteredStates] = useState(STATES.NIGERIA);
  const [contacts, setContacts] = useState<EnhancedContact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [displayedContacts, setDisplayedContacts] = useState<EnhancedContact[]>([]);
  const [page, setPage] = useState(0);
  const [cachedContacts, setCachedContacts] = useState<EnhancedContact[]>([]);
  const [showContactsModal, setShowContactsModal] = useState(false);

  // Update address return effect with better data handling
  useEffect(() => {
    if (params.returnFromAddressSearch === 'true' && params.selectedAddress) {
      const updateFormWithAddress = async () => {
        try {
          // First, get the current form data from storage
          const orderDraft = await AsyncStorage.getItem('orderDraft');
          const currentDraft = orderDraft ? JSON.parse(orderDraft) : {};
          const currentSender = currentDraft.sender || {};

          // Create updated form data
          const updatedFormData: FormData = {
            // Preserve existing data
            name: currentSender.name || formData.name,
            phone: currentSender.phone || formData.phone,
            // Update with new address data
            address: params.selectedAddress || '',
            streetNumber: params.selectedStreetNumber || '',
            landmark: params.selectedLandmark || '',
            locality: params.selectedLocality || '',
            city: params.selectedCity || '',
            state: findMatchingState(params.selectedState || ''),
            pincode: params.selectedPostalCode || ''
          };

          // Update form state
          setFormData(updatedFormData);

          // Update storage with the same data
          await AsyncStorage.setItem('orderDraft', JSON.stringify({
            ...currentDraft,
            sender: updatedFormData
          }));

        } catch (error) {
          console.error('Error updating address:', error);
          Alert.alert('Error', 'Failed to update address information');
        }
      };

      updateFormWithAddress();
    }
  }, [
    params.returnFromAddressSearch,
    params.selectedAddress,
    params.selectedState,
    params.selectedStreetNumber,
    params.selectedLandmark,
    params.selectedLocality,
    params.selectedCity,
    params.selectedPostalCode
  ]);

  // Save form data to AsyncStorage
  useEffect(() => {
    const saveFormData = async () => {
      try {
        const savedOrderDraft = await AsyncStorage.getItem('orderDraft');
        const currentDraft = savedOrderDraft ? JSON.parse(savedOrderDraft) : {};
        
        await AsyncStorage.setItem('orderDraft', JSON.stringify({
          ...currentDraft,
          sender: formData
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

  // Update handleAddressSearch to include more data
  const handleAddressSearch = async () => {
    try {
      const tempData = {
        name: formData.name,
        phone: formData.phone,
        state: formData.state
      };
      
      await AsyncStorage.setItem('tempSenderData', JSON.stringify(tempData));
      
      router.push({
        pathname: '/(dashboard)/customer/address-search',
        params: {
          returnTo: 'sender',
          currentData: JSON.stringify(tempData)
        }
      });
    } catch (error) {
      console.error('Address search error:', error);
      Alert.alert('Error', 'Failed to process address search');
    }
  };

  // Handle form submission
  const handleProceed = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const savedOrderDraft = await AsyncStorage.getItem('orderDraft');
      const currentDraft: OrderDraft = savedOrderDraft ? JSON.parse(savedOrderDraft) : {};
      
      const updatedDraft = {
        ...currentDraft,
        sender: {
          name: formData.name.trim(),
          address: formData.address.trim(),
          state: formData.state.trim(),
          phone: formData.phone.trim(),
        },
      };

      await AsyncStorage.setItem('orderDraft', JSON.stringify(updatedDraft));
      await AsyncStorage.removeItem('senderFormData');

      router.push({
        pathname: '/(dashboard)/customer/new-order',
        params: {
          senderName: formData.name.trim(),
          senderAddress: formData.address.trim(),
          senderState: formData.state.trim(),
          senderPhone: formData.phone.trim(),
        },
      });
    } catch (error) {
      console.error('Error saving sender details:', error);
      Alert.alert('Error', 'Failed to save sender details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Validate form fields
  const validateForm = () => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Please enter the sender\'s name';
    }

    if (!formData.address.trim()) {
      errors.address = 'Please enter the sender\'s address';
    }

    if (!formData.state.trim()) {
      errors.state = 'Please select a state';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Please enter a phone number';
    } else if (!validatePhoneNumber(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContactSelect = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        setShowContactsModal(true);
        if (!contacts.length) {
          setIsLoadingContacts(true);
          const { data } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
          });
          
          const enhancedContacts = data
            .filter(c => c.name && c.phoneNumbers?.[0]?.number)
            .map(c => ({
              ...c,
              searchableText: `${c.name} ${c.phoneNumbers?.[0]?.number || ''}`.toLowerCase()
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

          setContacts(enhancedContacts);
          setDisplayedContacts(enhancedContacts.slice(0, CONTACTS_PER_PAGE));
          setIsLoadingContacts(false);
        }
      } else {
        Alert.alert(
          'Permission Required',
          'Please grant access to contacts to use this feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }
    } catch (error) {
      console.error('Error accessing contacts:', error);
      Alert.alert('Error', 'Failed to access contacts. Please try again.');
      setIsLoadingContacts(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={24} color="#4A90E2" />
          <Text style={styles.infoText}>
            Your selected sender will be used to deliver your item to its destination.
          </Text>
        </View>

        <View style={styles.form}>
          {/* Sender Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sender's Name</Text>
            <TextInput
              style={[styles.input, formErrors.name && styles.inputError]}
              placeholder="Enter sender's name"
              value={formData.name}
              onChangeText={(name) => {
                setFormData(prev => ({ ...prev, name }));
                setFormErrors(prev => ({ ...prev, name: undefined }));
              }}
            />
            {formErrors.name && (
              <Text style={styles.errorText}>{formErrors.name}</Text>
            )}
          </View>

          {/* Address Input */}
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
                {formData.address || 'Tap to search for address'}
              </Text>
              <Ionicons name="location-outline" size={20} color="#4A90E2" />
            </TouchableOpacity>
            {formErrors.address && (
              <Text style={styles.errorText}>{formErrors.address}</Text>
            )}
          </View>

          {/* State Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>State</Text>
            <TouchableOpacity 
              style={[styles.stateInput, formErrors.state && styles.inputError]}
              onPress={() => setShowStates(true)}
            >
              <Text style={[
                styles.stateText,
                !formData.state && styles.placeholderText
              ]}>
                {formData.state || 'Select a state'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#4A90E2" />
            </TouchableOpacity>
            {formErrors.state && (
              <Text style={styles.errorText}>{formErrors.state}</Text>
            )}
          </View>

          {/* Phone Number Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneInputWrapper}>
              <PhoneInput
                value={formData.phone}
                onChangePhoneNumber={(phone) => setFormData(prev => ({ ...prev, phone }))}
                selectedCountry={selectedPhoneCountry}
                onChangeSelectedCountry={setSelectedPhoneCountry}
                defaultCountry={selectedStateCountry === CountryType.GHANA ? 'GH' : 'NG'}
                phoneInputStyles={{ 
                  container: [
                    styles.phoneInput,
                    formErrors.phone && styles.inputError
                  ],
                  flag: styles.phoneFlag,
                  callingCode: styles.callingCode,
                  input: styles.phoneNumberInput
                }}
              />
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={handleContactSelect}
              >
                <Ionicons name="people-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
            {formErrors.phone && (
              <Text style={styles.errorText}>{formErrors.phone}</Text>
            )}
          </View>

          {/* Proceed Button */}
          <TouchableOpacity 
            style={[
              styles.proceedButton,
              (!formData.name || !formData.address || !formData.state || !formData.phone) && styles.disabledButton
            ]} 
            onPress={handleProceed}
            disabled={!formData.name || !formData.address || !formData.state || !formData.phone}
          >
            <Text style={styles.proceedButtonText}>
              {isLoading ? 'Saving...' : 'Proceed'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 10,
    backgroundColor: '#F7F9FC',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3EFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    color: '#2D3748',
    fontSize: 15,
    lineHeight: 20,
  },
  form: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    color: '#1A202C',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
  },
  addressInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  addressText: {
    flex: 1,
    color: '#1A202C',
    fontSize: 15,
  },
  stateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  stateText: {
    flex: 1,
    color: '#1A202C',
    fontSize: 15,
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 2,
    backgroundColor: '#FFFFFF',
    minHeight: 48,
  },
  proceedButton: {
    backgroundColor: '#3182CE',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  inputError: {
    borderColor: '#FC8181',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
  placeholderText: {
    color: '#A0AEC0',
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactButton: {
    padding: 7,
    backgroundColor: '#EBF8FF',
    borderRadius: 8,
    marginLeft: -5,
  },
  phoneFlag: {
    width: 30,
    height: 20,
    marginRight: 8,
  },
  callingCode: {
    fontSize: 15,
    color: '#1A202C',
    marginRight: 8,
  },
  phoneNumberInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A202C',
    padding: 0,
  },
  disabledButton: {
    backgroundColor: '#A0AEC0',
    opacity: 0.6,
  },
});
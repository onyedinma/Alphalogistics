import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PhoneInput, { ICountry } from 'react-native-international-phone-number';
import { Stack, router, useLocalSearchParams } from 'expo-router';

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
  address?: string;
  name?: string;
  phone?: string;
  state?: string;
  selectedAddress?: string;
  selectedState?: string;
  selectedCountry?: string;
}

interface OrderDraft {
  sender?: {
    name: string;
    address: string;
    state: string;
    phone: string;
  };
  receiver?: {
    name: string;
    address: string;
    phone: string;
  };
  selectedVehicle?: string;
  pickupDate?: string;
}

type CountryType = 'NIGERIA' | 'GHANA';

const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Remove all non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  // Check if the number is between 10 and 15 digits
  return /^[0-9]{10,15}$/.test(cleanNumber);
};

// Add country codes mapping
const COUNTRY_CODES = {
  NIGERIA: {
    countryCode: 'NG',
    dialCode: '234',
    name: 'Nigeria',
    flag: '🇳🇬',
    mask: '999 999 9999',
    callingCode: '234',
    cca2: 'NG'
  },
  GHANA: {
    countryCode: 'GH',
    dialCode: '233',
    name: 'Ghana',
    flag: '🇬🇭',
    mask: '999 999 9999',
    callingCode: '233',
    cca2: 'GH'
  }
} as const;

export default function SenderDetails() {
  const params = useLocalSearchParams<SearchParams>();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    state: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState<ICountry | null>(null);
  const [selectedStateCountry, setSelectedStateCountry] = useState<CountryType>('NIGERIA');
  const [isLoading, setIsLoading] = useState(false);
  const [showStates, setShowStates] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStates, setFilteredStates] = useState(STATES.NIGERIA);

  // Debounce function
  const debounce = (func: Function, delay: number) => {
    let timer: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  // Debounced search handler
  const handleSearchQueryChange = debounce((query: string) => {
    const statesList = STATES[selectedStateCountry];
    const filtered = statesList.filter((state) =>
      state.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredStates(filtered);
  }, 300);

  const handlePhoneNumberChange = (phoneNumber: string) => {
    // Remove any non-digit characters except plus sign at the start
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '').replace(/^\+/, '');
    setFormData(prev => ({ ...prev, phone: cleanNumber }));
    
    if (cleanNumber && !validatePhoneNumber(cleanNumber)) {
      setFormErrors(prev => ({
        ...prev,
        phone: 'Please enter a valid phone number (10-15 digits)'
      }));
    } else {
      setFormErrors(prev => ({ ...prev, phone: undefined }));
    }
  };

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

  // Load saved data and handle returned address
  useEffect(() => {
    if (params.returnFromAddressSearch === 'true' && params.address) {
      // Restore saved form data and update with new address and state
      AsyncStorage.getItem('senderFormData')
        .then(savedData => {
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            setFormData({
              ...parsedData,
              address: params.address as string,
              state: params.state as string || parsedData.state // Use detected state or keep existing
            });
          }
        })
        .catch(error => {
          console.error('Error restoring form data:', error);
        });
    }
  }, [params.returnFromAddressSearch, params.address, params.state]);

  const loadSavedData = async () => {
    try {
      setIsLoading(true);
      const savedFormData = await AsyncStorage.getItem('senderFormData');
      if (savedFormData) {
        setFormData(JSON.parse(savedFormData));
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSenderDetails = async () => {
    try {
      const orderDraft = await AsyncStorage.getItem('orderDraft');
      const currentDraft = orderDraft ? JSON.parse(orderDraft) : {};
      
      const senderData = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        phone: formData.phone.replace(/\s+/g, '').trim(),
        state: formData.state.trim()
      };

      await AsyncStorage.setItem('orderDraft', JSON.stringify({
        ...currentDraft,
        sender: senderData,
        locations: {
          ...currentDraft.locations,
          pickup: {
            address: senderData.address,
            state: senderData.state
          }
        }
      }));
    } catch (error) {
      console.error('Error saving sender details:', error);
      Alert.alert('Error', 'Failed to save sender details. Please try again.');
    }
  };

  const handleAddressSearch = async () => {
    try {
      // Save current form data before navigation
      const orderDraft = await AsyncStorage.getItem('orderDraft');
      const currentDraft = orderDraft ? JSON.parse(orderDraft) : {};
      
      await AsyncStorage.setItem('orderDraft', JSON.stringify({
        ...currentDraft,
        sender: {
          ...currentDraft.sender,
          name: formData.name.trim(),
          phone: formData.phone.replace(/\s+/g, '').trim(),
          state: formData.state.trim()
        }
      }));
      
      router.push({
        pathname: '/(dashboard)/customer/address-search',
        params: {
          returnTo: 'sender',
          currentName: formData.name,
          currentPhone: formData.phone,
          currentState: formData.state
        }
      });
    } catch (error) {
      console.error('Error saving form data:', error);
      Alert.alert('Error', 'Failed to save form data. Please try again.');
    }
  };

  const handleProceed = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Get existing order draft
      const savedOrderDraft = await AsyncStorage.getItem('orderDraft');
      const currentDraft: OrderDraft = savedOrderDraft ? JSON.parse(savedOrderDraft) : {};
      
      // Update order draft with sender details
      const updatedDraft = {
        ...currentDraft,
        sender: {
          name: formData.name.trim(),
          address: formData.address.trim(),
          state: formData.state.trim(),
          phone: formData.phone.trim()
        }
      };

      // Save updated draft
      await AsyncStorage.setItem('orderDraft', JSON.stringify(updatedDraft));

      // Remove temporary form data
      await AsyncStorage.removeItem('senderFormData');

      // Navigate back to new-order with sender details
      router.push({
        pathname: '/(dashboard)/customer/new-order',
        params: {
          senderName: formData.name.trim(),
          senderAddress: formData.address.trim(),
          senderState: formData.state.trim(),
          senderPhone: formData.phone.trim()
        }
      });
    } catch (error) {
      console.error('Error saving sender details:', error);
      Alert.alert('Error', 'Failed to save sender details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update useEffect to handle state list and initialize phone country
  useEffect(() => {
    if (formData.address) {
      // Check if address contains Ghana or Nigerian identifiers
      const addressLower = formData.address.toLowerCase();
      if (addressLower.includes('ghana')) {
        setSelectedStateCountry('GHANA');
        setFilteredStates(STATES.GHANA);
        // Initialize Ghana phone country if not already set
        if (!selectedPhoneCountry || selectedPhoneCountry.cca2 !== 'GH') {
          setSelectedPhoneCountry({
            name: 'Ghana',
            cca2: 'GH',
            callingCode: '233',
            flag: '🇬🇭'
          } as unknown as ICountry);
        }
      } else if (addressLower.includes('nigeria')) {
        setSelectedStateCountry('NIGERIA');
        setFilteredStates(STATES.NIGERIA);
        // Initialize Nigeria phone country if not already set
        if (!selectedPhoneCountry || selectedPhoneCountry.cca2 !== 'NG') {
          setSelectedPhoneCountry({
            name: 'Nigeria',
            cca2: 'NG',
            callingCode: '234',
            flag: '🇳🇬'
          } as unknown as ICountry);
        }
      }
    }
  }, [formData.address]);

  // Add this useEffect after the existing useEffects
  useEffect(() => {
    if (params.selectedAddress || params.selectedState || params.selectedCountry) {
      setFormData(prev => ({
        ...prev,
        address: params.selectedAddress || prev.address,
        state: params.selectedState || prev.state
      }));

      // Update selected country based on returned country
      if (params.selectedCountry) {
        const newCountry = params.selectedCountry.includes('Ghana') ? 'GHANA' : 'NIGERIA';
        setSelectedStateCountry(newCountry as CountryType);
      }

      // Clear any existing errors
      setFormErrors(prev => ({
        ...prev,
        address: undefined,
        state: undefined
      }));
    }
  }, [params.selectedAddress, params.selectedState, params.selectedCountry]);

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
            <PhoneInput
              value={formData.phone}
              onChangePhoneNumber={handlePhoneNumberChange}
              selectedCountry={selectedPhoneCountry}
              onChangeSelectedCountry={setSelectedPhoneCountry}
              defaultCountry={selectedStateCountry === 'GHANA' ? 'GH' : 'NG'}
              phoneInputStyles={{ 
                container: [
                  styles.phoneInput,
                  formErrors.phone && styles.inputError
                ]
              }}
            />
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

        {/* State Selection Modal */}
        <Modal
          visible={showStates}
          transparent
          animationType="slide"
          onRequestClose={() => setShowStates(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search states..."
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  handleSearchQueryChange(text);
                }}
              />
              <FlatList
                data={filteredStates}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.stateItem,
                      formData.state === item && styles.selectedStateItem,
                    ]}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, state: item }));
                      setShowStates(false);
                      setSearchQuery('');
                      setFilteredStates(STATES[selectedStateCountry]);
                    }}
                  >
                    <Text style={[
                      styles.stateItemText,
                      formData.state === item && styles.selectedStateText
                    ]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <Text style={styles.noResultsText}>No states found</Text>
                )}
              />
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EBF5FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    marginLeft: 12,
    color: '#2D3748',
    fontSize: 14,
  },
  form: {
    marginTop: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  addressInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
  },
  addressText: {
    color: '#333',
  },
  stateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
  },
  stateText: {
    color: '#333',
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 8,
  },
  proceedButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  stateItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  stateItemText: {
    fontSize: 14,
  },
  inputError: {
    borderColor: '#FF0000',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 12,
    marginTop: 4,
  },
  placeholderText: {
    color: '#999',
  },
  noResultsText: {
    textAlign: 'center',
    padding: 16,
    color: '#666',
  },
  selectedStateItem: {
    backgroundColor: '#EBF5FF',
  },
  selectedStateText: {
    color: '#4A90E2',
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
});

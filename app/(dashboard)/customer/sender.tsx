import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as Contacts from 'expo-contacts';

interface FormErrors {
  name?: string;
  address?: string;
  phone?: string;
  state?: string;
}

interface FormData {
  name: string;
  address: string;
  state: string;
  phone: string;
}

interface SearchParams {
  selectedAddress?: string;
  selectedState?: string;
  returnFromAddressSearch?: string;
}

const validatePhoneNumber = (phoneNumber: string): boolean => {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  return /^[0-9]{10,15}$/.test(cleanNumber);
};

export default function SenderDetails() {
  const params = useLocalSearchParams<SearchParams>();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: '',
    state: '',
    phone: ''
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const orderDraft = await AsyncStorage.getItem('orderDraft');
        if (orderDraft) {
          const parsedDraft = JSON.parse(orderDraft);
          if (parsedDraft.sender) {
            setFormData(prev => ({
              ...prev,
              ...parsedDraft.sender
            }));
          }
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    loadInitialData();
  }, []);

  // Handle address search return
  useEffect(() => {
    if (params.returnFromAddressSearch === 'true' && params.selectedAddress) {
      const loadTempData = async () => {
        try {
          const tempData = await AsyncStorage.getItem('tempSenderData');
          const parsedTempData = tempData ? JSON.parse(tempData) : {};
          
          setFormData(prev => ({
            ...prev,
            ...parsedTempData, // Restore name and phone
            address: params.selectedAddress || '',
            state: params.selectedState || prev.state
          }));
          
          setFormErrors(prev => ({ ...prev, address: undefined, state: undefined }));
          
          // Clean up temp storage
          await AsyncStorage.removeItem('tempSenderData');
        } catch (error) {
          console.error('Error loading temp data:', error);
        }
      };
      
      loadTempData();
    }
  }, [params.returnFromAddressSearch, params.selectedAddress, params.selectedState]);

  const handleAddressSearch = async () => {
    try {
      // Save current form data to AsyncStorage before navigating
      await AsyncStorage.setItem('tempSenderData', JSON.stringify({
        name: formData.name,
        phone: formData.phone
      }));

      router.push({
        pathname: '/(dashboard)/customer/address-search',
        params: {
          returnTo: 'sender'
        }
      });
    } catch (error) {
      console.error('Error saving temp data:', error);
    }
  };

  const handleContactSelect = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        });

        if (data.length > 0) {
          // Filter contacts with phone numbers and sort by name
          const contactsWithPhone = data
            .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

          if (contactsWithPhone.length > 0) {
            try {
              // Open contact picker
              const contact = await Contacts.presentContactPickerAsync();

              if (contact) {
                // Get the first phone number
                const phoneNumber = contact.phoneNumbers?.[0]?.number;
                if (phoneNumber) {
                  // Clean the phone number (remove spaces, dashes, etc.)
                  const cleanedNumber = phoneNumber.replace(/\D/g, '');
                  setFormData(prev => ({
                    ...prev,
                    name: contact.name || prev.name,
                    phone: cleanedNumber
                  }));
                  setFormErrors(prev => ({ ...prev, phone: undefined, name: undefined }));
                }
              }
            } catch (pickerError: any) {
              if (typeof pickerError?.message === 'string' && 
                  pickerError.message.includes('Different contact picking in progress')) {
                Alert.alert('Error', 'Another contact picker is already open. Please try again.');
              } else {
                Alert.alert('Error', 'Failed to open contact picker. Please try again.');
              }
              console.error('Contact picker error:', pickerError);
            }
          } else {
            Alert.alert('No Contacts', 'No contacts with phone numbers found.');
          }
        } else {
          Alert.alert('No Contacts', 'No contacts found on your device.');
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
    }
  };

  // Handle form submission
  const handleProceed = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const savedOrderDraft = await AsyncStorage.getItem('orderDraft');
      const currentDraft = savedOrderDraft ? JSON.parse(savedOrderDraft) : {};
      
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

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Sender's Details",
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select Sender</Text>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#666" />
          <Text style={styles.infoText}>
            Your selected sender will be used to deliver your item to its destination.
          </Text>
        </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sender's Name</Text>
            <TextInput
              style={[styles.input, formErrors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(name) => {
                setFormData(prev => ({ ...prev, name }));
                setFormErrors(prev => ({ ...prev, name: undefined }));
              }}
            placeholder="Enter Sender's Name"
            placeholderTextColor="#999"
            />
            {formErrors.name && (
              <Text style={styles.errorText}>{formErrors.name}</Text>
            )}
          </View>

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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>State</Text>
          <TextInput
            style={[styles.input, formErrors.state && styles.inputError]}
            placeholder="Enter state"
            value={formData.state}
            onChangeText={(state) => {
              setFormData(prev => ({ ...prev, state }));
              setFormErrors(prev => ({ ...prev, state: undefined }));
            }}
            editable={false}
            placeholderTextColor="#999"
          />
            {formErrors.state && (
              <Text style={styles.errorText}>{formErrors.state}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneInputWrapper}>
            <TextInput
              style={[styles.phoneInput, formErrors.phone && styles.inputError]}
              placeholder="Enter phone number"
                value={formData.phone}
              onChangeText={(phone) => {
                setFormData(prev => ({ ...prev, phone }));
                setFormErrors(prev => ({ ...prev, phone: undefined }));
              }}
              keyboardType="phone-pad"
              placeholderTextColor="#999"
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
      </ScrollView>

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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
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
    fontSize: 15,
    color: '#000',
  },
  addressInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  placeholderText: {
    color: '#999',
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#000',
    minHeight: 48,
  },
  contactButton: {
    padding: 8,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
  inputError: {
    borderColor: '#FF4444',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 12,
    marginTop: 4,
  },
});
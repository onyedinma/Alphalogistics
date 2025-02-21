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
  ActivityIndicator,
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

const PHONE_REGEX = /^[0-9]{10,15}$/;
const PHONE_ERROR_MESSAGE = 'Please enter a valid phone number (10-15 digits)';

const validatePhoneNumber = (phoneNumber: string): boolean => {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  return PHONE_REGEX.test(cleanNumber);
};

const formatPhoneNumber = (phoneNumber: string): string => {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  if (cleanNumber.length <= 10) {
    return cleanNumber.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3');
  }
  return cleanNumber;
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
  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
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
      Alert.alert('Error', 'Failed to load saved data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params.returnFromAddressSearch === 'true' && params.selectedAddress) {
      handleAddressSearchReturn();
    }
  }, [params.returnFromAddressSearch, params.selectedAddress, params.selectedState]);

  const handleAddressSearchReturn = async () => {
    try {
      const tempData = await AsyncStorage.getItem('tempSenderData');
      const parsedTempData = tempData ? JSON.parse(tempData) : {};
      
      setFormData(prev => ({
        ...prev,
        ...parsedTempData,
        address: params.selectedAddress || '',
        state: params.selectedState || prev.state
      }));
      
      setFormErrors(prev => ({ ...prev, address: undefined, state: undefined }));
      await AsyncStorage.removeItem('tempSenderData');
    } catch (error) {
      console.error('Error handling address search return:', error);
      Alert.alert('Error', 'Failed to process address data');
    }
  };

  const handleAddressSearch = async () => {
    try {
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
      Alert.alert('Error', 'Failed to initiate address search');
    }
  };

  const handleContactSelect = async () => {
    if (isContactPickerOpen) {
      Alert.alert('Please wait', 'Contact picker is already open');
      return;
    }

    try {
      setIsContactPickerOpen(true);
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant access to contacts to use this feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });

      if (!data?.length) {
        Alert.alert('No Contacts', 'No contacts found on your device.');
        return;
      }

      const contact = await Contacts.presentContactPickerAsync();
      
      if (contact?.phoneNumbers?.[0]?.number) {
        const cleanedNumber = contact.phoneNumbers[0].number.replace(/\D/g, '');
        setFormData(prev => ({
          ...prev,
          name: contact.name || prev.name,
          phone: formatPhoneNumber(cleanedNumber)
        }));
        setFormErrors(prev => ({ ...prev, phone: undefined, name: undefined }));
      }
    } catch (error: any) {
      console.error('Contact picker error:', error);
      if (error?.message?.includes('Different contact picking in progress')) {
        Alert.alert('Error', 'Another contact picker is already open');
      } else {
        Alert.alert('Error', 'Failed to access contacts');
      }
    } finally {
      setIsContactPickerOpen(false);
    }
  };

  const handlePhoneChange = (phone: string) => {
    const formattedPhone = formatPhoneNumber(phone);
    setFormData(prev => ({ ...prev, phone: formattedPhone }));
    setFormErrors(prev => ({ ...prev, phone: undefined }));
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = 'Please enter the sender\'s name';
      isValid = false;
    }

    if (!formData.address.trim()) {
      errors.address = 'Please enter the sender\'s address';
      isValid = false;
    }

    if (!formData.state.trim()) {
      errors.state = 'Please select a state';
      isValid = false;
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Please enter a phone number';
      isValid = false;
    } else if (!validatePhoneNumber(formData.phone)) {
      errors.phone = PHONE_ERROR_MESSAGE;
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleProceed = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
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
      Alert.alert('Error', 'Failed to save sender details');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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

        <View style={styles.form}>
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
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                placeholderTextColor="#999"
              />
              <TouchableOpacity 
                style={[styles.contactButton, isContactPickerOpen && styles.contactButtonDisabled]}
                onPress={handleContactSelect}
                disabled={isContactPickerOpen}
              >
                <Ionicons name="people-outline" size={24} color={isContactPickerOpen ? "#999" : "#007AFF"} />
              </TouchableOpacity>
            </View>
            {formErrors.phone && (
              <Text style={styles.errorText}>{formErrors.phone}</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={[
          styles.proceedButton,
          (!formData.name || !formData.address || !formData.state || !formData.phone || isSaving) && styles.disabledButton
        ]} 
        onPress={handleProceed}
        disabled={!formData.name || !formData.address || !formData.state || !formData.phone || isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.proceedButtonText}>Proceed</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
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
  form: {
    flex: 1,
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
  inputError: {
    borderColor: '#DC2626',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
  },
  addressInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    width: 48,
    height: 48,
  },
  contactButtonDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },
  proceedButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    margin: 16,
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
  },
});
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Text, Linking, Modal, FlatList, ActivityIndicator, Platform } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Contacts from 'expo-contacts';
import { StorageService } from '@/services/storage';
import type { OrderDraft, Location } from './types';

// Add constants at the top of the file
const CONTACTS_PER_PAGE = 20;

interface ContactDetails {
  name: string;
  phone: string;
  address: string;
  state: string;
  deliveryMethod: 'pickup' | 'delivery';
  pickupCenter?: string;
  specialInstructions?: string;
}

interface FormErrors {
  [key: string]: string | undefined;
}

// Add interface for enhanced contact
interface EnhancedContact extends Contacts.Contact {
  searchableText?: string;
}

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
  deliveryMethod: 'pickup' | 'delivery';
  pickupCenter?: string;
}

interface RouteParams {
  name?: string;
  address?: string;
  phone?: string;
  state?: string;
  returnFromAddressSearch?: string;
  selectedAddress?: string;
  selectedState?: string;
  selectedCountry?: string;
  showManualEntry?: string;
  selectedStreetNumber?: string;
  selectedLandmark?: string;
  selectedLocality?: string;
  selectedCity?: string;
  selectedPostalCode?: string;
}

const ReceiverDetails: React.FC = () => {
  const params = useLocalSearchParams<RouteParams>();

  // State hooks
  const [formData, setFormData] = useState<FormData>({
    name: '',
    streetNumber: '',
    landmark: '',
    locality: '',
    city: '',
    state: '',
    pincode: '',
    address: '',
    phone: '',
    deliveryMethod: 'delivery',
    pickupCenter: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [contacts, setContacts] = useState<EnhancedContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [displayedContacts, setDisplayedContacts] = useState<EnhancedContact[]>([]);
  const [page, setPage] = useState(0);
  const [cachedContacts, setCachedContacts] = useState<EnhancedContact[]>([]);
  const [showAddressFields, setShowAddressFields] = useState(false);
  const phoneInputRef = useRef<TextInput>(null);

  // Memoized values
  const filteredContacts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return contacts;
    return contacts.filter(contact => 
      contact.searchableText?.includes(query)
    );
  }, [contacts, searchQuery]);

  // Callback hooks
  const loadMore = useCallback(() => {
    if (searchQuery) return;
    const nextPage = page + 1;
    const start = nextPage * CONTACTS_PER_PAGE;
    const end = start + CONTACTS_PER_PAGE;
    const newContacts = contacts.slice(start, end);
    if (newContacts.length > 0) {
      setDisplayedContacts(prev => [...prev, ...newContacts]);
      setPage(nextPage);
    }
  }, [page, contacts, searchQuery]);

  const renderContactItem = useCallback(({ item }: { item: EnhancedContact }) => (
    <TouchableOpacity 
      style={styles.contactItem}
      onPress={() => {
        updateFormWithContact(item);
        setShowContactsModal(false);
        setSearchQuery('');
        setDisplayedContacts([]);
        setPage(0);
      }}
    >
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        {item.phoneNumbers && item.phoneNumbers[0] && (
          <Text style={styles.contactPhone}>{item.phoneNumbers[0].number}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  ), []);

  const keyExtractor = useCallback((item: EnhancedContact) => item.id || item.name || '', []);
  
  const ItemSeparator = useCallback(() => <View style={styles.separator} />, []);
  
  const getItemLayout = useCallback((data: ArrayLike<EnhancedContact> | null | undefined, index: number) => ({
    length: 72,
    offset: 72 * index,
    index
  }), []);

  const EmptyListComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {searchQuery ? 'No contacts found' : 'No contacts available'}
      </Text>
    </View>
  ), [searchQuery]);

  // Update the address search return handler
  useEffect(() => {
    if (params.returnFromAddressSearch === 'true' && params.selectedAddress) {
      console.log('Return from address search with params:', params);
      const loadSavedData = async () => {
        try {
          // Load the saved form data
          const tempData = await AsyncStorage.getItem('tempReceiverData');
          const savedData = tempData ? JSON.parse(tempData) : {};
          
          console.log('Loaded saved data:', savedData);

          // Create the updated form data
          const updatedFormData: FormData = {
            name: savedData.name || formData.name,
            phone: savedData.phone || formData.phone,
            deliveryMethod: 'delivery',
            address: params.selectedAddress || '',
            state: params.selectedState || '',
            streetNumber: params.selectedStreetNumber || '',
            landmark: params.selectedLandmark || '',
            locality: params.selectedLocality || '',
            city: params.selectedCity || '',
            pincode: params.selectedPostalCode || '',
            pickupCenter: formData.pickupCenter || ''
          };

          console.log('Setting form data to:', updatedFormData);
          
          // Update form data
          setFormData(updatedFormData);
          
          // Show address fields and clear any errors
          setShowAddressFields(true);
          setFormErrors({});

          // Clean up temp storage
          await AsyncStorage.removeItem('tempReceiverData');
          
          // Save to order draft
          const currentDraft = await StorageService.getOrderDraft();
          if (currentDraft) {
            const updatedDraft: OrderDraft = {
              ...currentDraft,
              receiver: {
                name: savedData.name || formData.name,
                phone: savedData.phone || formData.phone,
                address: params.selectedAddress || '',
                state: params.selectedState || '',
                streetNumber: params.selectedStreetNumber || '',
                landmark: params.selectedLandmark || '',
                locality: params.selectedLocality || '',
                city: params.selectedCity || '',
                pincode: params.selectedPostalCode || '',
                deliveryMethod: 'delivery'
              }
            };
            await StorageService.saveOrderDraft(updatedDraft);
          }
    } catch (error) {
          console.error('Error loading saved data:', error);
          Alert.alert('Error', 'Failed to load address data');
        }
      };
      
      loadSavedData();
    }
  }, [params.returnFromAddressSearch, params.selectedAddress, formData.name, formData.phone, formData.pickupCenter]);

  // Update cleanup effect to only remove tempReceiverData
  useEffect(() => {
    return () => {
      const cleanup = async () => {
        try {
          await AsyncStorage.removeItem('tempReceiverData');
        } catch (error) {
          console.error('Error cleaning up temp storage:', error);
        }
      };
      cleanup();
    };
  }, []);

  // Update handleAddressSearch to save current form state
  const handleAddressSearch = async () => {
    try {
      const dataToSave = {
        name: formData.name,
        phone: formData.phone,
        pickupCenter: formData.pickupCenter
      };
      await AsyncStorage.setItem('tempReceiverData', JSON.stringify(dataToSave));
      router.push({
        pathname: '/(dashboard)/customer/address-search',
        params: { returnTo: 'receiver' }
      });
        } catch (error) {
      console.error('Error saving temp data:', error);
      Alert.alert('Error', 'Failed to process address search. Please try again later.');
        }
      };

  // Add a separate useEffect to handle showing manual entry
  useEffect(() => {
    if (params.showManualEntry === 'true') {
      setShowManualEntry(true);
    }
  }, [params.showManualEntry]);

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
              ...parsedDraft.receiver,
              pickupCenter: parsedDraft.receiver.pickupCenter || prev.pickupCenter
            }));

            // Show manual entry if address exists
            if (parsedDraft.receiver.address) {
              setShowManualEntry(true);
            }
          }
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
        Alert.alert('Error', 'Failed to load saved data');
      }
    };

    loadSavedData();
  }, []);

  // Remove the two separate form data saving effects and replace with one debounced effect
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const saveFormData = async () => {
      try {
        // Only save if we have significant data to save
        if (!formData.name && !formData.address && !formData.phone) {
          return;
        }

        console.log('Saving form data...');
        
        // Save to order draft
        const currentDraft = await StorageService.getOrderDraft();
        const updatedDraft = {
          ...currentDraft,
          receiver: formData
        };
        await StorageService.saveOrderDraft(updatedDraft);

        // Save to temporary storage
        await AsyncStorage.setItem('receiverFormData', JSON.stringify(formData));
      } catch (error) {
        console.error('Error saving form data:', error);
      }
    };

    // Debounce the save operation
    timeoutId = setTimeout(saveFormData, 1000);

    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [formData]);

  const handlePhoneNumber = (phoneNumber: string) => {
    // Remove all non-digit characters except plus sign
    let formattedPhone = phoneNumber.replace(/[^\d+]/g, '');
    
    // Handle different phone number formats
    if (formattedPhone.startsWith('+234')) {
      formattedPhone = formattedPhone.substring(1); // Keep 234, just remove the +
    } else if (formattedPhone.startsWith('0')) {
      formattedPhone = `234${formattedPhone.substring(1)}`; // Replace 0 with 234
    } else if (!formattedPhone.startsWith('234')) {
      formattedPhone = `234${formattedPhone}`; // Add 234 prefix
    }

    // Update form data
    setFormData(prev => ({
      ...prev,
      phone: formattedPhone
    }));

    // Clear any previous phone errors
    setFormErrors(prev => {
      const { phone, ...rest } = prev;
      return rest;
    });
  };

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    // Remove all non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // Check if it starts with 234 and has correct length
    if (digitsOnly.startsWith('234')) {
      return digitsOnly.length === 13; // 234 + 10 digits
    }
    
    // For numbers without country code
    return digitsOnly.length === 10 || digitsOnly.length === 11;
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

  // Validate form data
  const validateForm = () => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Please enter the receiver\'s name';
    }

    if (formData.deliveryMethod === 'delivery') {
      if (!formData.address.trim()) {
        errors.address = 'Please enter the receiver\'s address';
      }
      if (!formData.state.trim()) {
        errors.state = 'Please select a state';
      }
    } else {
      if (!formData.pickupCenter) {
        errors.pickupCenter = 'Please select a pickup center';
      }
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Please enter a phone number';
    } else if (!validatePhoneNumber(formData.phone)) {
      errors.phone = 'Please enter a valid Nigerian phone number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add the address aggregation function
  const aggregateAddress = (data: FormData): string => {
    // If we have a complete address from search, use it
    if (data.address) return data.address;
    
    // Otherwise, construct from components
    const components = [
      data.streetNumber,
      data.landmark,
      data.locality,
      data.city,
      data.state,
      data.pincode
    ].filter(Boolean);  // Remove empty/undefined values
    
    return components.join(', ');
  };

  // Update handleProceed function
  const handleProceed = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      const currentDraft = await StorageService.getOrderDraft();
      if (!currentDraft) {
        throw new Error('No order draft found');
      }

      const updatedDraft = {
        ...currentDraft,
        receiver: {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          state: formData.state.trim(),
          deliveryMethod: formData.deliveryMethod,
          pickupCenter: formData.pickupCenter,
          streetNumber: formData.streetNumber,
          landmark: formData.landmark,
          locality: formData.locality,
          city: formData.city,
          pincode: formData.pincode
        }
      };

      await StorageService.saveOrderDraft(updatedDraft);

      router.push({
        pathname: '/(dashboard)/customer/new-order',
        params: {
          receiverName: formData.name.trim(),
          receiverAddress: formData.address.trim(),
          receiverState: formData.state.trim(),
          receiverPhone: formData.phone.trim(),
        },
      });
    } catch (error) {
      console.error('Error saving receiver details:', error);
      Alert.alert('Error', 'Failed to save receiver details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Replace handleSelectContact function
  const handleSelectContact = async () => {
    setIsLoadingContacts(true);

    try {
      // Request contacts permission if not granted
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Cannot access contacts without permission. Please enable contacts access in your phone settings to use this feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      // Get contacts with phone numbers
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
        ],
      });

      if (data.length === 0) {
        Alert.alert('No Contacts', 'No contacts found on your device');
        return;
      }

      // Process and cache contacts
      const processedContacts = data
        .filter(contact => contact.name && contact.phoneNumbers?.length)
        .map(contact => ({
          ...contact,
          searchableText: `${contact.name} ${contact.phoneNumbers?.[0]?.number || ''}`.toLowerCase()
        }))
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      setCachedContacts(processedContacts);
      setContacts(processedContacts);
      setDisplayedContacts(processedContacts.slice(0, CONTACTS_PER_PAGE));
      setShowContactsModal(true);
    } catch (error) {
      console.error('Error accessing contacts:', error);
      Alert.alert('Error', 'Failed to access contacts. Please try again later.');
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const updateFormWithContact = (contact: EnhancedContact) => {
    // Get the phone number from the contact
    const phoneNumber = contact.phoneNumbers?.[0]?.number;
    if (!phoneNumber) {
      Alert.alert('Invalid Contact', 'Selected contact does not have a phone number');
      return;
    }

    // Format the phone number
    let formattedPhone = phoneNumber.replace(/[^\d+]/g, '');
    
    // Handle different phone number formats
    if (formattedPhone.startsWith('+234')) {
      formattedPhone = formattedPhone.substring(1); // Keep 234, just remove the +
    } else if (formattedPhone.startsWith('0')) {
      formattedPhone = `234${formattedPhone.substring(1)}`; // Replace 0 with 234
    } else if (!formattedPhone.startsWith('234')) {
      formattedPhone = `234${formattedPhone}`; // Add 234 prefix
    }

    // Validate the formatted number
    if (!validatePhoneNumber(formattedPhone)) {
      Alert.alert('Invalid Phone Number', 'The selected contact has an invalid phone number format');
      return;
    }

    // Update form data
    setFormData(prev => ({
      ...prev,
      name: contact.name || '',
      phone: formattedPhone
    }));

    // Close the contacts modal
    setShowContactsModal(false);

    // Clear any previous phone errors
    setFormErrors(prev => {
      const { phone, ...rest } = prev;
      return rest;
    });
  };

  // Add debounce function
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  // Modify search input handling with debounce
  const handleSearchQueryChange = debounce((query: string) => {
    setSearchQuery(query);
  }, 300);

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load saved form data
        const savedFormData = await AsyncStorage.getItem('receiverFormData');
        if (savedFormData) {
          const parsedData = JSON.parse(savedFormData);
          setFormData(prev => ({
            ...prev,
            ...parsedData,
            // Ensure phone number is properly formatted
            phone: parsedData.phone ? formatPhoneNumber(parsedData.phone) : ''
          }));
        }

        // Load draft data if available
        const draft = await StorageService.getOrderDraft();
        if (draft?.receiver?.phone || draft?.receiver?.name) {
          setFormData(prev => ({
            ...prev,
            ...draft.receiver,
            // Ensure phone number is properly formatted
            phone: draft.receiver?.phone ? formatPhoneNumber(draft.receiver.phone) : ''
          }));
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, []);

  const formatPhoneNumber = (phoneNumber: string): string => {
    // Remove all non-digit characters except plus sign
    let formattedPhone = phoneNumber.replace(/[^\d+]/g, '');
    
    // Handle different phone number formats
    if (formattedPhone.startsWith('+234')) {
      formattedPhone = formattedPhone.substring(1); // Keep 234, just remove the +
    } else if (formattedPhone.startsWith('0')) {
      formattedPhone = `234${formattedPhone.substring(1)}`; // Replace 0 with 234
    } else if (!formattedPhone.startsWith('234')) {
      formattedPhone = `234${formattedPhone}`; // Add 234 prefix
    }

    return formattedPhone;
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
            style={[styles.input, formErrors.name && styles.inputError]}
            value={formData.name}
            onChangeText={(name) => {
              setFormData(prev => ({ ...prev, name }));
              setFormErrors(prev => ({ ...prev, name: undefined }));
            }}
            placeholder="Enter Receiver's Name"
            placeholderTextColor="#999"
          />
          {formErrors.name && (
            <Text style={styles.errorText}>{formErrors.name}</Text>
          )}
        </View>

        {formData.deliveryMethod === 'delivery' && (
          <>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
              <TouchableOpacity 
                style={styles.addressInput}
                onPress={handleAddressSearch}
              >
                <Text style={formData.address ? styles.addressText : styles.placeholderText}>
                  {formData.address || 'Search for address'}
                </Text>
                <Ionicons name="search" size={20} color="#666" />
              </TouchableOpacity>
              {formErrors.address && (
                <Text style={styles.errorText}>{formErrors.address}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.manualEntryButton}
              onPress={() => setShowAddressFields(!showAddressFields)}
            >
              <Ionicons 
                name={showAddressFields ? "chevron-down-outline" : "create-outline"} 
                size={20} 
                color="#4A90E2" 
              />
              <Text style={styles.manualEntryText}>
                {showAddressFields ? 'Hide address details' : 'Enter address manually'}
              </Text>
            </TouchableOpacity>

            {showAddressFields && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Street/Door Number</Text>
          <TextInput
                    style={styles.input}
                    value={formData.streetNumber}
                    onChangeText={(streetNumber) => {
                      setFormData(prev => ({ ...prev, streetNumber }));
                    }}
                    placeholder="Enter Street/Door Number"
            placeholderTextColor="#999"
          />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Landmark</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.landmark}
                    onChangeText={(landmark) => {
                      setFormData(prev => ({ ...prev, landmark }));
                    }}
                    placeholder="Enter Landmark"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Locality</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.locality}
                    onChangeText={(locality) => {
                      setFormData(prev => ({ ...prev, locality }));
                    }}
                    placeholder="Enter Locality"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>City</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.city}
                    onChangeText={(city) => {
                      setFormData(prev => ({ ...prev, city }));
                    }}
                    placeholder="Enter City"
                    placeholderTextColor="#999"
                  />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>State</Text>
          <TextInput
            style={[styles.input, formErrors.state && styles.inputError]}
            value={formData.state}
            onChangeText={(state) => {
              setFormData(prev => ({ ...prev, state }));
              setFormErrors(prev => ({ ...prev, state: undefined }));
            }}
            placeholder="Enter State"
            placeholderTextColor="#999"
          />
          {formErrors.state && (
            <Text style={styles.errorText}>{formErrors.state}</Text>
          )}
        </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Pincode</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.pincode}
                    onChangeText={(pincode) => {
                      setFormData(prev => ({ ...prev, pincode }));
                    }}
                    placeholder="Enter Pincode"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                </View>
              </>
            )}
          </>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.phoneInputWrapper}>
            <View style={[
              styles.phoneInputContainer,
              formErrors.phone && styles.inputError
            ]}>
              <Text style={styles.countryCode}>+234</Text>
              <TextInput
                ref={phoneInputRef}
                style={styles.phoneInputText}
                value={formData.phone.replace(/^234/, '')}
                onChangeText={(text) => {
                  // Remove any non-digit characters
                  const digitsOnly = text.replace(/\D/g, '');
                  // Add country code if not present
                  const phoneNumber = digitsOnly.startsWith('234') ? digitsOnly : `234${digitsOnly}`;
                  handlePhoneNumber(phoneNumber);
                }}
                keyboardType="phone-pad"
                placeholder="Enter phone number"
                placeholderTextColor="#999"
              />
            </View>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={handleSelectContact}
            >
              <Ionicons name="people-outline" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
          {formErrors.phone && (
            <Text style={styles.errorText}>{formErrors.phone}</Text>
          )}
        </View>

        {formData.deliveryMethod === 'pickup' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pickup Center</Text>
            <TextInput
              style={styles.input}
              value={formData.pickupCenter}
              onChangeText={(pickupCenter) => {
                setFormData(prev => ({ ...prev, pickupCenter }));
              }}
              placeholder="Enter Pickup Center"
              placeholderTextColor="#999"
            />
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.proceedButton, isLoading && styles.disabledButton]}
        onPress={handleProceed}
        disabled={isLoading}
      >
        <Text style={styles.proceedButtonText}>
          {isLoading ? 'Saving...' : 'Proceed'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showContactsModal}
        animationType="slide"
        onRequestClose={() => {
          setShowContactsModal(false);
          setSearchQuery('');
          setDisplayedContacts([]);
          setPage(0);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Contact</Text>
            <TouchableOpacity 
              onPress={() => {
                setShowContactsModal(false);
                setSearchQuery('');
                setDisplayedContacts([]);
                setPage(0);
              }}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts..."
              onChangeText={handleSearchQueryChange}
              placeholderTextColor="#999"
            />
          </View>

          {isLoadingContacts ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000" />
              <Text style={styles.loadingText}>Loading contacts...</Text>
            </View>
          ) : (
            <FlatList
              data={searchQuery ? filteredContacts : displayedContacts}
              renderItem={renderContactItem}
              keyExtractor={keyExtractor}
              ItemSeparatorComponent={ItemSeparator}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              getItemLayout={getItemLayout}
              removeClippedSubviews={true}
              ListEmptyComponent={EmptyListComponent}
            />
          )}
        </View>
      </Modal>
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
    gap: 8,
  },
  phoneInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  countryCode: {
    fontSize: 16,
    color: '#1A1A1A',
    marginRight: 8,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  phoneInputText: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    padding: 0,
  },
  contactButton: {
    width: 48,
    height: 48,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  manualEntryText: {
    marginLeft: 8,
    color: '#4A90E2',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 44, // Safe area for iOS
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    margin: 16,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default ReceiverDetails;
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Text, Linking, Modal, FlatList, ActivityIndicator } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PhoneInput, { ICountry } from 'react-native-international-phone-number';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Contacts from 'expo-contacts';

// Add constants at the top of the file
const CONTACTS_PER_PAGE = 20;

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

// Add interface for enhanced contact
interface EnhancedContact extends Contacts.Contact {
  searchableText?: string;
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

  // State hooks
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
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [contacts, setContacts] = useState<EnhancedContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [displayedContacts, setDisplayedContacts] = useState<EnhancedContact[]>([]);
  const [page, setPage] = useState(0);
  const [cachedContacts, setCachedContacts] = useState<EnhancedContact[]>([]);

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

  // Add cleanup effect at the top of the component
  useEffect(() => {
    // Cleanup function that runs when component unmounts
    return () => {
      // Clear the form data from AsyncStorage
      const cleanup = async () => {
        try {
          await AsyncStorage.removeItem('orderDraft');
        } catch (error) {
          console.error('Error cleaning up storage:', error);
        }
      };
      cleanup();
    };
  }, []);

  // Modify the address search handler
  const handleAddressSearch = async () => {
    try {
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
      console.error('Error handling address search:', error);
      Alert.alert('Error', 'Failed to process address search. Please try again.');
    }
  };

  // Add a separate cleanup effect for component unmount only
  useEffect(() => {
    return () => {
      const cleanup = async () => {
        try {
          // Only clear storage when leaving the screen completely
          if (!params.returnFromAddressSearch) {
            await AsyncStorage.removeItem('orderDraft');
          }
        } catch (error) {
          console.error('Error cleaning up storage:', error);
        }
      };
      cleanup();
    };
  }, [params.returnFromAddressSearch]);

  // Modify the address search results handler
  useEffect(() => {
    if (params.returnFromAddressSearch === 'true' && params.selectedAddress) {
      // Reset form data with new address data, preserving only name and phone
      setFormData({
        name: formData.name,
        phone: formData.phone,
        deliveryMethod: 'delivery',
        // Set new address data
        address: params.selectedAddress || '',
        streetNumber: params.selectedStreetNumber || '',
        landmark: params.selectedLandmark || '',
        locality: params.selectedLocality || '',
        city: params.selectedCity || '',
        state: params.selectedState || '',
        pincode: params.selectedPostalCode || '',
        // Clear other fields
        pickupCenter: '',
        specialInstructions: ''
      });

      // Show manual entry and clear errors
      setShowManualEntry(true);
      setFormErrors({});

      // Update AsyncStorage with new data
      const updateStorage = async () => {
        try {
          const savedOrderDraft = await AsyncStorage.getItem('orderDraft');
          const currentDraft = savedOrderDraft ? JSON.parse(savedOrderDraft) : {};
          
          await AsyncStorage.setItem('orderDraft', JSON.stringify({
            ...currentDraft,
            receiver: {
              name: formData.name,
              phone: formData.phone,
              deliveryMethod: 'delivery',
              address: params.selectedAddress || '',
              streetNumber: params.selectedStreetNumber || '',
              landmark: params.selectedLandmark || '',
              locality: params.selectedLocality || '',
              city: params.selectedCity || '',
              state: params.selectedState || '',
              pincode: params.selectedPostalCode || '',
              pickupCenter: '',
              specialInstructions: ''
            }
          }));
        } catch (error) {
          console.error('Error updating storage:', error);
        }
      };
      updateStorage();
    }
  }, [
    params.returnFromAddressSearch,
    params.selectedAddress,
    params.selectedStreetNumber,
    params.selectedLandmark,
    params.selectedLocality,
    params.selectedCity,
    params.selectedState,
    params.selectedPostalCode,
    formData.name,
    formData.phone
  ]);

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
              // Ensure all fields are populated
              streetNumber: parsedDraft.receiver.streetNumber || prev.streetNumber,
              landmark: parsedDraft.receiver.landmark || prev.landmark,
              locality: parsedDraft.receiver.locality || prev.locality,
              city: parsedDraft.receiver.city || prev.city,
              state: parsedDraft.receiver.state || prev.state,
              pincode: parsedDraft.receiver.pincode || prev.pincode
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

  // Replace handleSelectContact function
  const handleSelectContact = async () => {
    try {
      setIsLoadingContacts(true);

      // Check if we have cached contacts
      if (cachedContacts.length > 0) {
        setContacts(cachedContacts);
        setDisplayedContacts(cachedContacts.slice(0, CONTACTS_PER_PAGE));
        setShowContactsModal(true);
        setIsLoadingContacts(false);
        return;
      }

      const { status: existingStatus } = await Contacts.getPermissionsAsync();
      
      if (existingStatus !== 'granted') {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Denied',
            'Cannot access contacts without permission. Please enable contacts access in your phone settings to use this feature.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          return;
        }
      }

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
    setFormData(prev => {
      const updatedForm = {
        ...prev,
        name: contact.name || prev.name,
        phone: contact.phoneNumbers?.[0]?.number?.replace(/\D/g, '') || prev.phone,
      };

      // Handle address fields based on current delivery method
      if (prev.deliveryMethod === 'delivery' && contact.addresses?.[0]) {
        const addr = contact.addresses[0];
        const formattedAddress = [
          addr.street,
          addr.city,
          addr.region,
          addr.postalCode,
          addr.country
        ].filter(Boolean).join(', ');

        updatedForm.address = formattedAddress;
        updatedForm.streetNumber = addr.street || '';
        updatedForm.city = addr.city || '';
        updatedForm.state = addr.region || '';
        updatedForm.pincode = addr.postalCode || '';
        setShowManualEntry(true);
      } else if (prev.deliveryMethod === 'pickup') {
        // Keep pickup center and clear address fields
        updatedForm.address = '';
        updatedForm.streetNumber = '';
        updatedForm.city = '';
        updatedForm.state = prev.state; // Preserve state
        updatedForm.pincode = '';
        updatedForm.pickupCenter = prev.pickupCenter || '';
      }

      return updatedForm;
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
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={handleSelectContact}
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
          isLoading && styles.disabledButton
        ]} 
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
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
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
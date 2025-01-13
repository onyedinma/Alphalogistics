import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PhoneInput, { ICountry } from 'react-native-international-phone-number';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Modal from 'react-native-modal';

const COUNTRIES = [
  { name: 'Nigeria', code: 'NG' },
  { name: 'Ghana', code: 'GH' }
];

interface ReceiverDetails {
  name: string;
  address?: string;
  state: string;
  pickupCenter?: string;
  phoneNumber: string;
  deliveryMethod: 'pickup' | 'delivery';
  country: string;
}

export default function ReceiverDetailsScreen() {
  const params = useLocalSearchParams<{
    address?: string;
    state?: string;
    name?: string;
    phoneNumber?: string;
    country?: string;
    deliveryMethod?: 'pickup' | 'delivery';
  }>();

  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>(params.deliveryMethod as 'pickup' | 'delivery' || 'pickup');
  const [selectedCountry, setSelectedCountry] = useState<ICountry | null>(() => {
    if (params.country) {
      return {
        name: params.country as any,
        callingCode: params.country === 'Nigeria' ? '234' : '233',
        cca2: params.country === 'Nigeria' ? 'NG' : 'GH',
        flag: params.country === 'Nigeria' ? '🇳🇬' : '🇬🇭'
      };
    }
    return {
      name: 'Nigeria',
      callingCode: '234',
      cca2: 'NG',
      flag: '🇳🇬'
    };
  });
  const [receiverDetails, setReceiverDetails] = useState<ReceiverDetails>({
    name: params.name || '',
    state: params.state || '',
    phoneNumber: params.phoneNumber || '',
    deliveryMethod: params.deliveryMethod as 'pickup' | 'delivery' || 'pickup',
    country: params.country || 'Nigeria',
    address: params.address,
  });
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);

  useEffect(() => {
    if (params.address) {
      setReceiverDetails(prev => ({
        ...prev,
        address: params.address,
        state: params.state || prev.state,
        deliveryMethod: 'delivery',
      }));
      setDeliveryMethod('delivery');
    }
  }, [params.address, params.state]);

  const handlePhoneNumber = (phoneNumber: string) => {
    setReceiverDetails(prev => ({ ...prev, phoneNumber }));
  };

  const handleSelectedCountry = (country: ICountry) => {
    setSelectedCountry(country);
  };

  const handleCountrySelect = (country: string) => {
    setReceiverDetails(prev => ({ ...prev, country }));
    const countryData: ICountry = {
      name: country as any,
      callingCode: country === 'Nigeria' ? '234' : '233',
      cca2: country === 'Nigeria' ? 'NG' : 'GH',
      flag: country === 'Nigeria' ? '🇳🇬' : '🇬🇭'
    };
    setSelectedCountry(countryData);
  };

  const handleAddressSearch = () => {
    router.push({
      pathname: '/(dashboard)/customer/address-search',
      params: { 
        returnTo: 'receiver',
        // Pass current form state to preserve it
        name: receiverDetails.name,
        phoneNumber: receiverDetails.phoneNumber,
        country: receiverDetails.country,
        deliveryMethod: deliveryMethod,
      }
    });
  };

  const handleContinue = async () => {
    try {
      // Validate fields based on delivery method
      if (!receiverDetails.name || !receiverDetails.state || !receiverDetails.phoneNumber) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      if (deliveryMethod === 'pickup' && !receiverDetails.pickupCenter) {
        Alert.alert('Error', 'Please select a pickup center');
        return;
      }

      if (deliveryMethod === 'delivery' && !receiverDetails.address) {
        Alert.alert('Error', 'Please enter delivery address');
        return;
      }

      // Format the data to match the ContactDetails interface used in new-order.tsx
      const formattedDetails = {
        name: receiverDetails.name,
        address: receiverDetails.address || '',
        state: receiverDetails.state,
        phone: receiverDetails.phoneNumber
      };

      await AsyncStorage.setItem('receiverDetails', JSON.stringify(formattedDetails));
      
      // Navigate directly to new-order screen instead of going back
      router.push('/(dashboard)/customer/new-order');
    } catch (error) {
      console.error('Error saving receiver details:', error);
      Alert.alert('Error', 'Failed to save receiver details');
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
              deliveryMethod === 'pickup' && styles.selectedMethod
            ]}
            onPress={() => {
              setDeliveryMethod('pickup');
              setReceiverDetails(prev => ({
                ...prev,
                deliveryMethod: 'pickup',
                address: undefined
              }));
            }}
          >
            <Ionicons name="business-outline" size={20} color={deliveryMethod === 'pickup' ? '#fff' : '#666'} />
            <Text style={deliveryMethod === 'pickup' ? styles.selectedMethodText : styles.methodText}>Pick-up Center</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.methodButton,
              deliveryMethod === 'delivery' && styles.selectedMethod
            ]}
            onPress={() => {
              setDeliveryMethod('delivery');
              setReceiverDetails(prev => ({
                ...prev,
                deliveryMethod: 'delivery',
                pickupCenter: undefined
              }));
            }}
          >
            <Ionicons name="home-outline" size={20} color={deliveryMethod === 'delivery' ? '#fff' : '#666'} />
            <Text style={deliveryMethod === 'delivery' ? styles.selectedMethodText : styles.methodText}>Home Delivery</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Receiver's Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Receivers Name"
            placeholderTextColor="#999"
            value={receiverDetails.name}
            onChangeText={(text) => setReceiverDetails(prev => ({ ...prev, name: text }))}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Destination Country</Text>
          <TouchableOpacity 
            style={styles.input}
            onPress={() => setIsCountryModalVisible(true)}
          >
            <Text style={receiverDetails.country ? styles.inputText : styles.placeholder}>
              {receiverDetails.country || 'Select destination country'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Country Selection Modal */}
        <Modal
          isVisible={isCountryModalVisible}
          onBackdropPress={() => setIsCountryModalVisible(false)}
          style={styles.modal}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select destination Country</Text>
              <TouchableOpacity onPress={() => setIsCountryModalVisible(false)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
            
            {COUNTRIES.map((country) => (
              <TouchableOpacity
                key={country.code}
                style={styles.countryItem}
                onPress={() => {
                  handleCountrySelect(country.name);
                  setIsCountryModalVisible(false);
                }}
              >
                <Text style={styles.countryText}>{country.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Modal>

        {deliveryMethod === 'delivery' ? (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Address</Text>
            <TouchableOpacity 
              style={styles.input}
              onPress={handleAddressSearch}
            >
              <Text style={receiverDetails.address ? styles.inputText : styles.placeholder}>
                {receiverDetails.address || 'Search Address'}
              </Text>
              <Ionicons name="search" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Select Pick-up Center</Text>
            <TouchableOpacity style={styles.input}>
              <Text style={styles.placeholder}>Select Pick-up Center</Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <PhoneInput
            value={receiverDetails.phoneNumber}
            onChangePhoneNumber={handlePhoneNumber}
            selectedCountry={selectedCountry}
            onChangeSelectedCountry={handleSelectedCountry}
            defaultCountry="NG"
            theme="light"
            phoneInputStyles={{
              container: styles.phoneInputContainer,
              flagContainer: styles.flagContainer,
              input: styles.phoneInput,
            }}
          />
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueButtonText}>Continue</Text>
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
    fontSize: 14,
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 20,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  inputText: {
    fontSize: 14,
    color: '#333',
  },
  placeholder: {
    fontSize: 14,
    color: '#999',
  },
  phoneInputContainer: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    height: 48,
  },
  flagContainer: {
    backgroundColor: '#F9F9F9',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  phoneInput: {
    fontSize: 14,
    color: '#333',
  },
  continueButton: {
    backgroundColor: '#000',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    color: '#666',
    fontSize: 16,
  },
  countryItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  countryText: {
    fontSize: 16,
    color: '#333',
  },
}); 
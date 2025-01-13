import 'react-native-get-random-values';
import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Text, Modal, FlatList } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import CountryPicker, { CountryCode } from 'react-native-country-picker-modal';
import { LogBox } from 'react-native';
import PhoneInput, { ICountry } from 'react-native-international-phone-number';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Suppress defaultProps warnings
LogBox.ignoreLogs([
  'Warning: CountryModal:',
  'Warning: CountryList:',
  'Warning: CountryFilter:',
  'Warning: CountryItem:'
]);

// Define the states list
const STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'FCT'
];

export default function SenderDetails() {
  const params = useLocalSearchParams<{
    name?: string;
    address?: string;
    state?: string;
    phone?: string;
    receiverName?: string;
    receiverAddress?: string;
    receiverState?: string;
    receiverPhone?: string;
  }>();

  const [name, setName] = useState(params.name || '');
  const [address, setAddress] = useState(params.address || '');
  const [state, setState] = useState(params.state || '');
  const [showStates, setShowStates] = useState(false);
  const [phone, setPhone] = useState(params.phone || '');
  
  // Initialize country data properly with the correct type
  const [selectedCountry, setSelectedCountry] = useState<ICountry>({
    name: 'Nigeria' as any,
    callingCode: '234',
    cca2: 'NG',
    flag: '🇳🇬'
  });

  useEffect(() => {
    if (params.address) {
      setAddress(params.address);
      if (params.state) setState(params.state);
    }
  }, [params.address, params.state]);

  const handleStateSelect = (selectedState: string) => {
    setState(selectedState);
    setShowStates(false);
  };

  const searchAddress = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Please allow location access to search addresses');
        return;
      }

      const result = await Location.geocodeAsync(address);
      if (result.length > 0) {
        const { latitude, longitude } = result[0];
        const locations = await Location.reverseGeocodeAsync({ latitude, longitude });
        
        if (locations.length > 0) {
          const location = locations[0];
          setAddress(`${location.street || ''} ${location.district || ''}, ${location.city || ''}`);
          setState(location.region || '');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search address');
    }
  };

  const handleProceed = async () => {
    if (!name || !address || !state || !phone) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const senderDetails = {
      name,
      address,
      state,
      phone
    };

    try {
      await AsyncStorage.setItem('senderDetails', JSON.stringify(senderDetails));
    } catch (error) {
      console.log('Error saving sender details:', error);
    }

    router.push('/(dashboard)/customer/new-order');
  };

  const handleSelectedCountry = (country: ICountry) => {
    setSelectedCountry(country);
  };

  const handlePhoneNumber = (phoneNumber: string) => {
    setPhone(phoneNumber);
  };

  const handleAddressSearch = () => {
    router.push({
      pathname: '/(dashboard)/customer/address-search',
      params: {
        returnTo: 'sender',
        // Pass current form state to preserve it
        name,
        phone,
        state,
      }
    });
  };

  const renderStateItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.inputContainer}
      onPress={() => handleStateSelect(item)}
    >
      <Text style={[
        styles.stateItemText,
        state === item && styles.selectedStateText
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Sender Details',
          headerShadowVisible: false,
        }}
      />

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={24} color="#4A90E2" />
        <ThemedText style={styles.infoText}>
          Your selected sender will be used to deliver your item to its destination.
        </ThemedText>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Sender's Name</ThemedText>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#4A90E2" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter Sender's Name"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Address</ThemedText>
          <TouchableOpacity 
            style={styles.inputContainer}
            onPress={handleAddressSearch}
          >
            <Ionicons name="location-outline" size={20} color="#4A90E2" style={styles.inputIcon} />
            <ThemedText style={address ? styles.inputText : styles.placeholder}>
              {address || 'Enter Address'}
            </ThemedText>
            <Ionicons name="search" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>State</ThemedText>
          <TouchableOpacity
            style={styles.inputContainer}
            onPress={() => setShowStates(!showStates)}
          >
            <Ionicons name="flag-outline" size={20} color="#4A90E2" style={styles.inputIcon} />
            <Text style={state ? styles.inputText : styles.placeholder}>
              {state || 'Select State'}
            </Text>
            <Ionicons 
              name={showStates ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#4A90E2" 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Phone Number</ThemedText>
          <PhoneInput
            value={phone}
            onChangePhoneNumber={handlePhoneNumber}
            selectedCountry={selectedCountry}
            onChangeSelectedCountry={handleSelectedCountry}
            defaultCountry="NG"
            theme="light"
            phoneInputStyles={{
              container: {
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
              input: {
                fontSize: 14,
                color: '#333',
              }
            }}
          />
          {phone && !selectedCountry?.callingCode && (
            <Text style={styles.errorText}>Enter a valid phone number</Text>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.proceedButton} onPress={handleProceed}>
        <ThemedText style={styles.proceedButtonText}>Proceed</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 12,
    marginVertical: 16,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    color: '#333',
    fontSize: 14,
  },
  form: {
    paddingHorizontal: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  placeholder: {
    color: '#A0A0A0',
    fontSize: 14,
    flex: 1,
  },
  inputText: {
    color: '#333',
    fontSize: 14,
    flex: 1,
  },
  proceedButton: {
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
    marginBottom: 30,
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  stateItemText: {
    fontSize: 16,
    color: '#4A4A4A',
  },
  selectedStateText: {
    color: '#4A90E2',
    fontWeight: '500',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  countryPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  callingCode: {
    fontSize: 14,
    color: '#4A90E2',
    marginLeft: 8,
  },
}); 
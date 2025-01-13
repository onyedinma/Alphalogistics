import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TextInput, FlatList, TouchableOpacity, Text, Alert, ScrollView } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';

// Define interfaces
interface GooglePlaceData {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

// Predefined countries and states
const COUNTRIES = [
  {
    name: 'Nigeria',
    code: 'ng',
    states: [
      'Lagos',
      'Abuja',
      'Rivers',
      'Kano',
      'Oyo',
      'Delta',
      'Kaduna',
      'Ogun',
      'Ondo',
      'Edo',
    ]
  },
  {
    name: 'United States',
    code: 'us',
    states: [
      'California',
      'New York',
      'Texas',
      'Florida',
      'Illinois',
    ]
  }
];

export default function AddressSearch() {
  const params = useLocalSearchParams<{ 
    returnTo?: string;
    name?: string;
    phone?: string;
    phoneNumber?: string;
    state?: string;
    country?: string;
    deliveryMethod?: string;
  }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<GooglePlaceData[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('ng');
  const [selectedState, setSelectedState] = useState('');
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      const fetchPredictions = async () => {
        if (searchQuery.length < 3) {
          setPredictions([]);
          return;
        }
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
              searchQuery
            )}&key=AIzaSyDZ5iJmOjngMwqNoqayEwiMXIRo9IPrgk4&components=country:${selectedCountry}&language=en`
          );
          const json = await response.json();
          setPredictions(json.predictions || []);
        } catch (error) {
          console.error('Error fetching predictions:', error);
          Alert.alert('Error', 'Failed to fetch address predictions. Please try again.');
        }
      };

      fetchPredictions();
    }, 300);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchQuery, selectedCountry]);

  const handleSelect = async (data: GooglePlaceData) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${data.place_id}&key=AIzaSyDZ5iJmOjngMwqNoqayEwiMXIRo9IPrgk4&language=en`
      );
      const json = await response.json();
      const details = json.result;

      let stateName = selectedState;

      if (!stateName && details?.address_components) {
        const stateComponent = details.address_components.find(
          (c: AddressComponent) => c.types.includes('administrative_area_level_1')
        );
        if (stateComponent) {
          stateName = stateComponent.long_name;
        }
      }

      const returnPath = params.returnTo === 'receiver' 
        ? '/(dashboard)/customer/receiver-details'
        : '/(dashboard)/customer/sender';

      router.push({
        pathname: returnPath,
        params: {
          address: details?.formatted_address || data.description,
          state: stateName,
          name: params.name,
          phone: params.phone || params.phoneNumber,
          country: params.country,
          deliveryMethod: params.deliveryMethod,
        },
      });
    } catch (error) {
      console.error('Error fetching place details:', error);
      Alert.alert('Error', 'Failed to fetch place details. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Search Address',
          headerShadowVisible: false,
        }}
      />

      {/* Country Selection */}
      <View style={styles.selectContainer}>
        <Text style={styles.label}>Select Country:</Text>
        <View style={styles.buttonContainer}>
          {COUNTRIES.map((country) => (
            <TouchableOpacity
              key={country.code}
              style={[
                styles.countryButton,
                selectedCountry === country.code && styles.selectedButton,
              ]}
              onPress={() => {
                setSelectedCountry(country.code);
                setSelectedState('');
              }}
            >
              <Text style={[
                styles.buttonText,
                selectedCountry === country.code && styles.selectedButtonText
              ]}>
                {country.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* State Selection */}
      <View style={styles.selectContainer}>
        <Text style={styles.label}>Select State:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.buttonContainer}>
            {COUNTRIES.find(c => c.code === selectedCountry)?.states.map((state) => (
              <TouchableOpacity
                key={state}
                style={[
                  styles.stateButton,
                  selectedState === state && styles.selectedButton,
                ]}
                onPress={() => setSelectedState(state)}
              >
                <Text style={[
                  styles.buttonText,
                  selectedState === state && styles.selectedButtonText
                ]}>
                  {state}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search Address"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={predictions}
        keyExtractor={(item) => item.place_id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleSelect(item)} style={styles.predictionItem}>
            <Text>{item.description}</Text>
          </TouchableOpacity>
        )}
        style={styles.predictionsList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  selectContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  countryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  stateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  selectedButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#333',
  },
  selectedButtonText: {
    color: '#fff',
  },
  searchInput: {
    fontSize: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  predictionsList: {
    marginTop: 8,
  },
  predictionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
}); 
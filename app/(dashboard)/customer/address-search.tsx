import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GOOGLE_MAPS_API_KEY } from '@/config/maps';

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface RouteParams {
  onSelect?: string;
  returnTo?: string;
}

const COUNTRIES = [
  { code: 'ng', name: 'Nigeria' },
  { code: 'gh', name: 'Ghana' },
];

export default function AddressSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const params = useLocalSearchParams<RouteParams>();

  const searchPlaces = async (query: string) => {
    if (!query.trim()) {
      setPredictions([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&components=country:${selectedCountry.code}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK') {
        setPredictions(data.predictions);
      } else {
        console.error('Places API error:', data.status);
        setPredictions([]);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
      Alert.alert('Error', 'Failed to fetch address suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaceDetails = async (placeId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,address_components,geometry&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        const addressComponents = data.result.address_components;
        let state = '';
        let country = '';
        let streetNumber = '';
        let route = '';
        let locality = '';
        let sublocality = '';
        let city = '';
        let postalCode = '';
        let landmark = '';
        
        // Extract all address components
        for (const component of addressComponents) {
          const types = component.types;
          const value = component.long_name;
          
          if (types.includes('street_number')) {
            streetNumber = value;
          }
          if (types.includes('route')) {
            route = value;
          }
          if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
            sublocality = value;
          }
          if (types.includes('locality')) {
            city = value;
          }
          if (types.includes('administrative_area_level_2')) {
            if (!city) city = value;
          }
          if (types.includes('administrative_area_level_1')) {
            state = value;
          }
          if (types.includes('country')) {
            country = value;
          }
          if (types.includes('postal_code')) {
            postalCode = value;
          }
          if (types.includes('point_of_interest') || types.includes('establishment')) {
            landmark = value;
          }
          if (types.includes('neighborhood') && !locality) {
            locality = value;
          }
        }

        // Build street address
        const streetAddress = [streetNumber, route].filter(Boolean).join(' ');
        
        // Set locality fallbacks
        if (!locality) {
          locality = sublocality || city || '';
        }

        // Ensure we have a city value
        if (!city) {
          city = locality || sublocality || '';
        }

        // Use Google's formatted address as fallback
        const completeAddress = data.result.formatted_address;

        if (params.returnTo === 'receiver') {
          router.push({
            pathname: '/customer/receiver',
            params: {
              returnFromAddressSearch: 'true',
              selectedAddress: completeAddress,
              selectedState: state,
              selectedStreetNumber: streetAddress,
              selectedLandmark: landmark,
              selectedLocality: locality,
              selectedCity: city,
              selectedPostalCode: postalCode
            }
          });
        } else if (params.returnTo === 'sender') {
          router.push({
            pathname: '/customer/sender',
            params: {
              selectedAddress: completeAddress,
              selectedState: state,
              returnFromAddressSearch: 'true'
            }
          });
        }
      } else {
        throw new Error('Failed to get place details');
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      Alert.alert('Error', 'Failed to get address details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (searchQuery) {
        searchPlaces(searchQuery);
      }
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, selectedCountry]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Search Address',
          headerShadowVisible: false,
        }}
      />

      <View style={styles.searchContainer}>
        <View style={styles.countrySelector}>
          {COUNTRIES.map((country) => (
            <TouchableOpacity
              key={country.code}
              style={[
                styles.countryButton,
                selectedCountry.code === country.code && styles.selectedCountry,
              ]}
              onPress={() => setSelectedCountry(country)}
            >
              <Text
                style={[
                  styles.countryButtonText,
                  selectedCountry.code === country.code && styles.selectedCountryText,
                ]}
              >
                {country.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search for an address in ${selectedCountry.name}`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <ScrollView style={styles.predictionsContainer}>
          {predictions.map((prediction) => (
            <TouchableOpacity
              key={prediction.place_id}
              style={styles.predictionItem}
              onPress={() => getPlaceDetails(prediction.place_id)}
            >
              <View style={styles.predictionContent}>
                <Text style={styles.mainText}>
                  {prediction.structured_formatting.main_text}
                </Text>
                <Text style={styles.secondaryText}>
                  {prediction.structured_formatting.secondary_text}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  countrySelector: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
  },
  countryButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  selectedCountry: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  countryButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  selectedCountryText: {
    color: '#000000',
    fontWeight: '500',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  predictionsContainer: {
    flex: 1,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  predictionContent: {
    flex: 1,
    marginRight: 12,
  },
  mainText: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 4,
  },
  secondaryText: {
    fontSize: 14,
    color: '#666666',
  },
}); 
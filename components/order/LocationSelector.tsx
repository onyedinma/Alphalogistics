import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Location } from '@/types';
import MapView, { Marker } from 'react-native-maps';
import * as ExpoLocation from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

interface LocationSelectorProps {
  type: 'pickup' | 'delivery';
  location: Location | null;
  onLocationSelect: (location: Location) => void;
}

export function LocationSelector({ type, location, onLocationSelect }: LocationSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    (async () => {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await ExpoLocation.getCurrentPositionAsync({});
      const currentLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: 'Current Location',
      };
      setCurrentLocation(currentLoc);
      setMapRegion({
        ...mapRegion,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  const handleUseCurrentLocation = () => {
    if (currentLocation) {
      onLocationSelect(currentLocation);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${type === 'pickup' ? 'pickup' : 'delivery'} location`}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {currentLocation && (
          <TouchableOpacity 
            style={styles.currentLocationButton}
            onPress={handleUseCurrentLocation}
          >
            <Ionicons name="location" size={20} color="#007AFF" />
            <ThemedText style={styles.currentLocationText}>Use current location</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      <MapView
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={type === 'pickup' ? 'Pickup Location' : 'Delivery Location'}
          />
        )}
      </MapView>

      <TouchableOpacity
        style={styles.confirmButton}
        onPress={() => {
          // For now, we'll just use the map center as the selected location
          onLocationSelect({
            latitude: mapRegion.latitude,
            longitude: mapRegion.longitude,
            address: searchQuery || 'Selected Location',
          });
        }}
      >
        <ThemedText style={styles.confirmButtonText}>
          Confirm {type === 'pickup' ? 'Pickup' : 'Delivery'} Location
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  currentLocationText: {
    marginLeft: 8,
    color: '#007AFF',
  },
  map: {
    width: Dimensions.get('window').width,
    height: 300,
  },
  confirmButton: {
    margin: 16,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
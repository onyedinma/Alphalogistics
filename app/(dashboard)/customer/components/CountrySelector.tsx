import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CountryCode, countryCodes } from '../constants/countryCodes';

interface CountrySelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (country: CountryCode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  visible,
  onClose,
  onSelect,
  searchQuery,
  onSearchChange,
}) => {
  const filteredCountries = countryCodes.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.prefix.includes(searchQuery)
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Country</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search countries..."
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholderTextColor="#999"
          />
        </View>

        <FlatList
          data={filteredCountries}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.countryItem}
              onPress={() => onSelect(item)}
            >
              <Text style={styles.flag}>{item.flag}</Text>
              <View style={styles.countryInfo}>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.countryCode}>+{item.prefix}</Text>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
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
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    color: '#000',
  },
  countryCode: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
});

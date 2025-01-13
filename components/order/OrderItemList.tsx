import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { OrderItem } from '@/types';

interface OrderItemListProps {
  items: OrderItem[];
  onRemoveItem: (id: string) => void;
}

export function OrderItemList({ items, onRemoveItem }: OrderItemListProps) {
  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>No items added yet</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {items.map((item) => (
        <View key={item.id} style={styles.itemContainer}>
          <View style={styles.itemInfo}>
            <ThemedText style={styles.description}>{item.description}</ThemedText>
            <ThemedText style={styles.details}>
              Qty: {item.quantity} {item.weight ? `• ${item.weight}kg` : ''}
            </ThemedText>
          </View>
          
          <TouchableOpacity
            onPress={() => onRemoveItem(item.id)}
            style={styles.removeButton}
          >
            <Ionicons name="close-circle-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  details: {
    color: '#666',
  },
  removeButton: {
    padding: 4,
  },
}); 
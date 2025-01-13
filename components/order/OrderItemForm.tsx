import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { OrderItem } from '@/types';

interface OrderItemFormProps {
  onSubmit: (item: Omit<OrderItem, 'id'>) => void;
}

export function OrderItemForm({ onSubmit }: OrderItemFormProps) {
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [weight, setWeight] = useState('');

  const handleSubmit = () => {
    if (!description.trim()) return;

    onSubmit({
      description: description.trim(),
      quantity: parseInt(quantity, 10) || 1,
      weight: parseFloat(weight) || undefined,
    });

    // Reset form
    setDescription('');
    setQuantity('1');
    setWeight('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Item description"
        value={description}
        onChangeText={setDescription}
      />
      
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="Quantity"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
        />
        
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="Weight (kg)"
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
        />
      </View>

      <TouchableOpacity 
        style={styles.button}
        onPress={handleSubmit}
      >
        <ThemedText style={styles.buttonText}>Add Item</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
}); 
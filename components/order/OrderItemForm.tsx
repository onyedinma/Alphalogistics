import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { OrderItem } from '@/types';

interface OrderItemFormProps {
  onSubmit: (item: Omit<OrderItem, 'id'>) => void;
}

export function OrderItemForm({ onSubmit }: OrderItemFormProps) {
  // Add missing state variables
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [weight, setWeight] = useState('');
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      category: category.trim(),
      subcategory: subcategory.trim(),
      quantity: parseInt(quantity, 10) || 1,
      weight: parseFloat(weight) || 0,
      value: parseFloat(value) || 0,
      description: '' // Added missing required description field
    });

    // Reset form
    setName('');
    setCategory('');
    setSubcategory('');
    setQuantity('1');
    setWeight('');
    setValue('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Item name"
        value={name}
        onChangeText={setName}
      />
      
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="Category"
          value={category}
          onChangeText={setCategory}
        />
        
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="Subcategory"
          value={subcategory}
          onChangeText={setSubcategory}
        />
      </View>
      
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.thirdInput]}
          placeholder="Quantity"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
        />
        
        <TextInput
          style={[styles.input, styles.thirdInput]}
          placeholder="Weight (kg)"
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
        />
        
        <TextInput
          style={[styles.input, styles.thirdInput]}
          placeholder="Value"
          value={value}
          onChangeText={setValue}
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
  thirdInput: {
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
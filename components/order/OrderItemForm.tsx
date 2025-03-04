import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { OrderItem } from '@/types';

interface OrderItemFormProps {
  onSubmit: (item: Omit<OrderItem, 'id'>) => void;
}

export function OrderItemForm({ onSubmit }: OrderItemFormProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [weight, setWeight] = useState('');
  const [value, setValue] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [isFragile, setIsFragile] = useState(false);
  const [requiresSpecialHandling, setRequiresSpecialHandling] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (parseInt(quantity, 10) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (parseFloat(weight) < 0) {
      newErrors.weight = 'Weight must be non-negative';
    }

    if (parseFloat(value) < 0) {
      newErrors.value = 'Value must be non-negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    onSubmit({
      name: name.trim(),
      category: category.trim(),
      subcategory: subcategory.trim(),
      quantity: parseInt(quantity, 10) || 1,
      weight: parseFloat(weight) || 0,
      value: parseFloat(value) || 0,
      isFragile,
      requiresSpecialHandling,
      specialInstructions: specialInstructions.trim(),
      dimensions: {
        length: parseFloat(length) || 0,
        width: parseFloat(width) || 0,
        height: parseFloat(height) || 0
      }
    });

    // Reset form
    setName('');
    setCategory('');
    setSubcategory('');
    setQuantity('1');
    setWeight('');
    setValue('');
    setLength('');
    setWidth('');
    setHeight('');
    setIsFragile(false);
    setRequiresSpecialHandling(false);
    setSpecialInstructions('');
    setErrors({});
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, errors.name && styles.inputError]}
        placeholder="Item name *"
        value={name}
        onChangeText={setName}
      />
      {errors.name && <ThemedText style={styles.errorText}>{errors.name}</ThemedText>}
      
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
          style={[styles.input, styles.thirdInput, errors.quantity && styles.inputError]}
          placeholder="Quantity *"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
        />
        
        <TextInput
          style={[styles.input, styles.thirdInput, errors.weight && styles.inputError]}
          placeholder="Weight (kg)"
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
        />
        
        <TextInput
          style={[styles.input, styles.thirdInput, errors.value && styles.inputError]}
          placeholder="Value"
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
        />
      </View>
      
      <View style={styles.row}>
        {errors.quantity && <ThemedText style={styles.errorText}>{errors.quantity}</ThemedText>}
        {errors.weight && <ThemedText style={styles.errorText}>{errors.weight}</ThemedText>}
        {errors.value && <ThemedText style={styles.errorText}>{errors.value}</ThemedText>}
      </View>

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.thirdInput]}
          placeholder="Length"
          value={length}
          onChangeText={setLength}
          keyboardType="decimal-pad"
        />
        
        <TextInput
          style={[styles.input, styles.thirdInput]}
          placeholder="Width"
          value={width}
          onChangeText={setWidth}
          keyboardType="decimal-pad"
        />
        
        <TextInput
          style={[styles.input, styles.thirdInput]}
          placeholder="Height"
          value={height}
          onChangeText={setHeight}
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.checkboxRow}>
        <TouchableOpacity 
          style={styles.checkbox} 
          onPress={() => setIsFragile(!isFragile)}
        >
          <View style={[styles.checkboxInner, isFragile && styles.checkboxChecked]} />
        </TouchableOpacity>
        <ThemedText>Fragile</ThemedText>

        <TouchableOpacity 
          style={[styles.checkbox, styles.checkboxMarginLeft]} 
          onPress={() => setRequiresSpecialHandling(!requiresSpecialHandling)}
        >
          <View style={[styles.checkboxInner, requiresSpecialHandling && styles.checkboxChecked]} />
        </TouchableOpacity>
        <ThemedText>Requires Special Handling</ThemedText>
      </View>

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Special Instructions"
        value={specialInstructions}
        onChangeText={setSpecialInstructions}
        multiline
        numberOfLines={3}
      />

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
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginBottom: 8,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxMarginLeft: {
    marginLeft: 16,
  },
  checkboxInner: {
    width: 14,
    height: 14,
    borderRadius: 2,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
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
import auth from '@react-native-firebase/auth';
import { StorageService } from '@/services/storage';
import { ItemDetails, OrderDraft, CategoryType } from './types';
import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Platform, StyleSheet, Modal } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ItemList {
  items: ItemDetails[];
  totalWeight: number;
  totalValue: number;
}

interface ItemFormData extends Omit<ItemDetails, 'quantity' | 'weight' | 'value' | 'dimensions'> {
  quantity: string;
  weight: string;
  value: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F9',
  },
  mainContainer: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
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
    color: '#1A1A1A',
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
    color: '#666666',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#1A1A1A',
  },
  input: {
    fontSize: 15,
    color: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 0,
    minHeight: 40,
  },
  inputText: {
    color: '#1A1A1A',
    fontSize: 15,
  },
  placeholder: {
    color: '#999',
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  currencyText: {
    fontSize: 15,
    color: '#1A1A1A',
    marginRight: 4,
  },
  imageContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  imagePreview: {
    width: 200,
    height: 200,
    marginBottom: 8,
    borderRadius: 8,
  },
  imageSourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  imageSourceText: {
    marginLeft: 4,
    color: '#1A1A1A',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoButtonText: {
    marginLeft: 4,
    color: '#666666',
    fontSize: 14,
  },
  specialHandlingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialHandlingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  specialHandlingButtonSelected: {
    backgroundColor: '#1A1A1A',
  },
  specialHandlingText: {
    marginLeft: 8,
    color: '#666666',
    fontSize: 14,
  },
  specialHandlingTextSelected: {
    color: '#FFFFFF',
  },
  instructionsInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  itemList: {
    marginTop: 24,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  itemCategory: {
    fontSize: 12,
    color: '#666666',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  itemDetail: {
    flex: 1,
  },
  itemDetailLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  itemDetailValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  totalSection: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666666',
  },
  totalValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  grandTotal: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxHeight: '80%',
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
    color: '#1A1A1A',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalList: {
    maxHeight: '80%',
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalItemText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  modalItemSubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  continueButton: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
  },
  categoryInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
    fontSize: 15,
    color: '#1A1A1A',
  },
});

const CATEGORIES_WITH_SUBCATEGORIES: Record<CategoryType, Array<{ name: string; weightRange: { min: number; max: number; step: number } }>> = {
  'electronics': [
    { name: 'Phones', weightRange: { min: 0.1, max: 2, step: 0.1 } },
    { name: 'Laptops', weightRange: { min: 0.5, max: 5, step: 0.1 } }
  ],
  'clothing': [
    { name: 'Clothes', weightRange: { min: 0.1, max: 10, step: 0.1 } }
  ],
  'documents': [
    { name: 'Papers', weightRange: { min: 0.1, max: 5, step: 0.1 } }
  ],
  'food': [
    { name: 'Perishables', weightRange: { min: 0.1, max: 20, step: 0.1 } },
    { name: 'Non-perishables', weightRange: { min: 0.1, max: 50, step: 0.1 } }
  ],
  'fragile': [
    { name: 'Glass', weightRange: { min: 0.1, max: 10, step: 0.1 } }
  ],
  'other': [
    { name: 'Miscellaneous', weightRange: { min: 0.1, max: 100, step: 0.1 } }
  ]
};

export default function ItemDetailsScreen() {
  const [itemList, setItemList] = useState<ItemList>({
    items: [],
    totalWeight: 0,
    totalValue: 0
  });

  const [currentItem, setCurrentItem] = useState<ItemFormData>({
    name: '',
    category: 'Electronics',
    subcategory: '',
    quantity: '',
    weight: '',
    value: '',
    isFragile: false,
    requiresSpecialHandling: false,
    specialInstructions: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Function to handle category selection
  const handleCategorySelect = (category: CategoryType) => {
    setCurrentItem(prev => ({
      ...prev,
      category,
      subcategory: '', // Reset subcategory when category changes
    }));
    setShowCategoryModal(false);
  };

  // Function to handle subcategory selection
  const handleSubcategorySelect = (subcategory: string) => {
    setCurrentItem(prev => ({
      ...prev,
      subcategory,
    }));
    setShowSubcategoryModal(false);
  };

  // Function to validate item details
  const validateItemDetails = () => {
    const errors: string[] = [];
    
    if (!currentItem.name.trim()) {
      errors.push('Item name is required');
    }
    if (!currentItem.category) {
      errors.push('Category is required');
    }
    if (!currentItem.subcategory) {
      errors.push('Subcategory is required');
    }
    if (!currentItem.quantity || Number(currentItem.quantity) <= 0) {
      errors.push('Valid quantity is required');
    }
    if (!currentItem.weight || Number(currentItem.weight) <= 0) {
      errors.push('Valid weight is required');
    }
    if (!currentItem.value || Number(currentItem.value) <= 0) {
      errors.push('Valid value is required');
    }

    if (errors.length > 0) {
      Alert.alert('Required Fields', errors.join('\n'));
      return false;
    }
    return true;
  };

  // Function to calculate totals
  const calculateTotals = (items: ItemDetails[]) => {
    return items.reduce((acc, item) => ({
      totalWeight: acc.totalWeight + (parseFloat(item.weight) * parseInt(item.quantity)),
      totalValue: acc.totalValue + (parseFloat(item.value) * parseInt(item.quantity))
    }), { totalWeight: 0, totalValue: 0 });
  };

  // Function to add new item
  const handleAddItem = async () => {
    if (!validateItemDetails()) return;

    setIsLoading(true);
    try {
      const newItem: ItemDetails = {
        name: currentItem.name.trim(),
        category: currentItem.category,
        subcategory: currentItem.subcategory,
        quantity: currentItem.quantity.toString(),
        weight: currentItem.weight.toString(),
        value: currentItem.value.toString(),
        isFragile: currentItem.isFragile,
        requiresSpecialHandling: currentItem.requiresSpecialHandling,
        specialInstructions: currentItem.specialInstructions || '',
        dimensions: currentItem.dimensions ? {
          length: currentItem.dimensions.length.toString(),
          width: currentItem.dimensions.width.toString(),
          height: currentItem.dimensions.height.toString()
        } : undefined
      };

      // Get existing order draft
      const orderDraft = await StorageService.getOrderDraft();
      if (!orderDraft) {
        throw new Error('No order draft found');
      }

      const updatedDraft: OrderDraft = {
        ...orderDraft,
        items: [...(orderDraft.items || []), newItem],
        pricing: {
          itemValue: calculateTotals([...orderDraft.items || [], newItem]).totalValue,
          deliveryFee: orderDraft.delivery?.fee || 0,
          total: calculateTotals([...orderDraft.items || [], newItem]).totalValue + (orderDraft.delivery?.fee || 0)
        }
      };

      await StorageService.saveOrderDraft(updatedDraft);

      // Update the itemList state
      const updatedItems = [...itemList.items, newItem];
      const { totalWeight, totalValue } = calculateTotals(updatedItems);
      setItemList({
        items: updatedItems,
        totalWeight,
        totalValue
      });

      // Reset form
      setCurrentItem({
        name: '',
        category: 'Electronics',
        subcategory: '',
        quantity: '',
        weight: '',
        value: '',
        isFragile: false,
        requiresSpecialHandling: false,
        specialInstructions: '',
        dimensions: {
          length: '',
          width: '',
          height: ''
        }
      });
      setSelectedImage(null);

      Alert.alert('Success', 'Item added successfully');
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle dimension changes
  const handleDimensionChange = (dimension: 'length' | 'width' | 'height', value: string) => {
    setCurrentItem(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [dimension]: value
      }
    }));
  };

  // Function to handle input changes
  const handleInputChange = (field: keyof ItemFormData, value: string) => {
    setCurrentItem(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Load saved items when component mounts
  useEffect(() => {
    loadSavedItems();
  }, []);

  // Function to load saved items
  const loadSavedItems = async () => {
    try {
      const orderDraft = await StorageService.getOrderDraft();
      if (!orderDraft) {
        console.log('No order draft found');
        return;
      }

      if (orderDraft.items && Array.isArray(orderDraft.items)) {
        const typedItems = orderDraft.items.map(item => {
          const dimensions = item.dimensions || { length: '0', width: '0', height: '0' };
          return {
            name: item.name || '',
            category: item.category as CategoryType,
            subcategory: item.subcategory || '',
            quantity: item.quantity.toString(),
            weight: item.weight.toString(),
            value: item.value.toString(),
            imageUri: item.imageUri,
            isFragile: item.isFragile || false,
            requiresSpecialHandling: item.requiresSpecialHandling || false,
            specialInstructions: item.specialInstructions,
            dimensions: {
              length: dimensions.length.toString(),
              width: dimensions.width.toString(),
              height: dimensions.height.toString()
            }
          };
        });
        
        const { totalWeight, totalValue } = calculateTotals(typedItems);
        setItemList({
          items: typedItems,
          totalWeight,
          totalValue
        });
      }
    } catch (error) {
      console.error('Error loading items:', error);
      Alert.alert('Error', 'Failed to load items');
    }
  };

  // Update the handleContinue function
  const handleContinue = async () => {
    if (itemList.items.length === 0) {
      Alert.alert('Error', 'Please add at least one item before continuing');
      return;
    }
    
    try {
      setIsLoading(true);
      // Get current draft
      const orderDraft = await StorageService.getOrderDraft();
      if (!orderDraft) {
        throw new Error('Order draft not found');
      }

      // Calculate totals
      const totalValue = itemList.items.reduce((sum, item) => sum + (Number(item.value) * Number(item.quantity)), 0);
      const deliveryFee = orderDraft.delivery?.fee || 0;

      // Create updated draft with all required fields
      const updatedDraft: OrderDraft = {
        ...orderDraft,
        items: itemList.items,
        delivery: {
          scheduledPickup: orderDraft.delivery?.scheduledPickup || new Date().toISOString(),
          vehicle: orderDraft.delivery?.vehicle || 'bike',
          fee: deliveryFee
        },
        pricing: {
          itemValue: totalValue,
          deliveryFee: deliveryFee,
          total: totalValue + deliveryFee
        },
        orderDetails: {
          status: 'draft',
          createdAt: orderDraft.orderDetails?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      await StorageService.saveOrderDraft(updatedDraft);
      router.push('/(dashboard)/customer/checkout');
    } catch (error) {
      console.error('Error preparing for checkout:', error);
      Alert.alert('Error', 'Failed to prepare for checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Item Details',
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={styles.mainContainer} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add Item</Text>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#666" />
          <Text style={styles.infoText}>
            Add details about the item you want to ship.
          </Text>
        </View>

        <View style={styles.card}>
          {/* Category Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.categoryInput}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={currentItem.category ? styles.inputText : styles.placeholder}>
                {currentItem.category || 'Select Category'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Subcategory Selection */}
          {currentItem.category && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Subcategory</Text>
              <TouchableOpacity
                style={styles.categoryInput}
                onPress={() => setShowSubcategoryModal(true)}
              >
                <Text style={currentItem.subcategory ? styles.inputText : styles.placeholder}>
                  {currentItem.subcategory || 'Select Subcategory'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Item Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Item Name</Text>
            <TextInput
              style={styles.input}
              value={currentItem.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Enter item name"
              placeholderTextColor="#999"
            />
          </View>

          {/* Quantity */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={currentItem.quantity}
              onChangeText={(value) => handleInputChange('quantity', value)}
              keyboardType="numeric"
              placeholder="Enter quantity"
              placeholderTextColor="#999"
            />
          </View>

          {/* Weight */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={currentItem.weight}
              onChangeText={(value) => handleInputChange('weight', value)}
              keyboardType="numeric"
              placeholder="Enter weight in kg"
              placeholderTextColor="#999"
            />
          </View>

          {/* Value */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Value (₦)</Text>
            <View style={styles.valueInput}>
              <Text style={styles.currencyText}>₦</Text>
              <TextInput
                style={[styles.input, { flex: 1, borderBottomWidth: 0, paddingLeft: 4 }]}
                value={currentItem.value}
                onChangeText={(value) => handleInputChange('value', value)}
                keyboardType="numeric"
                placeholder="Enter item value"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Dimensions */}
          <View style={styles.inputGroup}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Dimensions (cm)</Text>
              <TouchableOpacity style={styles.infoButton}>
                <Ionicons name="information-circle-outline" size={20} color="#666" />
                <Text style={styles.infoButtonText}>Optional</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.row, { gap: 16 }]}>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  value={currentItem.dimensions.length.toString()}
                  onChangeText={(value) => handleDimensionChange('length', value)}
                  keyboardType="numeric"
                  placeholder="Length"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  value={currentItem.dimensions.width.toString()}
                  onChangeText={(value) => handleDimensionChange('width', value)}
                  keyboardType="numeric"
                  placeholder="Width"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  value={currentItem.dimensions.height.toString()}
                  onChangeText={(value) => handleDimensionChange('height', value)}
                  keyboardType="numeric"
                  placeholder="Height"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>

          {/* Special Handling */}
          <View style={styles.inputGroup}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Special Handling</Text>
              <TouchableOpacity style={styles.infoButton}>
                <Ionicons name="information-circle-outline" size={20} color="#666" />
                <Text style={styles.infoButtonText}>Optional</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.specialHandlingContainer}>
              <TouchableOpacity
                style={[
                  styles.specialHandlingButton,
                  currentItem.isFragile && styles.specialHandlingButtonSelected,
                ]}
                onPress={() => setCurrentItem(prev => ({ ...prev, isFragile: !prev.isFragile }))}
              >
                <Ionicons
                  name={currentItem.isFragile ? "alert-circle" : "alert-circle-outline"}
                  size={20}
                  color={currentItem.isFragile ? "#fff" : "#333"}
                />
                <Text
                  style={[
                    styles.specialHandlingText,
                    currentItem.isFragile && styles.specialHandlingTextSelected,
                  ]}
                >
                  Fragile
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.specialHandlingButton,
                  currentItem.requiresSpecialHandling && styles.specialHandlingButtonSelected,
                ]}
                onPress={() => setCurrentItem(prev => ({ ...prev, requiresSpecialHandling: !prev.requiresSpecialHandling }))}
              >
                <Ionicons
                  name={currentItem.requiresSpecialHandling ? "hand-left" : "hand-left-outline"}
                  size={20}
                  color={currentItem.requiresSpecialHandling ? "#fff" : "#333"}
                />
                <Text
                  style={[
                    styles.specialHandlingText,
                    currentItem.requiresSpecialHandling && styles.specialHandlingTextSelected,
                  ]}
                >
                  Special Handling Required
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Special Instructions */}
          {(currentItem.isFragile || currentItem.requiresSpecialHandling) && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Special Instructions</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={currentItem.specialInstructions}
                onChangeText={(value) => handleInputChange('specialInstructions', value)}
                placeholder="Enter special handling instructions"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
            </View>
          )}
        </View>

        {/* Add Item Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddItem}
          disabled={isLoading}
        >
          <Text style={styles.addButtonText}>
            {isLoading ? 'Adding...' : isEditing ? 'Update Item' : 'Add Item'}
          </Text>
        </TouchableOpacity>

        {/* Item List */}
        {itemList.items.length > 0 && (
          <View style={styles.itemList}>
            {itemList.items.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemCategory}>{item.category} - {item.subcategory}</Text>
                </View>
                <View style={styles.itemDetails}>
                  <View style={styles.itemDetail}>
                    <Text style={styles.itemDetailLabel}>Quantity</Text>
                    <Text style={styles.itemDetailValue}>{item.quantity}</Text>
                  </View>
                  <View style={styles.itemDetail}>
                    <Text style={styles.itemDetailLabel}>Weight</Text>
                    <Text style={styles.itemDetailValue}>{item.weight} kg</Text>
                  </View>
                  <View style={styles.itemDetail}>
                    <Text style={styles.itemDetailLabel}>Value</Text>
                    <Text style={styles.itemDetailValue}>₦{item.value}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Totals Section */}
        {itemList.items.length > 0 && (
          <>
            <View style={styles.totalSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Weight</Text>
                <Text style={styles.totalValue}>{itemList.totalWeight.toFixed(2)} kg</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Value</Text>
                <Text style={styles.totalValue}>₦{itemList.totalValue.toFixed(2)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.continueButton, isLoading && styles.disabledButton]}
              onPress={handleContinue}
              disabled={isLoading}
            >
              <Text style={styles.continueButtonText}>
                {isLoading ? 'Processing...' : 'Continue to Checkout'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowCategoryModal(false)}
              >
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {Object.keys(CATEGORIES_WITH_SUBCATEGORIES).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={styles.modalItem}
                  onPress={() => handleCategorySelect(category as CategoryType)}
                >
                  <Text style={styles.modalItemText}>{category}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Subcategory Selection Modal */}
      <Modal
        visible={showSubcategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubcategoryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Subcategory</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowSubcategoryModal(false)}
              >
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {currentItem.category && CATEGORIES_WITH_SUBCATEGORIES[currentItem.category as CategoryType].map((subcat) => (
                <TouchableOpacity
                  key={subcat.name}
                  style={styles.modalItem}
                  onPress={() => handleSubcategorySelect(subcat.name)}
                >
                  <Text style={styles.modalItemText}>{subcat.name}</Text>
                  <Text style={styles.modalItemSubtext}>
                    Weight range: {subcat.weightRange.min} - {subcat.weightRange.max} kg
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

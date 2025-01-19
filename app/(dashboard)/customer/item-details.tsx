import auth from '@react-native-firebase/auth';
import { StorageService } from '@/services/storage';
import { ItemDetails, OrderDraft, CategoryType } from './types';
import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Platform, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ItemList {
  items: ItemDetails[];
  totalWeight: number;
  totalValue: number;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputText: {
    color: '#333',
  },
  placeholder: {
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  currencyText: {
    fontSize: 16,
    color: '#333',
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
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  imageSourceText: {
    marginLeft: 4,
    color: '#007AFF',
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoButtonText: {
    marginLeft: 4,
    color: '#666',
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
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  specialHandlingButtonSelected: {
    backgroundColor: '#007AFF',
  },
  specialHandlingText: {
    marginLeft: 4,
    color: '#333',
    fontSize: 14,
  },
  specialHandlingTextSelected: {
    color: '#fff',
  },
  instructionsInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  itemList: {
    marginTop: 24,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemCategory: {
    fontSize: 14,
    color: '#666',
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
    color: '#666',
    marginBottom: 4,
  },
  itemDetailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  grandTotal: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
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
    color: '#333',
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
    borderBottomColor: '#eee',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalItemSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

const CATEGORIES_WITH_SUBCATEGORIES: Record<CategoryType, Array<{ name: string; weightRange: { min: number; max: number; step: number } }>> = {
  'Food': [
    { name: 'Perishables', weightRange: { min: 0.1, max: 20, step: 0.1 } },
    { name: 'Non-perishables', weightRange: { min: 0.1, max: 50, step: 0.1 } },
    { name: 'Frozen', weightRange: { min: 0.1, max: 30, step: 0.1 } }
  ],
  'Electronics': [
    { name: 'Small Appliances', weightRange: { min: 0.5, max: 20, step: 0.5 } },
    { name: 'Large Appliances', weightRange: { min: 5, max: 100, step: 1 } }
  ],
  'Jewelries/Accessories': [
    { name: 'Jewelry', weightRange: { min: 0.01, max: 1, step: 0.01 } },
    { name: 'Watches', weightRange: { min: 0.05, max: 2, step: 0.05 } },
    { name: 'Accessories', weightRange: { min: 0.1, max: 5, step: 0.1 } }
  ],
  'Documents': [
    { name: 'Letters', weightRange: { min: 0.01, max: 0.5, step: 0.01 } },
    { name: 'Packages', weightRange: { min: 0.1, max: 5, step: 0.1 } }
  ],
  'Health Products': [
    { name: 'Medicines', weightRange: { min: 0.01, max: 2, step: 0.01 } },
    { name: 'Medical Supplies', weightRange: { min: 0.1, max: 20, step: 0.1 } }
  ],
  'Computer Accessories': [
    { name: 'Peripherals', weightRange: { min: 0.1, max: 5, step: 0.1 } },
    { name: 'Components', weightRange: { min: 0.2, max: 10, step: 0.2 } }
  ],
  'Phones': [
    { name: 'Mobile Phones', weightRange: { min: 0.1, max: 1, step: 0.1 } },
    { name: 'Accessories', weightRange: { min: 0.05, max: 2, step: 0.05 } }
  ],
  'Others': [
    { name: 'Books', weightRange: { min: 0.1, max: 5, step: 0.1 } },
    { name: 'Stationery', weightRange: { min: 0.1, max: 3, step: 0.1 } },
    { name: 'Art Supplies', weightRange: { min: 0.1, max: 10, step: 0.1 } },
    { name: 'Musical Instruments', weightRange: { min: 0.5, max: 30, step: 0.5 } },
    { name: 'Sports Equipment', weightRange: { min: 0.5, max: 50, step: 0.5 } },
    { name: 'Toys', weightRange: { min: 0.1, max: 10, step: 0.1 } },
    { name: 'Garden Tools', weightRange: { min: 0.5, max: 20, step: 0.5 } },
    { name: 'Pet Supplies', weightRange: { min: 0.1, max: 20, step: 0.1 } },
    { name: 'Automotive Parts', weightRange: { min: 0.5, max: 50, step: 0.5 } },
    { name: 'Home Decor', weightRange: { min: 0.1, max: 30, step: 0.1 } },
    { name: 'Craft Supplies', weightRange: { min: 0.1, max: 10, step: 0.1 } },
    { name: 'Travel Accessories', weightRange: { min: 0.1, max: 20, step: 0.1 } }
  ]
};

export default function ItemDetailsScreen() {
  const [itemList, setItemList] = useState<ItemList>({
    items: [],
    totalWeight: 0,
    totalValue: 0
  });

  const [currentItem, setCurrentItem] = useState<ItemDetails>({
    name: '',
    category: 'Electronics',
    subcategory: '',
    quantity: 0,
    weight: 0,
    value: 0,
    isFragile: false,
    requiresSpecialHandling: false,
    specialInstructions: '',
    dimensions: {
      length: 0,
      width: 0,
      height: 0
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
    if (!currentItem.category || !currentItem.subcategory || !currentItem.name || 
        !currentItem.weight || !currentItem.quantity || !currentItem.value) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }
    return true;
  };

  // Function to calculate totals
  const calculateTotals = (items: ItemDetails[]) => {
    return items.reduce((acc, item) => ({
      totalWeight: acc.totalWeight + (item.weight * item.quantity),
      totalValue: acc.totalValue + (item.value * item.quantity)
    }), { totalWeight: 0, totalValue: 0 });
  };

  // Function to add new item
  const handleAddItem = async () => {
    if (!validateItemDetails()) return;

    setIsLoading(true);
    try {
      const newItem: ItemDetails = {
        name: currentItem.name,
        category: currentItem.category,
        subcategory: currentItem.subcategory,
        quantity: Number(currentItem.quantity),
        weight: Number(currentItem.weight),
        value: Number(currentItem.value),
        imageUri: currentItem.imageUri,
        isFragile: currentItem.isFragile || false,
        requiresSpecialHandling: currentItem.requiresSpecialHandling || false,
        specialInstructions: currentItem.specialInstructions,
        dimensions: currentItem.dimensions ? {
          length: Number(currentItem.dimensions.length),
          width: Number(currentItem.dimensions.width),
          height: Number(currentItem.dimensions.height)
        } : { length: 0, width: 0, height: 0 }
      };

      // Get existing order draft
      const orderDraft = await StorageService.getOrderDraft();
      if (!orderDraft) {
        throw new Error('Order draft not found');
      }
      
      // Update only the items array
      const updatedDraft: Partial<OrderDraft> = {
        ...orderDraft,
        items: [...(orderDraft.items || []), newItem]
      };
      
      // Save the updated order draft
      await StorageService.saveOrderDraft(updatedDraft);

      // Update the itemList state
      const { totalWeight, totalValue } = calculateTotals([...itemList.items, newItem]);
      setItemList({
        items: [...itemList.items, newItem],
        totalWeight,
        totalValue
      });

      // Reset form
      setCurrentItem({
        name: '',
        category: 'Electronics',
        subcategory: '',
        quantity: 0,
        weight: 0,
        value: 0,
        isFragile: false,
        requiresSpecialHandling: false,
        specialInstructions: '',
        dimensions: {
          length: 0,
          width: 0,
          height: 0
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
    const numValue = value === '' ? 0 : parseFloat(value);
    if (!isNaN(numValue)) {
      setCurrentItem(prev => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [dimension]: numValue
        }
      }));
    }
  };

  // Function to handle input changes
  const handleInputChange = (field: keyof ItemDetails, value: string) => {
    if (field === 'category') {
      setCurrentItem(prev => ({
        ...prev,
        [field]: value as CategoryType
      }));
    } else if (field === 'quantity' || field === 'weight' || field === 'value') {
      const numValue = value === '' ? 0 : Number(value);
      if (!isNaN(numValue)) {
        setCurrentItem(prev => ({
          ...prev,
          [field]: numValue
        }));
      }
    } else {
      setCurrentItem(prev => ({
        ...prev,
        [field]: value
      }));
    }
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
          const dimensions = item.dimensions || { length: 0, width: 0, height: 0 };
          return {
            name: item.name || '',
            category: item.category as CategoryType,
            subcategory: item.subcategory || '',
            quantity: Number(item.quantity) || 0,
            weight: Number(item.weight) || 0,
            value: Number(item.value) || 0,
            imageUri: item.imageUri,
            isFragile: item.isFragile || false,
            requiresSpecialHandling: item.requiresSpecialHandling || false,
            specialInstructions: item.specialInstructions,
            dimensions: {
              length: Number(dimensions.length) || 0,
              width: Number(dimensions.width) || 0,
              height: Number(dimensions.height) || 0
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

  // ... rest of the code ...
}

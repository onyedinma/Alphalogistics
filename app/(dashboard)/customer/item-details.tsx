import auth from '@react-native-firebase/auth';
import { StorageService } from '@/services/storage';
import { ItemDetails, OrderDraft, CategoryType } from './types';
import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Platform, StyleSheet, Modal, Image, Pressable, Animated } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import FastImage from 'react-native-fast-image';

import { COLORS, SHADOWS } from '@/constants/theme';
import { MAX_IMAGE_SIZE, MAX_IMAGES_PER_ITEM, ACCEPTED_IMAGE_TYPES, validateImageDimensions } from '@/constants/images';

interface ItemList {
  items: ItemDetails[];
  totalWeight: number;
  totalValue: number;
  isLoading?: boolean;
}

interface ItemDetailsScreenState {
  isSubmitting: boolean;
  isImageLoading: boolean;
  showImagePreview: boolean;
  selectedImageIndex: number;
}

interface ItemFormData extends ItemDetails {
  quantity: number;
  weight: number;
  value: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

interface ImageDimensions {
  width: number;
  height: number;
  fileSize: number;
}

interface Receiver {
  name: string;
  address: string;
  phone: string;
  state: string;
  deliveryMethod: 'delivery' | 'pickup';
  pickupCenter?: string;
  streetNumber?: string;
  landmark?: string;
  locality?: string;
  city?: string;
  pincode?: string;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
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
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    ...SHADOWS.medium,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: COLORS.text,
  },
  input: {
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.card,
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
  imagePreview: {
    width: 100,
    height: 100,
    marginRight: 8,
    borderRadius: 12,
    ...SHADOWS.small,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  sortIcon: {
    marginLeft: 4,
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
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  specialHandlingButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  specialHandlingText: {
    marginLeft: 8,
    color: '#666666',
    fontSize: 14,
  },
  specialHandlingTextSelected: {
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.small,
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
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...SHADOWS.small,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
    marginHorizontal: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  // Remove floating menu related styles
  itemHeaderStyle: {
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
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    ...{
      ...SHADOWS.medium,
      marginTop: 32,
    },
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
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
    ...SHADOWS.medium,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
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
    ...SHADOWS.large,
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
  imageWrapper: {
    position: 'relative',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  addImageText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666666',
  },
  itemCardPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.05,
  },
  floatingMenu: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 8,
    ...SHADOWS.large,
  },
  floatingMenuButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    backgroundColor: '#F5F5F5',
  },
  floatingMenuButtonActive: {
    backgroundColor: '#000',
  },
  imagePreviewModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  imagePreviewContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '90%',
    height: '70%',
    borderRadius: 12,
  },
  imageActions: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    justifyContent: 'center',
    gap: 16,
  },
  imageActionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemHeaderLeft: {
    flex: 1,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 12,
  },
  itemAction: {
    padding: 4,
  },
  itemCardMargin: {
    marginTop: 10,
  },
  inputWrapper: {
    flex: 1,
    marginRight: 8,
    // Add any additional styles you need for the input wrapper
  },
  smallLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  smallInput: {
    height: 40, // Adjust height as needed
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: '#333',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  detailInput: {
    marginTop: 4,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  dimensionsContainer: {
    gap: 12,
    marginTop: 8,
  },
  dimensionInputWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  dimensionInput: {
    textAlign: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    minWidth: 80,
  },
  dimensionLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

const CATEGORIES_WITH_SUBCATEGORIES: Record<CategoryType, Array<{ name: string; weightRange: { min: number; max: number; step: number } }>> = {
  'electronics': [
    { name: 'Phones', weightRange: { min: 0.1, max: 2, step: 0.1 } },
    { name: 'Laptops', weightRange: { min: 0.5, max: 5, step: 0.1 } },
    { name: 'Tablets', weightRange: { min: 0.2, max: 3, step: 0.1 } },
    { name: 'Accessories', weightRange: { min: 0.05, max: 1, step: 0.05 } },
    { name: 'Cameras', weightRange: { min: 0.2, max: 2, step: 0.1 } },
    { name: 'Audio', weightRange: { min: 0.1, max: 3, step: 0.1 } }
  ],
  'clothing': [
    { name: 'Clothes', weightRange: { min: 0.1, max: 10, step: 0.1 } },
    { name: 'Shoes', weightRange: { min: 0.2, max: 3, step: 0.1 } },
    { name: 'Accessories', weightRange: { min: 0.05, max: 1, step: 0.05 } },
    { name: 'Outerwear', weightRange: { min: 0.5, max: 8, step: 0.2 } }
  ],
  'documents': [
    { name: 'Papers', weightRange: { min: 0.1, max: 5, step: 0.1 } },
    { name: 'Invoices', weightRange: { min: 0.05, max: 1, step: 0.05 } },
    { name: 'Reports', weightRange: { min: 0.1, max: 2, step: 0.1 } },
    { name: 'Certificates', weightRange: { min: 0.1, max: 3, step: 0.1 } }
  ],
  'food': [
    { name: 'Perishables', weightRange: { min: 0.1, max: 20, step: 0.1 } },
    { name: 'Non-perishables', weightRange: { min: 0.1, max: 50, step: 0.1 } },
    { name: 'Beverages', weightRange: { min: 0.2, max: 30, step: 0.2 } },
    { name: 'Snacks', weightRange: { min: 0.05, max: 5, step: 0.05 } },
    { name: 'Frozen', weightRange: { min: 0.2, max: 15, step: 0.2 } },
    { name: 'Bakery', weightRange: { min: 0.1, max: 5, step: 0.1 } }
  ],
  'fragile': [
    { name: 'Glass', weightRange: { min: 0.1, max: 10, step: 0.1 } },
    { name: 'Ceramics', weightRange: { min: 0.1, max: 8, step: 0.1 } },
    { name: 'Artworks', weightRange: { min: 0.2, max: 5, step: 0.1 } }
  ],
  'other': [
    { name: 'Miscellaneous', weightRange: { min: 0.1, max: 100, step: 0.1 } },
    { name: 'Books', weightRange: { min: 0.2, max: 15, step: 0.1 } },
    { name: 'Tools', weightRange: { min: 0.5, max: 50, step: 0.5 } },
    { name: 'Toys', weightRange: { min: 0.1, max: 10, step: 0.1 } }
  ]
};

// Ensure VEHICLES can be indexed with a string
const VEHICLES: Record<string, { maxWeight: number }> = {
  bike: { maxWeight: 100 },
  car: { maxWeight: 500 },
  truck: { maxWeight: 1000 }
};

const ItemDetailsScreen = () => {
  // State hooks for form data, item list and modals
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemList, setItemList] = useState<ItemList>({ items: [], totalWeight: 0, totalValue: 0 });
  const [currentItem, setCurrentItem] = useState<ItemFormData>({
    name: '',
    category: 'electronics' as CategoryType,
    subcategory: '',
    quantity: 0,
    weight: 0,
    value: 0,
    isFragile: false,
    requiresSpecialHandling: false,
    specialInstructions: '',
    dimensions: { length: 0, width: 0, height: 0 }
  });
  const [itemImages, setItemImages] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemDetails | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);

  // ...existing useEffect and helper function definitions...
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        setIsInitializing(true);
        // Load saved items from draft
        const orderDraft = await StorageService.getOrderDraft();
        if (orderDraft?.items && orderDraft.items.length > 0) {
          setItemList({
            items: orderDraft.items,
            ...calculateTotals(orderDraft.items)
          });
        } else {
          setItemList({
            items: [],
            totalWeight: 0,
            totalValue: 0
          });
        }
      } catch (error) {
        console.error('Error initializing items:', error);
        setError('Failed to initialize component');
      } finally {
        setIsInitializing(false);
      }
    };
    initializeComponent();
  }, []);

  const calculateTotals = (items: ItemDetails[]) => {
    return items.reduce((acc, item) => ({
      totalWeight: acc.totalWeight + (item.weight * item.quantity),
      totalValue: acc.totalValue + (item.value * item.quantity)
    }), { totalWeight: 0, totalValue: 0 });
  };

  const handleInputChange = (field: keyof ItemFormData, value: string) => {
    setCurrentItem(prev => ({ ...prev, [field]: value }));
  };

  const handleDimensionChange = (dimension: 'length' | 'width' | 'height', value: string) => {
    setCurrentItem(prev => ({
      ...prev,
      dimensions: { ...prev.dimensions, [dimension]: value }
    }));
  };

  const validateForm = () => {
    const errors: string[] = [];
    const trimmedName = currentItem.name.trim();
    
    // Required field validations
    if (!trimmedName) errors.push('Item name is required');
    if (!currentItem.category) errors.push('Category is required');
    if (!currentItem.subcategory) errors.push('Subcategory is required');
    
    // Numeric field validations with proper parsing
    const quantity = Number(currentItem.quantity);
    const weight = Number(currentItem.weight);
    const value = Number(currentItem.value);
    
    if (isNaN(quantity) || quantity <= 0) errors.push('Quantity must be a positive number');
    if (isNaN(weight) || weight <= 0) errors.push('Weight must be a positive number');
    if (isNaN(value) || value <= 0) errors.push('Value must be a positive number');
    
    // Category-specific weight validation
    const categoryInfo = CATEGORIES_WITH_SUBCATEGORIES[currentItem.category as CategoryType];
    const subcategoryInfo = categoryInfo?.find(sub => sub.name === currentItem.subcategory);
    
    if (subcategoryInfo && weight > 0) {
      const { min, max } = subcategoryInfo.weightRange;
      if (weight < min || weight > max) {
        errors.push(`Weight for ${currentItem.subcategory} must be between ${min}kg and ${max}kg`);
      }
    }
    
    return errors;
  };

  const handleAddItem = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      Alert.alert('Validation Error', validationErrors.join('\n'));
      return;
    }
    
    try {
      setIsLoading(true);
      const orderDraft = await StorageService.getOrderDraft();
      if (!orderDraft) throw new Error('No order draft found');

      const newItem: ItemDetails = {
        name: currentItem.name.trim(),
        category: currentItem.category,
        subcategory: currentItem.subcategory,
        quantity: currentItem.quantity || 0,
        weight:currentItem.weight || 0,
        value: currentItem.value || 0,
        isFragile: currentItem.isFragile,
        requiresSpecialHandling: currentItem.requiresSpecialHandling,
        specialInstructions: currentItem.specialInstructions || '',
        dimensions: {
          length: currentItem.dimensions.length,
          width: currentItem.dimensions.width,
          height: currentItem.dimensions.height
        },
        images: itemImages
      };

      const updatedItems = [...(orderDraft.items || []), newItem];
      const totals = calculateTotals(updatedItems);
      const updatedDraft: OrderDraft = {
        ...orderDraft,
        delivery: {
          scheduledPickup: orderDraft.delivery.scheduledPickup,
          vehicle: orderDraft.delivery.vehicle,
          fee: orderDraft.delivery.fee
        },
        items: updatedItems,
        pricing: {
          itemValue: totals.totalValue,
          deliveryFee: orderDraft.delivery.fee,
          total: totals.totalValue + orderDraft.delivery.fee
        }
      };

      // Enhanced logging for debugging
      console.log('Order Draft Components:');
      console.log('Sender:', orderDraft.sender);
      console.log('Receiver:', orderDraft.receiver);
      console.log('Delivery:', updatedDraft.delivery);
      console.log('Items:', updatedDraft.items);
      console.log('Pricing:', updatedDraft.pricing);
      console.log('Complete Order Draft:', updatedDraft);

      await StorageService.saveOrderDraft(updatedDraft);
      setItemList({ items: updatedItems, ...totals });
      
      // Reset form
      setCurrentItem({
        name: '',
        category: 'electronics' as CategoryType,
        subcategory: '',
        quantity: 0,
        weight: 0,
        value: 0,
        isFragile: false,
        requiresSpecialHandling: false,
        specialInstructions: '',
        dimensions: { length: 0, width: 0, height: 0 }
      });
      setItemImages([]);
      Alert.alert('Success', 'Item added successfully');
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = (item: ItemDetails, index: number) => (
    <View key={index} style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemHeaderLeft}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemCategory}>{item.category} - {item.subcategory}</Text>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity onPress={() => {/* Implement edit if needed */}}>
            <Ionicons name="create-outline" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            Alert.alert('Delete Item','Are you sure you want to delete this item?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => {
                  const updatedItems = itemList.items.filter((_, i) => i !== index);
                  setItemList({ items: updatedItems, ...calculateTotals(updatedItems) });
                }
              }
            ]);
          }}>
            <Ionicons name="trash-outline" size={24} color="#FF4444" />
          </TouchableOpacity>
        </View>
      </View>
      {/* ...other item details... */}
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
  );

  if (isInitializing) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading items...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Item Details',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: COLORS.background },
        }}
      />
      <ScrollView style={styles.mainContainer} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add New Item</Text>
          <Text style={styles.headerSubtitle}>Enter the details of the item you want to ship</Text>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#666" />
          <Text style={styles.infoText}>Add details about the item you want to ship.</Text>
        </View>

        {/* Category Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity style={styles.categoryInput} onPress={() => setShowCategoryModal(true)}>
            <Text style={currentItem.category ? styles.inputText : styles.placeholder}>
              {currentItem.category || 'Select Category'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Subcategory Selection */}
        {currentItem.category && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Subcategory</Text>
            <TouchableOpacity style={styles.categoryInput} onPress={() => setShowSubcategoryModal(true)}>
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
            onChangeText={value => handleInputChange('name', value)}
            placeholder="Enter item name"
            placeholderTextColor="#999"
          />
        </View>

        {/* Improved Item Details input group */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Item Details</Text>
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Text style={styles.smallLabel}>Quantity</Text>
              <TextInput
                style={[styles.input, styles.detailInput]}
                value={String(currentItem.quantity)}
                onChangeText={value => handleInputChange('quantity', value)}
                keyboardType="numeric"
                placeholder="Qty"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.smallLabel}>Weight (kg)</Text>
              <TextInput
                style={[styles.input, styles.detailInput]}
                value={String(currentItem.weight)}
                onChangeText={value => handleInputChange('weight', value)}
                keyboardType="numeric"
                placeholder="Weight"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.smallLabel}>Value (₦)</Text>
              <TextInput
                style={[styles.input, styles.detailInput]}
                value={String(currentItem.value)}
                onChangeText={value => handleInputChange('value', value)}
                keyboardType="numeric"
                placeholder="Value"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        {/* Dimensions */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Dimensions (cm) <Text style={{ fontSize: 12, color: '#999' }}>(optional)</Text></Text>
          <View style={[styles.row, styles.dimensionsContainer]}>
            <View style={styles.dimensionInputWrapper}>
              <Text style={styles.smallLabel}>Length</Text>
              <TextInput
                style={[styles.input, styles.dimensionInput]}
                value={String(currentItem.dimensions.length)}
                onChangeText={value => {
                  const numericValue = value.replace(/[^0-9.]/g, '');
                  handleDimensionChange('length', numericValue);
                }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.dimensionInputWrapper}>
              <Text style={styles.smallLabel}>Width</Text>
              <TextInput
                style={[styles.input, styles.dimensionInput]}
                value={String(currentItem.dimensions.width)}
                onChangeText={value => {
                  const numericValue = value.replace(/[^0-9.]/g, '');
                  handleDimensionChange('width', numericValue);
                }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.dimensionInputWrapper}>
              <Text style={styles.smallLabel}>Height</Text>
              <TextInput
                style={[styles.input, styles.dimensionInput]}
                value={String(currentItem.dimensions.height)}
                onChangeText={value => {
                  const numericValue = value.replace(/[^0-9.]/g, '');
                  handleDimensionChange('height', numericValue);
                }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        {/* Special Handling */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Special Handling</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.specialHandlingButton, currentItem.isFragile && styles.specialHandlingButtonSelected]}
              onPress={() => setCurrentItem(prev => ({ ...prev, isFragile: !prev.isFragile }))}
            >
              <Ionicons name={currentItem.isFragile ? "alert-circle" : "alert-circle-outline"} size={20} color={currentItem.isFragile ? "#fff" : "#333"} />
              <Text style={[styles.specialHandlingText, currentItem.isFragile && styles.specialHandlingTextSelected]}>Fragile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.specialHandlingButton, currentItem.requiresSpecialHandling && styles.specialHandlingButtonSelected]}
              onPress={() => setCurrentItem(prev => ({ ...prev, requiresSpecialHandling: !prev.requiresSpecialHandling }))}
            >
              <Ionicons name={currentItem.requiresSpecialHandling ? "hand-left" : "hand-left-outline"} size={20} color={currentItem.requiresSpecialHandling ? "#fff" : "#333"} />
              <Text style={[styles.specialHandlingText, currentItem.requiresSpecialHandling && styles.specialHandlingTextSelected]}>
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
              onChangeText={value => handleInputChange('specialInstructions', value)}
              placeholder="Enter special handling instructions"
              placeholderTextColor="#999"
              multiline
            />
          </View>
        )}

        {/* Add Image Section */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Item Images</Text>
          <View style={styles.imageContainer}>
            {itemImages.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImageButton} onPress={() => setItemImages(prev => prev.filter((_, i) => i !== index))}>
                  <Ionicons name="close-circle" size={24} color="#FF4444" />
                </TouchableOpacity>
              </View>
            ))}
            {itemImages.length < MAX_IMAGES_PER_ITEM && (
              <TouchableOpacity 
                style={[styles.addImageButton, isImageLoading && { opacity: 0.5 }]} 
                disabled={isImageLoading}
                onPress={async () => {
                  setIsImageLoading(true);
                  try {
                    const result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Images,
                      allowsEditing: true,
                      quality: 0.8,
                      allowsMultipleSelection: false
                    });
                    if (!result.canceled && result.assets[0]) {
                      const image = result.assets[0];
                      const dimensions = await validateImageDimensions(image.uri);
                      if (dimensions.fileSize > MAX_IMAGE_SIZE) {
                        Alert.alert('File Too Large', 'Please select an image under 5MB');
                        return;
                      }
                      setItemImages(prev => [...prev, image.uri]);
                    }
                  } catch (error) {
                    console.error('Error picking image:', error);
                    Alert.alert('Error', 'Failed to pick image. Please try again.');
                  } finally {
                    setIsImageLoading(false);
                  }
              }}>
                <Ionicons name="camera-outline" size={32} color="#666" />
                <Text style={styles.addImageText}>Add Image</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Add/Update Item Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddItem} disabled={isLoading}>
          <Text style={styles.addButtonText}>{isLoading ? 'Adding...' : isEditing ? 'Update Item' : 'Add Item'}</Text>
        </TouchableOpacity>

        {/* Items List */}
        {itemList.items.length > 0 && (
          <View style={styles.itemList}>
            {itemList.items.map((item, index) => renderItem(item, index))}
          </View>
        )}

        {/* Totals Section */}
        {itemList.items.length > 0 && (
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.label}>Total Weight</Text>
              <Text style={styles.totalValue}>{itemList.totalWeight.toFixed(2)} kg</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.label}>Total Value</Text>
              <Text style={styles.totalValue}>₦{itemList.totalValue.toFixed(2)}</Text>
            </View>
          </View>
        )}
      </ScrollView>
      {/* Category and Subcategory modals */}
      <Modal visible={showCategoryModal} transparent animationType="fade" onRequestClose={() => setShowCategoryModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '80%' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16 }}>Select Category</Text>
            {Object.keys(CATEGORIES_WITH_SUBCATEGORIES).map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => {
                  setCurrentItem(prev => ({ ...prev, category: cat as CategoryType, subcategory: '' }));
                  setShowCategoryModal(false);
                }}
                style={{ paddingVertical: 8 }}
              >
                <Text style={{ fontSize: 16 }}>{cat}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowCategoryModal(false)} style={{ marginTop: 16, alignSelf: 'flex-end' }}>
              <Text style={{ color: COLORS.primary }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={showSubcategoryModal} transparent animationType="fade" onRequestClose={() => setShowSubcategoryModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '80%' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16 }}>Select Subcategory</Text>
            {(
              CATEGORIES_WITH_SUBCATEGORIES[currentItem.category as CategoryType] || []
            ).map(sub => (
              <TouchableOpacity
                key={sub.name}
                onPress={() => {
                  setCurrentItem(prev => ({ ...prev, subcategory: sub.name }));
                  setShowSubcategoryModal(false);
                }}
                style={{ paddingVertical: 8 }}
              >
                <Text style={{ fontSize: 16 }}>{sub.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowSubcategoryModal(false)} style={{ marginTop: 16, alignSelf: 'flex-end' }}>
              <Text style={{ color: COLORS.primary }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ItemDetailsScreen;

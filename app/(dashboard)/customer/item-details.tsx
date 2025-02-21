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
import { BlurView } from 'expo-blur';
import { COLORS, SHADOWS } from '@/constants/theme';
import { MAX_IMAGE_SIZE, MAX_IMAGES_PER_ITEM, ACCEPTED_IMAGE_TYPES, validateImageDimensions } from '@/constants/images';

interface ItemList {
  items: ItemDetails[];
  totalWeight: number;
  totalValue: number;
}

interface ItemFormData extends ItemDetails {
  quantity: string;
  weight: string;
  value: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
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

// Ensure VEHICLES can be indexed with a string
const VEHICLES: Record<string, { maxWeight: number }> = { bike: { maxWeight: 100 }, car: { maxWeight: 500 } };

export default function ItemDetailsScreen() {
  // Add error handling at the start of the component
  useEffect(() => {
    const checkDraft = async () => {
      try {
        const draft = await StorageService.getOrderDraft();
        if (!draft) {
          console.log('No draft found, redirecting...');
          router.replace('/(dashboard)/customer/new-order');
          return;
        }
        // Continue with normal component logic
      } catch (error) {
        console.error('Error in ItemDetails:', error);
        Alert.alert(
          'Error',
          'Unable to load order details. Please try again.',
          [
            {
              text: 'Go Back',
              onPress: () => router.back()
            }
          ]
        );
      }
    };
    
    checkDraft();
  }, []);

  const [itemList, setItemList] = useState<ItemList>({
    items: [],
    totalWeight: 0,
    totalValue: 0
  });

  const [currentItem, setCurrentItem] = useState<ItemFormData>({
    name: '',
    category: 'electronics' as CategoryType,
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
  const [itemImages, setItemImages] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<ItemDetails | null>(null);
  const [sortOrder, setSortOrder] = useState<'name' | 'value' | 'weight'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showFloatingMenu, setShowFloatingMenu] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Add floating menu animation
  const floatingMenuAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      if (value > 50 && showFloatingMenu) {
        Animated.spring(floatingMenuAnimation, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
        setShowFloatingMenu(false);
      } else if (value <= 50 && !showFloatingMenu) {
        Animated.spring(floatingMenuAnimation, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
        setShowFloatingMenu(true);
      }
    });

    return () => scrollY.removeListener(listener);
  }, [showFloatingMenu]);

  // Add image preview handling
  const handleImagePreview = (index: number) => {
    setSelectedImageIndex(index);
    setShowImagePreview(true);
  };

  // Add sort handling
  const handleSort = (type: 'name' | 'value' | 'weight') => {
    setSortOrder(type);
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    
    setItemList(prev => {
      const sortedItems = [...prev.items].sort((a, b) => {
        const aValue = type === 'name' ? a[type] : parseFloat(a[type]);
        const bValue = type === 'name' ? b[type] : parseFloat(b[type]);
        return sortDirection === 'asc' ? 
          (aValue > bValue ? 1 : -1) : 
          (aValue < bValue ? 1 : -1);
      });
      return { ...prev, items: sortedItems };
    });
  };

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
  const validateItemDetails = async (): Promise<boolean> => {
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

    // Add dimension validation
    if (currentItem.dimensions) {
      const { length, width, height } = currentItem.dimensions;
      if ((length && !width && !height) || (!length && width && !height) || (!length && !width && height)) {
        errors.push('All dimensions must be provided if any are specified');
      }
      
      if (length && width && height) {
        const maxDimension = 500; // 5 meters in cm
        if (Number(length) > maxDimension || Number(width) > maxDimension || Number(height) > maxDimension) {
          errors.push('Maximum dimension allowed is 500cm (5m)');
        }
      }
    }

    // Add weight validation based on vehicle capacity
    const orderDraft = await StorageService.getOrderDraft();
    if (orderDraft?.delivery?.vehicle) {
      const maxWeight = VEHICLES[orderDraft.delivery.vehicle].maxWeight;
      const totalWeight = itemList.items.reduce((sum, item) => 
        sum + (Number(item.weight) * Number(item.quantity)), 0);
      const newItemWeight = Number(currentItem.weight) * Number(currentItem.quantity);
      
      if (editingItem) {
        // Subtract existing item weight when editing
        const existingWeight = Number(editingItem.weight) * Number(editingItem.quantity);
        if ((totalWeight - existingWeight + newItemWeight) > maxWeight) {
          errors.push(`Total weight exceeds vehicle capacity of ${maxWeight}kg`);
        }
      } else if ((totalWeight + newItemWeight) > maxWeight) {
        errors.push(`Total weight exceeds vehicle capacity of ${maxWeight}kg`);
      }
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
    if (!await validateItemDetails()) return;

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
        } : undefined,
        images: itemImages
      };

      const orderDraft = await StorageService.getOrderDraft();
      if (!orderDraft) {
        throw new Error('No order draft found');
      }

      // Fix: Ensure receiver structure is complete
      const receiver: Receiver = {
        name: orderDraft.receiver?.name || '',
        address: orderDraft.receiver?.address || '',
        phone: orderDraft.receiver?.phone || '',
        state: orderDraft.receiver?.state || '',
        deliveryMethod: orderDraft.receiver?.deliveryMethod || 'delivery',
        pickupCenter: orderDraft.receiver?.pickupCenter || ''
      };

      const updatedDraft: OrderDraft = {
        delivery: {
          scheduledPickup: orderDraft.delivery?.scheduledPickup || new Date().toISOString(),
          vehicle: orderDraft.delivery?.vehicle || 'bike',
          fee: orderDraft.delivery?.fee || 0
        },
        sender: orderDraft.sender || { name: '', address: '', phone: '', state: '' },
        receiver,
        locations: orderDraft.locations || {
          pickup: { address: '', city: '', state: '', postalCode: '', country: 'Nigeria', instructions: '' },
          delivery: { address: '', city: '', state: '', postalCode: '', country: 'Nigeria', instructions: '' }
        },
        items: [...(orderDraft.items || []), newItem],
        pricing: {
          itemValue: calculateTotals([...(orderDraft.items || []), newItem]).totalValue,
          deliveryFee: orderDraft.delivery?.fee || 0,
          total: calculateTotals([...(orderDraft.items || []), newItem]).totalValue + (orderDraft.delivery?.fee || 0)
        },
        orderDetails: {
          status: 'draft',
          createdAt: orderDraft.orderDetails?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      await StorageService.saveOrderDraft(updatedDraft);
      
      // Update local state
      setItemList({
        items: updatedDraft.items,
        ...calculateTotals(updatedDraft.items)
      });

      // Reset form
      setCurrentItem({
        name: '',
        category: 'electronics' as CategoryType,
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
      setItemImages([]);

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

      // Initialize with empty array if items is undefined
      const items = orderDraft.items || [];
      
      // Only process if we have items
      if (items.length > 0) {
        const typedItems = items.map(item => {
          const dimensions = item.dimensions || { length: '0', width: '0', height: '0' };
          return {
            name: item.name || '',
            category: item.category as CategoryType,
            subcategory: item.subcategory || '',
            quantity: item.quantity?.toString() || '0',
            weight: item.weight?.toString() || '0',
            value: item.value?.toString() || '0',
            imageUri: item.imageUri,
            isFragile: item.isFragile || false,
            requiresSpecialHandling: item.requiresSpecialHandling || false,
            specialInstructions: item.specialInstructions || '',
            dimensions: {
              length: dimensions.length?.toString() || '0',
              width: dimensions.width?.toString() || '0',
              height: dimensions.height?.toString() || '0'
            }
          };
        });
        
        const { totalWeight, totalValue } = calculateTotals(typedItems);
        setItemList({
          items: typedItems,
          totalWeight,
          totalValue
        });
      } else {
        // Set empty state if no items
        setItemList({
          items: [],
          totalWeight: 0,
          totalValue: 0
        });
      }
    } catch (error) {
      console.error('Error loading items:', error);
      Alert.alert('Error', 'Failed to load items');
      // Set empty state on error
      setItemList({
        items: [],
        totalWeight: 0,
        totalValue: 0
      });
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

  // Add image picker function with camera support
  const handleImagePick = async () => {
    try {
      if (itemImages.length >= MAX_IMAGES_PER_ITEM) {
        Alert.alert('Limit Reached', `Maximum ${MAX_IMAGES_PER_ITEM} images allowed per item`);
        return;
      }

      Alert.alert(
        'Add Image',
        'Choose an option',
        [
          {
            text: 'Take Photo',
            onPress: async () => {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission Required', 'Camera access is required to take photos');
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.8,
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
            }
          },
          {
            text: 'Choose from Gallery',
            onPress: async () => {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission Required', 'Gallery access is required to select photos');
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.8,
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
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Add image removal function
  const handleRemoveImage = (index: number) => {
    setItemImages(prev => prev.filter((_, i) => i !== index));
  };

  // Add edit item function
  const handleEditItem = (index: number) => {
    const item = itemList.items[index];
    setEditingItem(item);
    setEditingIndex(index);
    setIsEditing(true);
    setCurrentItem({
      name: item.name,
      category: item.category as CategoryType,
      subcategory: item.subcategory,
      quantity: item.quantity.toString(),
      weight: item.weight.toString(),
      value: item.value.toString(),
      isFragile: item.isFragile || false,
      requiresSpecialHandling: item.requiresSpecialHandling || false,
      specialInstructions: item.specialInstructions || '',
      dimensions: item.dimensions || { length: '', width: '', height: '' }
    });
    setItemImages(item.images || []);
  };

  // Add duplicate item function
  const handleDuplicateItem = (index: number) => {
    const item = itemList.items[index];
    const duplicatedItem = {
      ...item,
      name: `${item.name} (Copy)`,
    };
    
    const updatedItems = [...itemList.items, duplicatedItem];
    const { totalWeight, totalValue } = calculateTotals(updatedItems);
    setItemList({
      items: updatedItems,
      totalWeight,
      totalValue
    });
  };

  // Add swipe to delete functionality in the render method
  const renderItem = (item: ItemDetails, index: number) => {
    return (
      <View key={index}>
        <View style={[styles.itemCard, index > 0 && styles.itemCardMargin]}>
          <View style={styles.itemHeader}>
            <View style={styles.itemHeaderLeft}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemCategory}>{item.category} - {item.subcategory}</Text>
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity 
                style={styles.itemAction}
                onPress={() => handleEditItem(index)}
              >
                <Ionicons name="create-outline" size={24} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.itemAction}
                onPress={() => handleDuplicateItem(index)}
              >
                <Ionicons name="copy-outline" size={24} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.itemAction}
                onPress={() => {
                  Alert.alert(
                    'Delete Item',
                    'Are you sure you want to delete this item?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => {
                          const updatedItems = itemList.items.filter((_, i) => i !== index);
                          setItemList(prev => ({
                            ...prev,
                            items: updatedItems,
                            ...calculateTotals(updatedItems)
                          }));
                        }
                      }
                    ]
                  );
                }}
              >
                <Ionicons name="trash-outline" size={24} color="#FF4444" />
              </TouchableOpacity>
            </View>
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
      </View>
    );
  };

  // Add floating menu component
  const FloatingMenu = () => (
    <View style={styles.floatingMenu}>
      <TouchableOpacity
        style={[
          styles.floatingMenuButton,
          sortOrder === 'name' && styles.floatingMenuButtonActive
        ]}
        onPress={() => handleSort('name')}
      >
        <Ionicons
          name="text"
          size={24}
          color={sortOrder === 'name' ? '#fff' : '#666'}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.floatingMenuButton,
          sortOrder === 'value' && styles.floatingMenuButtonActive
        ]}
        onPress={() => handleSort('value')}
      >
        <Ionicons
          name="cash"
          size={24}
          color={sortOrder === 'value' ? '#fff' : '#666'}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.floatingMenuButton,
          sortOrder === 'weight' && styles.floatingMenuButtonActive
        ]}
        onPress={() => handleSort('weight')}
      >
        <Ionicons
          name="scale"
          size={24}
          color={sortOrder === 'weight' ? '#fff' : '#666'}
        />
      </TouchableOpacity>
    </View>
  );

  // Add image preview modal
  const ImagePreviewModal = () => (
    <Modal
      visible={showImagePreview}
      transparent
      animationType="fade"
      onRequestClose={() => setShowImagePreview(false)}
    >
      <BlurView intensity={100} style={styles.imagePreviewModal}>
        <View style={styles.imagePreviewContent}>
          <FastImage
            source={{ uri: itemImages[selectedImageIndex] }}
            style={styles.previewImage}
            resizeMode={FastImage.resizeMode.contain}
          />
          <View style={styles.imageActions}>
            <TouchableOpacity
              style={styles.imageActionButton}
              onPress={() => setSelectedImageIndex(prev => 
                prev > 0 ? prev - 1 : itemImages.length - 1
              )}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imageActionButton}
              onPress={() => setShowImagePreview(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imageActionButton}
              onPress={() => setSelectedImageIndex(prev =>
                prev < itemImages.length - 1 ? prev + 1 : 0
              )}
            >
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );

  // Update the main ScrollView to use Animated.ScrollView
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Item Details',
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          headerLargeTitle: true,
        }}
      />

      <ScrollView
        style={[styles.mainContainer, { backgroundColor: COLORS.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add New Item</Text>
          <Text style={styles.headerSubtitle}>
            Enter the details of the item you want to ship
          </Text>
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

          {/* Add Image Section */}
          <View style={styles.inputGroup}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Item Images</Text>
              <TouchableOpacity style={styles.infoButton}>
                <Ionicons name="information-circle-outline" size={20} color="#666" />
                <Text style={styles.infoButtonText}>Max {MAX_IMAGES_PER_ITEM} images, 5MB each</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.imageContainer}>
              {itemImages.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF4444" />
                  </TouchableOpacity>
                </View>
              ))}
              {itemImages.length < MAX_IMAGES_PER_ITEM && (
                <TouchableOpacity 
                  style={styles.addImageButton}
                  onPress={handleImagePick}
                >
                  <Ionicons name="camera-outline" size={32} color="#666" />
                  <Text style={styles.addImageText}>Add Image</Text>
                </TouchableOpacity>
              )}
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
            {itemList.items.map((item, index) => renderItem(item, index))}
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

      <FloatingMenu />
      <ImagePreviewModal />

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <BlurView intensity={100} style={styles.modalContainer}>
          <View style={[styles.modalContent, SHADOWS.large]}>
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
        </BlurView>
      </Modal>

      {/* Subcategory Selection Modal */}
      <Modal
        visible={showSubcategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubcategoryModal(false)}
      >
        <BlurView intensity={100} style={styles.modalContainer}>
          <View style={[styles.modalContent, SHADOWS.large]}>
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
        </BlurView>
      </Modal>
    </View>
  );
}

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import { StorageService } from '@/services/storage';

type CategoryType = 'Food' | 'Electronics' | 'Jewelries/Accessories' | 'Documents' | 'Health Products' | 'Computer Accessories' | 'Phones' | 'Others';

interface WeightRange {
  min: number;
  max: number;
  step: number;
  maxQuantity?: number;
  restrictions?: string[];
  requiresSpecialHandling?: boolean;
}

interface SubcategoryInfo {
  name: string;
  weightRange: WeightRange;
  isFragile?: boolean;
  requiresTemperatureControl?: boolean;
  packagingGuidelines?: string[];
}

const CATEGORIES_WITH_SUBCATEGORIES: Record<CategoryType, SubcategoryInfo[]> = {
  'Food': [
    { 
      name: 'Packaged Foods', 
      weightRange: { 
        min: 0.1, 
        max: 30, 
        step: 0.1,
        maxQuantity: 50,
        restrictions: ['Not available for same-day delivery']
      },
      requiresTemperatureControl: false,
      packagingGuidelines: ['Must be sealed', 'No damaged packaging']
    },
    { name: 'Beverages', weightRange: { min: 0.1, max: 20, step: 0.1 } },
    { name: 'Snacks', weightRange: { min: 0.1, max: 10, step: 0.1 } },
    { name: 'Canned Foods', weightRange: { min: 0.1, max: 15, step: 0.1 } },
    { name: 'Dried Foods', weightRange: { min: 0.1, max: 20, step: 0.1 } },
    { name: 'Baked Goods', weightRange: { min: 0.1, max: 10, step: 0.1 } },
    { name: 'Dairy Products', weightRange: { min: 0.1, max: 15, step: 0.1 } },
    { name: 'Frozen Foods', weightRange: { min: 0.1, max: 25, step: 0.1 } },
    { name: 'Condiments', weightRange: { min: 0.1, max: 5, step: 0.1 } },
    { name: 'Cereals', weightRange: { min: 0.1, max: 10, step: 0.1 } },
    { name: 'Fresh Produce', weightRange: { min: 0.1, max: 30, step: 0.1 } },
    { name: 'Meat Products', weightRange: { min: 0.1, max: 25, step: 0.1 } }
  ],
  'Electronics': [
    { name: 'Blender', weightRange: { min: 1, max: 10, step: 0.5 } },
    { name: 'Camera', weightRange: { min: 0.1, max: 5, step: 0.1 } },
    { name: 'MP3 Player', weightRange: { min: 0.1, max: 1, step: 0.1 } },
    { name: 'Television', weightRange: { min: 5, max: 100, step: 1 } },
    { name: 'Radio', weightRange: { min: 0.5, max: 5, step: 0.5 } },
    { name: 'DVD Player', weightRange: { min: 1, max: 10, step: 0.5 } },
    { name: 'Gaming Console', weightRange: { min: 1, max: 10, step: 0.5 } },
    { name: 'Home Theater', weightRange: { min: 5, max: 50, step: 1 } },
    { name: 'Microwave', weightRange: { min: 10, max: 30, step: 1 } },
    { name: 'Electric Kettle', weightRange: { min: 0.5, max: 5, step: 0.5 } },
    { name: 'Air Conditioner', weightRange: { min: 10, max: 100, step: 1 } },
    { name: 'Fan', weightRange: { min: 2, max: 20, step: 0.5 } }
  ],
  'Jewelries/Accessories': [
    { name: 'Necklaces', weightRange: { min: 0.01, max: 1, step: 0.01 } },
    { name: 'Earrings', weightRange: { min: 0.01, max: 0.5, step: 0.01 } },
    { name: 'Bracelets', weightRange: { min: 0.01, max: 0.5, step: 0.01 } },
    { name: 'Rings', weightRange: { min: 0.01, max: 0.2, step: 0.01 } },
    { name: 'Watches', weightRange: { min: 0.05, max: 0.5, step: 0.01 } },
    { name: 'Sunglasses', weightRange: { min: 0.05, max: 0.5, step: 0.01 } },
    { name: 'Hair Accessories', weightRange: { min: 0.01, max: 0.5, step: 0.01 } },
    { name: 'Brooches', weightRange: { min: 0.01, max: 0.2, step: 0.01 } },
    { name: 'Anklets', weightRange: { min: 0.01, max: 0.2, step: 0.01 } },
    { name: 'Cufflinks', weightRange: { min: 0.01, max: 0.2, step: 0.01 } },
    { name: 'Tie Clips', weightRange: { min: 0.01, max: 0.2, step: 0.01 } },
    { name: 'Bangles', weightRange: { min: 0.01, max: 0.5, step: 0.01 } }
  ],
  'Documents': [
    { name: 'Legal Documents', weightRange: { min: 0.1, max: 5, step: 0.1 } },
    { name: 'Academic Certificates', weightRange: { min: 0.1, max: 2, step: 0.1 } },
    { name: 'Business Contracts', weightRange: { min: 0.1, max: 3, step: 0.1 } },
    { name: 'Medical Records', weightRange: { min: 0.1, max: 3, step: 0.1 } },
    { name: 'Financial Documents', weightRange: { min: 0.1, max: 3, step: 0.1 } },
    { name: 'Personal ID Documents', weightRange: { min: 0.1, max: 1, step: 0.1 } },
    { name: 'Property Documents', weightRange: { min: 0.1, max: 3, step: 0.1 } },
    { name: 'Insurance Papers', weightRange: { min: 0.1, max: 2, step: 0.1 } },
    { name: 'Travel Documents', weightRange: { min: 0.1, max: 1, step: 0.1 } },
    { name: 'Employment Documents', weightRange: { min: 0.1, max: 2, step: 0.1 } },
    { name: 'Tax Documents', weightRange: { min: 0.1, max: 3, step: 0.1 } },
    { name: 'Research Papers', weightRange: { min: 0.1, max: 5, step: 0.1 } }
  ],
  'Health Products': [
    { name: 'Vitamins', weightRange: { min: 0.1, max: 2, step: 0.1 } },
    { name: 'Supplements', weightRange: { min: 0.1, max: 3, step: 0.1 } },
    { name: 'First Aid Supplies', weightRange: { min: 0.1, max: 5, step: 0.1 } },
    { name: 'Personal Care Items', weightRange: { min: 0.1, max: 5, step: 0.1 } },
    { name: 'Medical Devices', weightRange: { min: 0.1, max: 10, step: 0.1 } },
    { name: 'Dental Care Products', weightRange: { min: 0.1, max: 2, step: 0.1 } },
    { name: 'Skincare Products', weightRange: { min: 0.1, max: 3, step: 0.1 } },
    { name: 'Health Monitors', weightRange: { min: 0.1, max: 5, step: 0.1 } },
    { name: 'Mobility Aids', weightRange: { min: 1, max: 20, step: 0.5 } },
    { name: 'Prescription Medications', weightRange: { min: 0.1, max: 2, step: 0.1 } },
    { name: 'Herbal Remedies', weightRange: { min: 0.1, max: 3, step: 0.1 } },
    { name: 'Fitness Equipment', weightRange: { min: 0.5, max: 50, step: 0.5 } }
  ],
  'Computer Accessories': [
    { name: 'Hard Disk', weightRange: { min: 0.1, max: 2, step: 0.1 } },
    { name: 'Laptop', weightRange: { min: 1, max: 5, step: 0.1 } },
    { name: 'Projector', weightRange: { min: 2, max: 10, step: 0.5 } },
    { name: 'Mouse', weightRange: { min: 0.1, max: 0.5, step: 0.1 } },
    { name: 'Keyboard', weightRange: { min: 0.3, max: 2, step: 0.1 } },
    { name: 'Monitor', weightRange: { min: 2, max: 15, step: 0.5 } },
    { name: 'Printer', weightRange: { min: 3, max: 20, step: 0.5 } },
    { name: 'Scanner', weightRange: { min: 2, max: 10, step: 0.5 } },
    { name: 'Webcam', weightRange: { min: 0.1, max: 1, step: 0.1 } },
    { name: 'USB Drive', weightRange: { min: 0.01, max: 0.1, step: 0.01 } },
    { name: 'Computer Cables', weightRange: { min: 0.1, max: 2, step: 0.1 } },
    { name: 'Laptop Stand', weightRange: { min: 0.5, max: 3, step: 0.1 } }
  ],
  'Phones': [
    { name: 'Smartphones', weightRange: { min: 0.1, max: 0.5, step: 0.1 } },
    { name: 'Feature Phones', weightRange: { min: 0.1, max: 0.3, step: 0.1 } },
    { name: 'Phone Cases', weightRange: { min: 0.05, max: 0.2, step: 0.01 } },
    { name: 'Screen Protectors', weightRange: { min: 0.01, max: 0.1, step: 0.01 } },
    { name: 'Chargers', weightRange: { min: 0.1, max: 0.5, step: 0.1 } },
    { name: 'Power Banks', weightRange: { min: 0.2, max: 1, step: 0.1 } },
    { name: 'Earphones', weightRange: { min: 0.05, max: 0.2, step: 0.01 } },
    { name: 'Bluetooth Headsets', weightRange: { min: 0.1, max: 0.3, step: 0.1 } },
    { name: 'Phone Holders', weightRange: { min: 0.1, max: 0.5, step: 0.1 } },
    { name: 'Memory Cards', weightRange: { min: 0.01, max: 0.05, step: 0.01 } },
    { name: 'USB Cables', weightRange: { min: 0.05, max: 0.2, step: 0.01 } },
    { name: 'Wireless Chargers', weightRange: { min: 0.1, max: 0.5, step: 0.1 } }
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

const CATEGORIES = Object.keys(CATEGORIES_WITH_SUBCATEGORIES) as CategoryType[];

interface ItemDetails {
  category: CategoryType | '';
  subcategory: string;
  name: string;
  weight: string;
  quantity: string;
  value: string;
  imageUri?: string;
  isFragile?: boolean;
  requiresSpecialHandling?: boolean;
  specialInstructions?: string;
  dimensions?: {
    length: string;
    width: string;
    height: string;
  };
}

// Add new interface for managing multiple items
interface ItemList {
  items: ItemDetails[];
  totalWeight: number;
  totalValue: number;
}

// Add calculateDeliveryFee function
const calculateDeliveryFee = (weight: number) => {
  // Base fee
  let fee = 1000;
  
  // Add fee based on weight
  if (weight <= 5) {
    fee += weight * 200;
  } else if (weight <= 20) {
    fee += 1000 + (weight - 5) * 150;
  } else {
    fee += 3250 + (weight - 20) * 100;
  }

  return Math.round(fee);
};

export default function ItemDetailsScreen() {
  const [itemList, setItemList] = useState<ItemList>({
    items: [],
    totalWeight: 0,
    totalValue: 0
  });
  const [currentItem, setCurrentItem] = useState<ItemDetails>({
    category: '',
    subcategory: '',
    name: '',
    weight: '',
    quantity: '',
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

  // Request permissions when component mounts
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Sorry, we need camera roll permissions to upload images!');
        }
      }
    })();
  }, []);

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
      totalWeight: acc.totalWeight + (parseFloat(item.weight) * parseInt(item.quantity)),
      totalValue: acc.totalValue + (parseFloat(item.value) * parseInt(item.quantity))
    }), { totalWeight: 0, totalValue: 0 });
  };

  // Function to load saved items
  const loadSavedItems = async () => {
    try {
      const orderDraft = await StorageService.getOrderDraft();
      if (orderDraft?.items) {
        const items = orderDraft.items as ItemDetails[];
        const { totalWeight, totalValue } = calculateTotals(items);
        setItemList({
          items,
          totalWeight,
          totalValue
        });
      }
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  // Function to add new item
  const handleAddItem = async () => {
    if (!validateItemDetails()) return;

    setIsLoading(true);
    try {
      const newItem: ItemDetails = {
        ...currentItem,
        category: currentItem.category as CategoryType
      };

      const orderDraft = await StorageService.getOrderDraft();
      const existingItems = (orderDraft?.items || []) as ItemDetails[];
      const updatedItems = [...existingItems, newItem];
      
      await StorageService.updateOrderSection('items', updatedItems);

      // Update the itemList state
      const { totalWeight, totalValue } = calculateTotals(updatedItems);
      setItemList({
        items: updatedItems,
        totalWeight,
        totalValue
      });

      // Reset form
      setCurrentItem({
        category: '',
        subcategory: '',
        name: '',
        weight: '',
        quantity: '',
        value: '',
        dimensions: {
          length: '',
          width: '',
          height: '',
        },
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

  // Function to edit item
  const handleEditItem = (index: number) => {
    setCurrentItem(itemList.items[index]);
    setIsEditing(true);
    setEditingIndex(index);
  };

  // Function to remove item
  const handleRemoveItem = async (index: number) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const existingItemsStr = await AsyncStorage.getItem('itemDetails');
              if (!existingItemsStr) return;

              const existingItems: ItemDetails[] = JSON.parse(existingItemsStr);
              const updatedItems = existingItems.filter((_, i) => i !== index);
              
              await AsyncStorage.setItem('itemDetails', JSON.stringify(updatedItems));
              
              const { totalWeight, totalValue } = calculateTotals(updatedItems);
              setItemList({
                items: updatedItems,
                totalWeight,
                totalValue
              });
            } catch (error) {
              console.error('Error removing item:', error);
              Alert.alert('Error', 'Failed to remove item');
            }
          }
        }
      ]
    );
  };

  // Function to proceed to checkout
  const handleProceedToCheckout = async () => {
    if (itemList.items.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    setIsLoading(true);
    try {
      // Get order draft from StorageService
      const orderDraft = await StorageService.getOrderDraft();
      
      if (!orderDraft) {
        Alert.alert('Error', 'No order draft found');
        return;
      }

      // Check if all required information is available
      if (!orderDraft.locations?.pickup || !orderDraft.locations?.delivery || 
          !orderDraft.delivery?.scheduledPickup || !orderDraft.delivery?.vehicle) {
        Alert.alert(
          'Missing Information',
          'Please complete the order details first (sender, receiver, pickup date, and vehicle selection).',
          [
            {
              text: 'Go Back',
              onPress: () => router.back()
            }
          ]
        );
        return;
      }

      // Calculate pricing
      const totalWeight = itemList.items.reduce((sum, item) => 
        sum + (parseFloat(item.weight) * parseInt(item.quantity)), 0);
      const totalValue = itemList.items.reduce((sum, item) => 
        sum + (parseFloat(item.value) * parseInt(item.quantity)), 0);
      const deliveryFee = calculateDeliveryFee(totalWeight);

      // Update order draft with items and pricing
      await Promise.all([
        StorageService.updateOrderSection('items', itemList.items),
        StorageService.updateOrderSection('pricing', {
          itemValue: totalValue,
          deliveryFee: deliveryFee,
          total: totalValue + deliveryFee,
        })
      ]);

      router.push('/customer/checkout');
    } catch (error) {
      console.error('Error preparing checkout:', error);
      Alert.alert('Error', 'Failed to prepare checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('User must be authenticated to upload images');

      // Generate a unique filename
      const fileExtension = uri.split('.').pop() || 'jpg';
      const filename = `${Date.now()}.${fileExtension}`;
      const storageRef = storage().ref(`items/${user.uid}/${filename}`);

      // Convert image uri to blob
      const response = await fetch(uri);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      if (!blob) throw new Error('Failed to create blob from image');

      // Upload the blob
      await storageRef.put(blob);

      // Get download URL
      const downloadURL = await storageRef.getDownloadURL();
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to upload image: ${error.message}`);
      } else {
        throw new Error('Failed to upload image: Unknown error');
      }
    }
  };

  // Add useEffect to load items when component mounts
  useEffect(() => {
    loadSavedItems();
  }, []);

  // Update the dimension change handler
  const handleDimensionChange = (dimension: 'length' | 'width' | 'height', value: string) => {
    setCurrentItem(prev => ({
      ...prev,
      dimensions: {
        length: dimension === 'length' ? value : prev.dimensions?.length || '',
        width: dimension === 'width' ? value : prev.dimensions?.width || '',
        height: dimension === 'height' ? value : prev.dimensions?.height || ''
      }
    }));
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Item Details',
          headerShadowVisible: false,
        }}
      />

      <View style={styles.mainContainer}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Category Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity 
              style={styles.input}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={currentItem.category ? styles.inputText : styles.placeholder}>
                {currentItem.category || 'Select Category'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Subcategory Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Subcategory</Text>
            <TouchableOpacity 
              style={styles.input}
              onPress={() => currentItem.category && setShowSubcategoryModal(true)}
            >
              <Text style={currentItem.subcategory ? styles.inputText : styles.placeholder}>
                {currentItem.subcategory || 'Select Subcategory'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Item Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Item Name</Text>
            <TextInput
              style={[styles.input, styles.inputText]}
              value={currentItem.name}
              onChangeText={(text) => setCurrentItem({ ...currentItem, name: text })}
              placeholder="Enter item name"
              placeholderTextColor="#666"
            />
          </View>

          {/* Weight and Quantity */}
          <View style={[styles.row, { gap: 8 }]}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={[styles.input, styles.inputText]}
                value={currentItem.weight}
                onChangeText={(text) => setCurrentItem({ ...currentItem, weight: text })}
                placeholder="0.00"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={[styles.input, styles.inputText]}
                value={currentItem.quantity}
                onChangeText={(text) => setCurrentItem({ ...currentItem, quantity: text })}
                placeholder="0"
                placeholderTextColor="#666"
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Value */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Value (₦)</Text>
            <View style={styles.valueInput}>
              <TextInput
                style={[styles.input, styles.inputText, { flex: 1 }]}
                value={currentItem.value}
                onChangeText={(text) => setCurrentItem({ ...currentItem, value: text })}
                placeholder="0.00"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Image Upload */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Item Image (Optional)</Text>
            {currentItem.imageUri ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: currentItem.imageUri }} style={styles.itemImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => setCurrentItem({ ...currentItem, imageUri: undefined })}
                >
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={32} color="#666" />
                <Text style={styles.imagePlaceholderText}>Add Item Image</Text>
                <Text style={styles.imagePlaceholderSubtext}>Max size: 5MB</Text>
              </View>
            )}
            <View style={styles.imageSourceButtons}>
              <TouchableOpacity 
                style={styles.imageSourceButton}
                onPress={async () => {
                  try {
                    const result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: 'images',
                      allowsEditing: true,
                      aspect: [4, 3],
                      quality: 0.8,
                    });
                    if (!result.canceled) {
                      setCurrentItem({ ...currentItem, imageUri: result.assets[0].uri });
                    }
                  } catch (error) {
                    Alert.alert('Error', 'Failed to pick image');
                  }
                }}
              >
                <Ionicons name="images-outline" size={24} color="#007AFF" />
                <Text style={styles.imageSourceText}>Choose from Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.imageSourceButton}
                onPress={async () => {
                  try {
                    const result = await ImagePicker.launchCameraAsync({
                      mediaTypes: 'images',
                      allowsEditing: true,
                      aspect: [4, 3],
                      quality: 0.8,
                    });
                    if (!result.canceled) {
                      setCurrentItem({ ...currentItem, imageUri: result.assets[0].uri });
                    }
                  } catch (error) {
                    Alert.alert('Error', 'Failed to take photo');
                  }
                }}
              >
                <Ionicons name="camera-outline" size={24} color="#007AFF" />
                <Text style={styles.imageSourceText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Dimensions */}
          <View style={styles.formGroup}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Dimensions (Optional)</Text>
              <TouchableOpacity style={styles.infoButton}>
                <Ionicons name="information-circle-outline" size={16} color="#666" />
                <Text style={styles.infoButtonText}>Why needed?</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.row, { gap: 8 }]}>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={[styles.input, styles.inputText]}
                  value={currentItem.dimensions?.length || ''}
                  onChangeText={(text) => handleDimensionChange('length', text)}
                  placeholder="Length (cm)"
                  placeholderTextColor="#666"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={[styles.input, styles.inputText]}
                  value={currentItem.dimensions?.width || ''}
                  onChangeText={(text) => handleDimensionChange('width', text)}
                  placeholder="Width (cm)"
                  placeholderTextColor="#666"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={[styles.input, styles.inputText]}
                  value={currentItem.dimensions?.height || ''}
                  onChangeText={(text) => handleDimensionChange('height', text)}
                  placeholder="Height (cm)"
                  placeholderTextColor="#666"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          {/* Special Handling */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Special Handling (Optional)</Text>
            <View style={styles.specialHandlingContainer}>
              <TouchableOpacity 
                style={[
                  styles.specialHandlingButton,
                  currentItem.isFragile && styles.specialHandlingButtonActive
                ]}
                onPress={() => setCurrentItem({ ...currentItem, isFragile: !currentItem.isFragile })}
              >
                <Ionicons 
                  name={currentItem.isFragile ? "alert-circle" : "alert-circle-outline"} 
                  size={20} 
                  color={currentItem.isFragile ? "#007AFF" : "#666"} 
                />
                <Text style={[
                  styles.specialHandlingText,
                  currentItem.isFragile && styles.specialHandlingTextActive
                ]}>
                  Fragile
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.specialHandlingButton,
                  currentItem.requiresSpecialHandling && styles.specialHandlingButtonActive
                ]}
                onPress={() => setCurrentItem({ 
                  ...currentItem, 
                  requiresSpecialHandling: !currentItem.requiresSpecialHandling 
                })}
              >
                <Ionicons 
                  name={currentItem.requiresSpecialHandling ? "hand-left" : "hand-left-outline"} 
                  size={20} 
                  color={currentItem.requiresSpecialHandling ? "#007AFF" : "#666"} 
                />
                <Text style={[
                  styles.specialHandlingText,
                  currentItem.requiresSpecialHandling && styles.specialHandlingTextActive
                ]}>
                  Special Care
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Special Instructions */}
          {(currentItem.isFragile || currentItem.requiresSpecialHandling) && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Special Instructions</Text>
              <TextInput
                style={[styles.input, styles.inputText, { height: 80 }]}
                value={currentItem.specialInstructions}
                onChangeText={(text) => setCurrentItem({ ...currentItem, specialInstructions: text })}
                placeholder="Enter any special handling instructions..."
                placeholderTextColor="#666"
                multiline
                textAlignVertical="top"
              />
            </View>
          )}

          {/* Add/Update Item Button */}
          <TouchableOpacity 
            style={[
              styles.addButton,
              (!currentItem.category || !currentItem.subcategory || !currentItem.name || 
               !currentItem.weight || !currentItem.quantity || !currentItem.value) && 
              styles.disabledButton
            ]} 
            onPress={handleAddItem}
            disabled={!currentItem.category || !currentItem.subcategory || !currentItem.name || 
                     !currentItem.weight || !currentItem.quantity || !currentItem.value}
          >
            <Text style={styles.addButtonText}>
              {isEditing ? 'Update Item' : 'Add Item'}
            </Text>
          </TouchableOpacity>

          {/* Items List */}
          {itemList.items.length > 0 && (
            <View style={styles.itemsList}>
              <Text style={styles.itemsListTitle}>Added Items ({itemList.items.length})</Text>
              {itemList.items.map((item, index) => (
                <View key={index} style={styles.itemCard}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemDetails}>
                      {item.category} - {item.subcategory}
                    </Text>
                    <Text style={styles.itemDetails}>
                      Quantity: {item.quantity} | Weight: {item.weight}kg | Value: ₦{parseFloat(item.value).toLocaleString()}
                    </Text>
                    {item.imageUri && (
                      <Image 
                        source={{ uri: item.imageUri }} 
                        style={styles.itemThumbnail}
                      />
                    )}
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => handleRemoveItem(index)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Totals */}
              <View style={styles.totalsCard}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Weight:</Text>
                  <Text style={styles.totalValue}>{itemList.totalWeight.toFixed(2)}kg</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Value:</Text>
                  <Text style={styles.totalValue}>₦{itemList.totalValue.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Proceed Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity 
            style={[
              styles.checkoutButton,
              itemList.items.length === 0 && styles.disabledButton
            ]}
            onPress={handleProceedToCheckout}
            disabled={itemList.items.length === 0}
          >
            <Text style={styles.checkoutButtonText}>
              Proceed to Checkout ({itemList.items.length} {itemList.items.length === 1 ? 'item' : 'items'})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={styles.categoryItem}
                  onPress={() => handleCategorySelect(category)}
                >
                  <Text style={[
                    styles.categoryText,
                    currentItem.category === category && styles.selectedCategoryText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Subcategory Modal */}
      <Modal
        visible={showSubcategoryModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Subcategory</Text>
              <TouchableOpacity onPress={() => setShowSubcategoryModal(false)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {currentItem.category && CATEGORIES_WITH_SUBCATEGORIES[currentItem.category].map((subcategory) => (
                <TouchableOpacity
                  key={subcategory.name}
                  style={styles.categoryItem}
                  onPress={() => handleSubcategorySelect(subcategory.name)}
                >
                  <Text style={[
                    styles.categoryText,
                    currentItem.subcategory === subcategory.name && styles.selectedCategoryText
                  ]}>
                    {subcategory.name}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    letterSpacing: 0.2,
  },
  placeholder: {
    flex: 1,
    fontSize: 15,
    color: '#9CA3AF',
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  valueInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  addButton: {
    backgroundColor: '#0066FF',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  checkoutButton: {
    backgroundColor: '#0066FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.2,
  },
  closeButton: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryText: {
    fontSize: 15,
    color: '#1A1A1A',
    letterSpacing: 0.2,
  },
  selectedCategoryText: {
    color: '#0066FF',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  infoButtonText: {
    marginLeft: 4,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  specialHandlingContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  specialHandlingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  specialHandlingButtonActive: {
    backgroundColor: '#EBF5FF',
    borderColor: '#0066FF',
  },
  specialHandlingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  specialHandlingTextActive: {
    color: '#0066FF',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  imagePlaceholder: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  imagePlaceholderSubtext: {
    marginTop: 2,
    fontSize: 12,
    color: '#9CA3AF',
    letterSpacing: 0.1,
  },
  imageSourceButtons: {
    marginTop: 12,
    gap: 8,
  },
  imageSourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  imageSourceText: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  itemsList: {
    marginTop: 24,
    marginBottom: 16,
  },
  itemsListTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  itemDetails: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
    letterSpacing: 0.1,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    padding: 6,
  },
  removeButton: {
    padding: 6,
  },
  totalsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: 0.2,
  },
  itemThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginTop: 8,
  },
});

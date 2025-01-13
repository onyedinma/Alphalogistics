import React, { useState } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';

interface Category {
  id: string;
  name: string;
  subcategories?: string[];
}

const categories: Category[] = [
  { 
    id: 'food', 
    name: 'Food',
    subcategories: ['Beans', 'Garri', 'Rice', 'Other Foodstuff']
  },
  { 
    id: 'electronics', 
    name: 'Electronics',
    subcategories: ['Phones', 'Computer Accessories', 'Other Electronics']
  },
  {
    id: 'accessories',
    name: 'Jewelries/Accessories'
  },
  {
    id: 'documents',
    name: 'Documents'
  }
];

interface ItemDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export function ItemDetailsModal({ visible, onClose, onSave }: ItemDetailsModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>Item Details</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          {/* Category Selection */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Categories</ThemedText>
            {/* Add category selection UI */}
          </View>

          {/* Add New Item Button */}
          <TouchableOpacity style={styles.addButton}>
            <ThemedText style={styles.addButtonText}>Add New Item</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
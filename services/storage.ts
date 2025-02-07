import AsyncStorage from '@react-native-async-storage/async-storage';
import { ItemDetails, OrderDraft, Location } from '@/app/(dashboard)/customer/types';

export class StorageService {
  private static validateOrderStorage(data: any): data is OrderDraft {
    if (!data || typeof data !== 'object') return false;

    // Validate delivery object if it exists
    if (data.delivery) {
      if (typeof data.delivery !== 'object') return false;
      if (data.delivery.scheduledPickup && typeof data.delivery.scheduledPickup !== 'string') return false;
      if (data.delivery.vehicle && typeof data.delivery.vehicle !== 'string') return false;
      if (data.delivery.fee !== undefined && typeof data.delivery.fee !== 'number') return false;
    }

    // Validate sender object if it exists
    if (data.sender) {
      if (typeof data.sender !== 'object') return false;
      if (typeof data.sender.name !== 'string') return false;
      if (typeof data.sender.address !== 'string') return false;
      if (typeof data.sender.phone !== 'string') return false;
      if (typeof data.sender.state !== 'string') return false;
    }

    // Validate receiver object if it exists
    if (data.receiver) {
      if (typeof data.receiver !== 'object') return false;
      if (typeof data.receiver.name !== 'string') return false;
      if (typeof data.receiver.address !== 'string') return false;
      if (typeof data.receiver.phone !== 'string') return false;
      if (typeof data.receiver.state !== 'string') return false;
      if (data.receiver.deliveryMethod && !['pickup', 'delivery'].includes(data.receiver.deliveryMethod)) return false;
    }

    // Validate locations if they exist
    if (data.locations) {
      if (typeof data.locations !== 'object') return false;
      if (data.locations.pickup && !this.validateLocation(data.locations.pickup)) return false;
      if (data.locations.delivery && !this.validateLocation(data.locations.delivery)) return false;
    }

    // Validate items array if it exists
    if (data.items) {
      if (!Array.isArray(data.items)) return false;
      for (const item of data.items) {
        if (!this.validateItemDetails(item)) return false;
      }
    }

    // Validate pricing if it exists
    if (data.pricing) {
      if (typeof data.pricing !== 'object') return false;
      if (data.pricing.itemValue !== undefined && typeof data.pricing.itemValue !== 'number') return false;
      if (data.pricing.deliveryFee !== undefined && typeof data.pricing.deliveryFee !== 'number') return false;
      if (data.pricing.total !== undefined && typeof data.pricing.total !== 'number') return false;
    }

    // Validate orderDetails if it exists
    if (data.orderDetails) {
      if (typeof data.orderDetails !== 'object') return false;
      if (data.orderDetails.status && data.orderDetails.status !== 'draft') return false;
      if (data.orderDetails.createdAt && typeof data.orderDetails.createdAt !== 'string') return false;
      if (data.orderDetails.updatedAt && typeof data.orderDetails.updatedAt !== 'string') return false;
    }

    return true;
  }

  private static validateLocation(location: any): location is Location {
    if (!location || typeof location !== 'object') return false;
    if (location.address && typeof location.address !== 'string') return false;
    if (location.city && typeof location.city !== 'string') return false;
    if (location.state && typeof location.state !== 'string') return false;
    if (location.postalCode && typeof location.postalCode !== 'string') return false;
    if (location.country && typeof location.country !== 'string') return false;
    if (location.instructions && typeof location.instructions !== 'string') return false;
    return true;
  }

  private static validateItemDetails(item: any): item is ItemDetails {
    if (!item || typeof item !== 'object') return false;
    if (!item.name || typeof item.name !== 'string') return false;
    if (!item.category || typeof item.category !== 'string') return false;
    if (!item.subcategory || typeof item.subcategory !== 'string') return false;
    if (typeof item.quantity !== 'number') return false;
    if (typeof item.weight !== 'number') return false;
    if (typeof item.value !== 'number') return false;
    if (item.imageUri && typeof item.imageUri !== 'string') return false;
    if (item.isFragile !== undefined && typeof item.isFragile !== 'boolean') return false;
    if (item.requiresSpecialHandling !== undefined && typeof item.requiresSpecialHandling !== 'boolean') return false;
    if (item.specialInstructions && typeof item.specialInstructions !== 'string') return false;
    if (item.dimensions) {
      if (typeof item.dimensions !== 'object') return false;
      if (item.dimensions.length !== undefined && typeof item.dimensions.length !== 'number') return false;
      if (item.dimensions.width !== undefined && typeof item.dimensions.width !== 'number') return false;
      if (item.dimensions.height !== undefined && typeof item.dimensions.height !== 'number') return false;
    }
    return true;
  }

  static async saveOrderDraft(data: Partial<OrderDraft>): Promise<void> {
    try {
      const currentDraft = await this.getOrderDraft();
      const updatedDraft = {
        ...currentDraft,
        ...data,
        orderDetails: {
          status: 'draft',
          createdAt: currentDraft?.orderDetails?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      if (!this.validateOrderStorage(updatedDraft)) {
        throw new Error('Invalid order data structure');
      }

      await AsyncStorage.setItem('orderDraft', JSON.stringify(updatedDraft));
    } catch (error) {
      console.error('Error saving order draft:', error);
      throw error;
    }
  }

  static async getOrderDraft(): Promise<OrderDraft | null> {
    try {
      const data = await AsyncStorage.getItem('orderDraft');
      if (!data) return null;

      const parsedData = JSON.parse(data);
      if (!this.validateOrderStorage(parsedData)) {
        throw new Error('Invalid order data structure in storage');
      }

      return parsedData;
    } catch (error) {
      console.error('Error getting order draft:', error);
      throw error;
    }
  }

  static async clearOrderData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('orderDraft');
    } catch (error) {
      console.error('Error clearing order data:', error);
      throw error;
    }
  }

  static async initializeOrderDraft(): Promise<void> {
    try {
      const emptyDraft: OrderDraft = {
        delivery: {
          scheduledPickup: '',
          vehicle: '',
          fee: 0
        },
        sender: {
          name: '',
          address: '',
          phone: '',
          state: ''
        },
        receiver: {
          name: '',
          address: '',
          phone: '',
          state: '',
          deliveryMethod: 'delivery'
        },
        locations: {
          pickup: {
            address: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'Nigeria'
          },
          delivery: {
            address: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'Nigeria'
          }
        },
        items: [],
        pricing: {
          itemValue: 0,
          deliveryFee: 0,
          total: 0
        },
        orderDetails: {
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
      await this.saveOrderDraft(emptyDraft);
    } catch (error) {
      console.error('Error initializing order draft:', error);
      throw error;
    }
  }
} 
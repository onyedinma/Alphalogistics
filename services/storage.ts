import AsyncStorage from '@react-native-async-storage/async-storage';
import { ItemDetails, OrderDraft } from '@/app/(dashboard)/customer/types';

export class StorageService {
  private static validateOrderStorage(data: any): data is OrderDraft {
    if (!data || typeof data !== 'object') return false;

    // Validate delivery object if it exists
    if (data.delivery) {
      if (typeof data.delivery !== 'object') return false;
      if (data.delivery.scheduledPickup && typeof data.delivery.scheduledPickup !== 'string') return false;
      if (data.delivery.vehicle && typeof data.delivery.vehicle !== 'string') return false;
      if (data.delivery.fee && typeof data.delivery.fee !== 'number') return false;
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
    }

    return true;
  }

  static async saveOrderDraft(data: Partial<OrderDraft>): Promise<void> {
    try {
      if (!this.validateOrderStorage(data)) {
        throw new Error('Invalid order data structure');
      }
      await AsyncStorage.setItem('orderDraft', JSON.stringify(data));
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
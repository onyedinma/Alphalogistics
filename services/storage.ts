import AsyncStorage from '@react-native-async-storage/async-storage';
import { OrderStorage, STORAGE_KEYS, StorageUtils } from '@/types/storage';

/**
 * Service for handling all AsyncStorage operations
 */
export class StorageService {
  /**
   * Saves the current order draft
   */
  static async saveOrderDraft(orderData: Partial<OrderStorage>): Promise<void> {
    try {
      // Get existing draft
      const existingDraft = await this.getOrderDraft();
      
      // Merge with existing data
      const updatedDraft = {
        ...existingDraft,
        ...orderData,
        orderDetails: {
          ...existingDraft?.orderDetails,
          ...orderData.orderDetails,
          updatedAt: new Date().toISOString(),
        },
      };

      // Validate before saving
      if (!StorageUtils.validateOrderStorage(updatedDraft)) {
        throw new Error('Invalid order data structure');
      }

      await AsyncStorage.setItem(
        STORAGE_KEYS.ORDER_DRAFT,
        JSON.stringify(updatedDraft)
      );
    } catch (error) {
      console.error('Error saving order draft:', error);
      throw error;
    }
  }

  /**
   * Retrieves the current order draft
   */
  static async getOrderDraft(): Promise<OrderStorage | null> {
    try {
      const draftString = await AsyncStorage.getItem(STORAGE_KEYS.ORDER_DRAFT);
      if (!draftString) return null;

      const draft = JSON.parse(draftString);
      if (!StorageUtils.validateOrderStorage(draft)) {
        throw new Error('Invalid order data in storage');
      }

      return draft;
    } catch (error) {
      console.error('Error getting order draft:', error);
      return null;
    }
  }

  /**
   * Clears the current order draft
   */
  static async clearOrderDraft(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ORDER_DRAFT);
    } catch (error) {
      console.error('Error clearing order draft:', error);
      throw error;
    }
  }

  /**
   * Initializes a new order draft
   */
  static async initializeOrderDraft(): Promise<void> {
    try {
      const emptyDraft = StorageUtils.createEmptyOrderStorage();
      await this.saveOrderDraft(emptyDraft);
    } catch (error) {
      console.error('Error initializing order draft:', error);
      throw error;
    }
  }

  /**
   * Updates a specific section of the order draft
   */
  static async updateOrderSection<K extends keyof OrderStorage>(
    section: K,
    data: OrderStorage[K]
  ): Promise<void> {
    try {
      const draft = await this.getOrderDraft() || StorageUtils.createEmptyOrderStorage();
      draft[section] = data;
      await this.saveOrderDraft(draft);
    } catch (error) {
      console.error(`Error updating order section ${section}:`, error);
      throw error;
    }
  }

  /**
   * Saves user preferences
   */
  static async saveUserPreferences(preferences: Record<string, any>): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify(preferences)
      );
    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw error;
    }
  }

  /**
   * Gets user preferences
   */
  static async getUserPreferences(): Promise<Record<string, any> | null> {
    try {
      const prefsString = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return prefsString ? JSON.parse(prefsString) : null;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  /**
   * Clears all storage (use with caution)
   */
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ORDER_DRAFT,
        STORAGE_KEYS.USER_PREFERENCES,
        STORAGE_KEYS.AUTH_DATA,
      ]);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }
} 
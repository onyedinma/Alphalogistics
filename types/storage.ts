// AsyncStorage Types
export interface OrderStorage {
  // Core Order Details
  orderDetails: {
    orderId?: string;
    status: 'draft' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
    createdAt: string;
    updatedAt: string;
  };

  // Item Information
  items: {
    category: string;
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
  }[];

  // Location & Contact Information
  locations: {
    pickup: {
      address: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
      contactName: string;
      contactPhone: string;
      alternatePhone?: string;
      instructions?: string;
    };
    delivery: {
      address: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
      contactName: string;
      contactPhone: string;
      alternatePhone?: string;
      instructions?: string;
    };
  };

  // Scheduling & Delivery
  delivery: {
    scheduledPickup: string; // ISO date string
    vehicle: {
      type: 'bike' | 'car' | 'van' | 'truck';
      maxWeight?: number;
      specialRequirements?: string[];
    };
    preferences?: {
      timeSlots?: string[];
      leaveWithNeighbor?: boolean;
      leaveAtDoor?: boolean;
      specialInstructions?: string;
    };
    rto?: {
      acceptCharges: boolean;
      acknowledgePolicy: boolean;
      alternateContact?: string;
      alternatePhone?: string;
    };
  };

  // Pricing & Insurance
  pricing: {
    itemValue: number;
    deliveryFee: number;
    insurance?: {
      type: string;
      coverage: number;
      premium: number;
    };
    total: number;
  };
}

// Utility type for AsyncStorage keys
export type AsyncStorageKeys = keyof OrderStorage;

// Constants for AsyncStorage keys
export const STORAGE_KEYS = {
  ORDER_DRAFT: 'orderDraft',     // Stores the entire OrderStorage object
  USER_PREFERENCES: 'userPrefs', // For user-specific settings
  AUTH_DATA: 'authData'         // For authentication-related data
} as const;

// Helper functions for type-safe AsyncStorage operations
export const StorageUtils = {
  /**
   * Validates if the data structure matches the OrderStorage interface
   */
  validateOrderStorage: (data: any): data is OrderStorage => {
    // Basic validation of required fields
    const requiredSections = ['orderDetails', 'items', 'locations', 'delivery', 'pricing'];
    return requiredSections.every(section => section in data);
  },

  /**
   * Creates an empty order storage structure
   */
  createEmptyOrderStorage: (): OrderStorage => ({
    orderDetails: {
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    items: [],
    locations: {
      pickup: {
        address: '',
        contactName: '',
        contactPhone: '',
      },
      delivery: {
        address: '',
        contactName: '',
        contactPhone: '',
      },
    },
    delivery: {
      scheduledPickup: '',
      vehicle: {
        type: 'bike',
      },
    },
    pricing: {
      itemValue: 0,
      deliveryFee: 0,
      total: 0,
    },
  }),
}; 
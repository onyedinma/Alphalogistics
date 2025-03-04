export interface ContactDetails {
  name: string;
  address: string;
  state: string;
  phone: string;
  deliveryMethod: 'pickup' | 'delivery';
  pickupCenter?: string;
  specialInstructions?: string;
  streetNumber?: string;
  landmark?: string;
  locality?: string;
  city?: string;
  pincode?: string;
}

// Define the OrderItem type
export interface OrderItem {
  id: string; // Assuming you have an id field
  name: string;
  category: string;
  subcategory: string;
  quantity: number;
  weight: number; // Change to number
  value: number; // Change to number
  description: string;
  isFragile?: boolean;
  requiresSpecialHandling?: boolean;
  specialInstructions?: string;
}

export interface OrderDraft {
  sender: {
    name: string;
    address: string;
    phone: string;
    state: string;
  };
  receiver: {
    name: string;
    address: string;
    phone: string;
    state: string;
  };
  delivery: {
    scheduledPickup: string;
    vehicle: string;
    fee: number;
  };
  items: ItemDetails[];
  pricing: {
    itemValue: number;
    deliveryFee: number;
    total: number;
  };
}

// Update ItemFormData interface to handle string inputs
export interface ItemFormData {
  name: string;
  category: string;
  subcategory: string;
  quantity: string;  // String for form input
  weight: string;    // String for form input
  value: string;     // String for form input
  isFragile: boolean;
  requiresSpecialHandling: boolean;
  specialInstructions: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
}

// Actual item details interface with proper types
export interface ItemDetails {
  name: string;
  category: string;
  subcategory: string;
  quantity: number;  // Number for storage
  weight: number;    // Number for storage
  value: number;     // Number for storage
  isFragile: boolean;
  requiresSpecialHandling: boolean;
  specialInstructions: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  images?: string[];
}
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

export type CategoryType = 'electronics' | 'clothing' | 'documents' | 'food' | 'fragile' | 'other';

// Base interface for form data
export interface ItemFormBase {
  name: string;
  category: CategoryType;
  subcategory: string;
  isFragile: boolean;
  requiresSpecialHandling: boolean;
  specialInstructions: string;
  images?: string[];
}

// Form interface with string values for inputs
export interface ItemFormData extends ItemFormBase {
  quantity: string;
  weight: string;
  value: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
}

// Data interface with numeric values for storage
export interface ItemDetails extends ItemFormBase {
  quantity: number;
  weight: number;
  value: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

// Consistently use the same types in OrderItem
export interface OrderItem extends ItemDetails {
  id?: string;
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
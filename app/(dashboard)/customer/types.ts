export type CategoryType = 'electronics' | 'clothing' | 'documents' | 'food' | 'fragile' | 'other';

export interface ItemDetails {
  category: string;
  subcategory: string;
  name: string;
  weight: number;  // Changed from string to number
  quantity: number;  // Changed from string to number
  value: number;  // Changed from string to number
  imageUri?: string;
  images?: string[];
  isFragile?: boolean;
  requiresSpecialHandling?: boolean;
  specialInstructions?: string;
  dimensions?: {
    length: number;  // Changed from string to number
    width: number;   // Changed from string to number
    height: number;  // Changed from string to number
  };
}

export interface Location {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;  // Make sure country is included
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  instructions?: string;
}

export interface OrderLocations {
  pickup: Location;
  delivery: Location;
}

// Update the base contact details interface
interface BaseContact {
  name: string;
  phone: string;
  address: string;
  state: string;
}

// Add ContactDetails interface
export interface ContactDetails {
  name: string;
  phone: string;
  address: string;
  state: string;
  deliveryMethod: 'pickup' | 'delivery';
  pickupCenter?: string;
  streetNumber?: string;
  landmark?: string;
  locality?: string;
  city?: string;
  pincode?: string;
}

// Update the sender interface
export interface SenderDetails {
  name: string;
  phone: string;
  address: string;
  state: string;
}

// Update the receiver interface
export interface ReceiverDetails extends ContactDetails {
  // Any additional receiver-specific fields can go here
}

export interface OrderDraft {
  sender: SenderDetails;
  receiver?: ReceiverDetails;
  delivery: {
    scheduledPickup: string;
    vehicle: string;
    fee: number;
  };
  locations: OrderLocations;
  items: ItemDetails[];
  pricing: {
    itemValue: number;
    deliveryFee: number;
    total: number;
  };
  orderDetails?: {
    status: 'draft';
    createdAt: string;
    updatedAt: string;
  };
}

export interface OrderItem {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  quantity: number;
  weight: number;
  value: number;
  imageUrl: string | null;  // Changed from undefined to null
  isFragile: boolean;
  requiresSpecialHandling: boolean;
  specialInstructions: string;  // Made required with empty string as default
  dimensions: {          // Made required
    length: number;
    width: number;
    height: number;
  } | null;             // Use null instead of undefined
}

export interface OrderPricing {
  basePrice: number;
  distancePrice?: number;
  weightPrice?: number;
  insurancePrice?: number;
  total: number;
}

export interface OrderInsurance {
  type: 'basic' | 'premium';
  coverage: number;
  cost: number;
}

export interface CreateOrderParams {
  items: Array<{
    id: string;
    name: string;
    category: string;
    subcategory: string;
    quantity: number;
    weight: number;
    value: number;
    imageUrl: string | null;
    isFragile: boolean;
    requiresSpecialHandling: boolean;
    specialInstructions: string;
    dimensions: {
      length: number;
      width: number;
      height: number;
    } | null;
  }>;
  pickupLocation: Location;
  deliveryLocation: Location;
  pricing: {
    basePrice: number;
    total: number;
  };
  sender: {
    name: string;
    phone: string;
    address: string;
    state: string;
  };
  receiver: {
    name: string;
    phone: string;
    address: string;
    state: string;
  };
  delivery: {
    scheduledPickup: string;
    vehicle: string;
  };
  paymentMethod: {
    type: 'card' | 'cash' | 'wallet';
    details: null;
  };
}

export interface Order {
  id: string;
  customerId: string;
  trackingNumber: string;
  status: 'pending' | 'processing' | 'in-transit' | 'delivered' | 'cancelled';
  items: ItemDetails[];
  deliveryLocation: Location;
  pickupLocation: Location;
  pricing: {
    itemValue: number;
    deliveryFee: number;
    total: number;
  };
  createdAt: Date;
  updatedAt: Date;
  deliveryDate?: Date;
  estimatedDeliveryTime?: string;
}
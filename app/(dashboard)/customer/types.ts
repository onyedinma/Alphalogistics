export type CategoryType = 'electronics' | 'clothing' | 'documents' | 'food' | 'fragile' | 'other';

export interface ItemDetails {
  category: string;
  subcategory: string;
  name: string;
  weight: number;
  quantity: number;
  value: number;
  imageUri?: string;
  images?: string[];
  isFragile?: boolean;
  requiresSpecialHandling?: boolean;
  specialInstructions?: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface Location {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
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

export interface ContactDetails {
  name: string;
  phone: string;
  address: string;
  state: string;
  deliveryMethod: 'pickup' | 'delivery';
  pickupCenter?: string;
  specialInstructions?: string;
  streetNumber?: string;
  landmark?: string;
  locality?: string;
  city?: string;
  pincode?: string;
}

export interface OrderDraft {
  sender: {
    name: string;
    address: string;
    phone: string;
    state: string;
  };
  receiver?: {
    name: string;
    address: string;
    phone: string;
    state: string;
    deliveryMethod: 'pickup' | 'delivery';
    pickupCenter?: string;
    streetNumber?: string;
    landmark?: string;
    locality?: string;
    city?: string;
    pincode?: string;
  };
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
  subcategory?: string;
  quantity: number;
  weight: number;
  value: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  imageUrl?: string;
  isFragile: boolean;
  requiresSpecialHandling: boolean;
  specialInstructions?: string;
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
  items: OrderItem[];
  pickupLocation: Location;
  deliveryLocation: Location;
  pricing: OrderPricing;
  insurance?: OrderInsurance;
  sender: ContactDetails;
  receiver: ContactDetails;
  scheduledPickup: string | Date;
  vehicle: {
    type: string;
    maxWeight?: number;
  };
  paymentMethod?: {
    type: 'card' | 'cash' | 'wallet';
    details?: any;
  };
}
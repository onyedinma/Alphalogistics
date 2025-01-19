import { Timestamp } from 'firebase/firestore';

export type CategoryType = 'Food' | 'Electronics' | 'Jewelries/Accessories' | 'Documents' | 'Health Products' | 'Computer Accessories' | 'Phones' | 'Others';

export interface Location {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  instructions?: string;
}

export interface ItemDetails {
  name: string;
  category: CategoryType;
  subcategory: string;
  quantity: number;
  weight: number;
  value: number;
  imageUri?: string;
  isFragile?: boolean;
  requiresSpecialHandling?: boolean;
  specialInstructions?: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

export interface OrderDraft {
  sender?: {
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
  };
  delivery?: {
    scheduledPickup: string;
    vehicle: string;
    fee: number;
  };
  locations?: {
    pickup: Location;
    delivery: Location;
  };
  items?: ItemDetails[];
  pricing?: {
    itemValue: number;
    deliveryFee: number;
    total: number;
  };
  orderDetails?: {
    status: 'draft' | 'pending' | 'confirmed';
    createdAt: string;
    updatedAt: string;
  };
} 
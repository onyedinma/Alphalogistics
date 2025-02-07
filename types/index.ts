import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface User {
  id: string;
  email: string;
  phoneNumber?: string;
  role: 'customer' | 'admin' | 'staff' | 'delivery';
  name: string;
  createdAt: Date;
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

export interface ItemDetails {
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

export interface ContactDetails {
  name: string;
  phone: string;
  address: string;
  state: string;
  deliveryMethod: 'pickup' | 'delivery';
  pickupCenter?: string;
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
    deliveryMethod: 'pickup' | 'delivery';
    pickupCenter?: string;
  };
  delivery: {
    scheduledPickup: string;
    vehicle: string;
    fee: number;
  };
  locations: {
    pickup: Location;
    delivery: Location;
  };
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

export interface Order {
  id: string;
  customerId: string;
  status: 'pending' | 'pickup' | 'transit' | 'delivered' | 'cancelled';
  trackingNumber: string;
  estimatedDelivery: string;
  currentLocation?: string;
  items: OrderItem[];
  pickupLocation: Location;
  deliveryLocation: Location;
  pricing: OrderPricing;
  insurance?: OrderInsurance;
  sender: ContactDetails;
  receiver: ContactDetails;
  scheduledPickup: Date;
  vehicle: {
    type: string;
    maxWeight?: number;
  };
  deliveryPreferences?: {
    timeSlots: string[];
    leaveWithNeighbor: boolean;
    leaveAtDoor: boolean;
    specialInstructions?: string;
  };
  rtoInformation?: {
    acceptCharges: boolean;
    acknowledgePolicy: boolean;
    alternateContact?: string;
    alternatePhone?: string;
  };
  paymentMethod?: {
    type: 'card' | 'cash' | 'wallet';
    details?: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryMetrics {
  totalDeliveries: number;
  successRate: number;
  averageDeliveryTime: number;
  customerRating: number;
}

export interface Revenue {
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  breakdown: {
    deliveryFees: number;
    insuranceFees: number;
    otherFees: number;
  };
}

export interface SignInResponse {
  user: {
    email: string | null;
    name: string | null;
  };
  idToken: string;
}

export interface VehicleDetails {
  type: 'bike' | 'car' | 'van' | 'truck';
  maxWeight?: number;
  maxDimensions?: string;
}

export interface DeliveryPreferences {
  acceptRTOCharges: boolean;
  acknowledgeRTOPolicy: boolean;
  deliveryAttemptPreferences: {
    preferredTimeSlots: string[];
    alternateContact?: string;
    alternateContactPhone?: string;
    leaveWithNeighbor: boolean;
    leaveAtDoorIfAbsent: boolean;
  };
}

export interface RTOInformation {
  enabled: boolean;
  maxAttempts?: number;
  returnAddress?: string;
  returnContact?: string;
  returnPhone?: string;
}

export interface OrderStorageData extends OrderDraft {}

export interface OrderStorage extends OrderStorageData {
  orderDetails: {
    status: 'draft';
    createdAt: string;
    updatedAt: string;
  };
}

export interface User {
  id: string;
  email: string;
  phoneNumber?: string;
  role: 'customer' | 'admin' | 'staff' | 'delivery';
  name: string;
  createdAt: Date;
}

export interface CreateOrderParams {
  items: OrderItem[];
  pickupLocation: Location;
  deliveryLocation: Location;
  pricing: OrderPricing;
  insurance?: OrderInsurance;
  sender: ContactDetails;
  receiver: ContactDetails;
  scheduledPickup: string;
  vehicle: VehicleDetails;
  deliveryPreferences?: DeliveryPreferences;
  rtoInformation?: RTOInformation;
  paymentMethod: 'card' | 'transfer' | 'cash';
}

export interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  weight?: number; // in kg
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  value?: number; // for insurance purposes
  imageUri?: string; // Local image URI
  imageUrl?: string; // Firebase Storage URL
  isFragile?: boolean;
  requiresSpecialHandling?: boolean;
  specialInstructions?: string;
}

export interface OrderInsurance {
  type: 'basic' | 'premium';
  coverage: number;
  cost: number;
}

export interface OrderPricing {
  basePrice: number;
  distancePrice: number;
  weightPrice: number;
  insurancePrice: number;
  total: number;
}

export interface Order {
  id: string;
  customerId: string;
  status: 'draft' | 'pending' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  pickupLocation: Location;
  deliveryLocation: Location;
  items: OrderItem[];
  pricing: OrderPricing;
  insurance?: OrderInsurance;
  sender: ContactDetails;
  receiver: ContactDetails;
  scheduledPickup: Date;
  vehicle: VehicleDetails;
  deliveryPreferences?: DeliveryPreferences;
  rtoInformation?: RTOInformation;
  paymentMethod: 'card' | 'transfer' | 'cash';
  trackingNumber: string;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  details?: string;
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

export interface ContactDetails {
  name: string;
  address: string;
  state: string;
  phone: string;
  alternatePhone?: string;
  preferredDeliveryTime?: {
    from: string;
    to: string;
  };
  deliveryInstructions?: string;
  landmarks?: string[];
  imageUri?: string;
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

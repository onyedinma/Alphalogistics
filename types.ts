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
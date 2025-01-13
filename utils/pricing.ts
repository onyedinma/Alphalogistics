import { OrderItem, Location, OrderPricing, OrderInsurance } from '@/types';

const BASE_PRICE = 10; // Base delivery fee
const PRICE_PER_KM = 2; // Price per kilometer
const PRICE_PER_KG = 1.5; // Price per kilogram

export const INSURANCE_OPTIONS = {
  basic: {
    type: 'basic' as const,
    coverage: 1000, // Coverage up to $1000
    rate: 0.01, // 1% of declared value
  },
  premium: {
    type: 'premium' as const,
    coverage: 5000, // Coverage up to $5000
    rate: 0.02, // 2% of declared value
  },
};

export function calculateDistance(pickup: Location, delivery: Location): number {
  // Simple distance calculation using Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = toRad(delivery.latitude - pickup.latitude);
  const dLon = toRad(delivery.longitude - pickup.longitude);
  const lat1 = toRad(pickup.latitude);
  const lat2 = toRad(delivery.latitude);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI/180);
}

export function calculatePricing(
  items: OrderItem[],
  pickup: Location,
  delivery: Location,
  insurance?: OrderInsurance
): OrderPricing {
  const distance = calculateDistance(pickup, delivery);
  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0);
  
  const distancePrice = distance * PRICE_PER_KM;
  const weightPrice = totalWeight * PRICE_PER_KG;
  const insurancePrice = insurance ? calculateInsurancePrice(items, insurance) : 0;

  return {
    basePrice: BASE_PRICE,
    distancePrice,
    weightPrice,
    insurancePrice,
    total: BASE_PRICE + distancePrice + weightPrice + insurancePrice,
  };
}

function calculateInsurancePrice(items: OrderItem[], insurance: OrderInsurance): number {
  const totalValue = items.reduce((sum, item) => sum + (item.value || 0) * item.quantity, 0);
  const option = Object.values(INSURANCE_OPTIONS).find(opt => opt.type === insurance.type);
  if (!option) return 0;
  
  return Math.min(totalValue, insurance.coverage) * option.rate;
} 
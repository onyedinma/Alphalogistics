import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Order, OrderItem, Location, OrderPricing, OrderInsurance, CreateOrderParams } from '@/types';

function generateTrackingNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `AL${timestamp}${random}`;
}

export async function createOrder({
  items,
  pickupLocation,
  deliveryLocation,
  pricing,
  insurance,
  sender,
  receiver,
  scheduledPickup,
  vehicle,
  deliveryPreferences,
  rtoInformation,
  paymentMethod,
}: CreateOrderParams): Promise<Order> {
  const user = auth().currentUser;
  if (!user) throw new Error('User must be authenticated to create an order');

  const trackingNumber = generateTrackingNumber();
  const now = new Date();

  // Process items to ensure they have the correct structure
  const processedItems = items.map(item => ({
    ...item,
    // Ensure imageUri is renamed to imageUrl for consistency
    imageUrl: item.imageUri,
    imageUri: undefined
  }));

  const orderData: Order = {
    id: '', // Will be set after creation
    customerId: user.uid,
    status: 'pending',
    items: processedItems,
    pickupLocation,
    deliveryLocation,
    pricing,
    insurance,
    sender,
    receiver,
    scheduledPickup: new Date(scheduledPickup),
    vehicle,
    deliveryPreferences,
    rtoInformation,
    paymentMethod,
    trackingNumber,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const orderRef = await firestore().collection('orders').add(orderData);
    return {
      ...orderData,
      id: orderRef.id,
    };
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('Failed to create order. Please try again.');
  }
} 
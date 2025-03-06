import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { CreateOrderParams, Order } from '@/app/(dashboard)/customer/types';

export const OrderService = {
  async createOrder(orderData: CreateOrderParams) {
    try {
      console.log('Creating order with data:', JSON.stringify(orderData, null, 2));
      const user = auth().currentUser;
      if (!user) throw new Error('No authenticated user');

      // Format the data for Firestore
      const cleanOrderData = {
        customerId: user.uid,
        trackingNumber: `AL${Date.now()}`,
        status: 'pending',
        items: orderData.items.map(item => ({
          id: item.id,
          name: item.name || '',
          category: item.category || '',
          subcategory: item.subcategory || '',
          quantity: Number(item.quantity) || 0,
          weight: Number(item.weight) || 0,
          value: Number(item.value) || 0,
          imageUrl: item.imageUrl || null,
          isFragile: Boolean(item.isFragile),
          requiresSpecialHandling: Boolean(item.requiresSpecialHandling),
          specialInstructions: item.specialInstructions || '',
          dimensions: item.dimensions || null
        })),
        pickupLocation: {
          address: orderData.pickupLocation.address || '',
          city: orderData.pickupLocation.city || '',
          state: orderData.pickupLocation.state || '',
          postalCode: orderData.pickupLocation.postalCode || '',
          country: 'Nigeria'
        },
        deliveryLocation: {
          address: orderData.deliveryLocation.address || '',
          city: orderData.deliveryLocation.city || '',
          state: orderData.deliveryLocation.state || '',
          postalCode: orderData.deliveryLocation.postalCode || '',
          country: 'Nigeria'
        },
        sender: {
          name: orderData.sender.name || '',
          phone: orderData.sender.phone || '',
          address: orderData.sender.address || '',
          state: orderData.sender.state || ''
        },
        receiver: {
          name: orderData.receiver.name || '',
          phone: orderData.receiver.phone || '',
          address: orderData.receiver.address || '',
          state: orderData.receiver.state || ''
        },
        delivery: {
          scheduledPickup: orderData.delivery.scheduledPickup,
          vehicle: orderData.delivery.vehicle
        },
        pricing: {
          basePrice: Number(orderData.pricing.basePrice) || 0,
          total: Number(orderData.pricing.total) || 0
        },
        paymentMethod: {
          type: orderData.paymentMethod.type,
          details: null
        },
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp()
      };

      console.log('Clean order data for Firestore:', JSON.stringify(cleanOrderData, null, 2));

      const orderRef = await firestore()
        .collection('orders')
        .add(cleanOrderData);

      console.log('Order created with ID:', orderRef.id);
      return orderRef.id;
    } catch (error) {
      console.error('Error in OrderService.createOrder:', error);
      throw error;
    }
  },

  async getActiveOrders(): Promise<Order[]> {
    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const snapshot = await firestore()
        .collection('orders')
        .where('customerId', '==', user.uid)
        .where('status', 'in', ['pending', 'processing', 'in_transit'])
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
    } catch (error) {
      console.error('Error getting active orders:', error);
      throw error;
    }
  },

  async getOrderHistory(): Promise<Order[]> {
    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const snapshot = await firestore()
        .collection('orders')
        .where('customerId', '==', user.uid)
        .where('status', 'in', ['delivered', 'cancelled'])
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
    } catch (error) {
      console.error('Error getting order history:', error);
      throw error;
    }
  },

  subscribeToOrder(orderId: string, callback: (order: Order) => void) {
    const user = auth().currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    return firestore()
      .collection('orders')
      .doc(orderId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const data = doc.data();
            if (data) {
              // Convert Firestore Timestamp to Date
              const order: Order = {
                id: doc.id,
                customerId: data.customerId,
                trackingNumber: data.trackingNumber,
                status: data.status,
                items: data.items,
                deliveryLocation: data.deliveryLocation,
                pickupLocation: data.pickupLocation,
                pricing: data.pricing,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
                deliveryDate: data.deliveryDate?.toDate(),
                estimatedDeliveryTime: data.estimatedDeliveryTime
              };
              callback(order);
            }
          }
        },
        (error) => {
          console.error('Error subscribing to order:', error);
          throw error;
        }
      );
  }
};
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { StorageService } from './storage';
import { Order } from '@/types';

export class OrderService {
  static async createOrder(params: any) {
    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Convert scheduledPickup from ISO string to Firestore timestamp
      const scheduledPickup = params.delivery?.scheduledPickup
        ? firestore.Timestamp.fromDate(new Date(params.delivery.scheduledPickup))
        : null;

      const orderData = {
        ...params,
        customerId: user.uid,
        status: 'pending',
        createdAt: firestore.Timestamp.now(),
        updatedAt: firestore.Timestamp.now(),
        delivery: {
          ...params.delivery,
          scheduledPickup
        }
      };

      const orderRef = await firestore().collection('orders').add(orderData);
      await StorageService.clearOrderData();
      return orderRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  static async getActiveOrders() {
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
  }

  static async getOrderHistory() {
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
      }));
    } catch (error) {
      console.error('Error getting order history:', error);
      throw error;
    }
  }

  static subscribeToOrder(orderId: string, callback: (order: any) => void) {
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
            callback({
              id: doc.id,
              ...doc.data()
            });
          }
        },
        (error) => {
          console.error('Error subscribing to order:', error);
          throw error;
        }
      );
  }
} 
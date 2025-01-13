import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import firestore from '@react-native-firebase/firestore';
import { Order } from '@/types';

export default function OrderDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('orders')
      .doc(id)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            setOrder({ id: doc.id, ...doc.data() } as Order);
          }
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching order:', error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <ThemedText>Order not found</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: `Order ${order.trackingNumber}`,
        }}
      />
      
      <ThemedText>Order Status: {order.status}</ThemedText>
      {/* We'll implement the full order details UI later */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 
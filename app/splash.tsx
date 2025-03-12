import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function SplashScreen() {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const checkAuthState = async () => {
      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const unsubscribe = auth().onAuthStateChanged(async user => {
        if (user) {
          try {
            // Get user role from Firestore
            const userDoc = await firestore().collection('users').doc(user.uid).get();
            const userData = userDoc.data();
            
            if (!userData || userData.role !== 'customer') {
              await auth().signOut();
              router.replace('/auth/login');
              return;
            }

            router.replace('/customer');
          } catch (error) {
            console.error('Error fetching user role:', error);
            await auth().signOut();
            router.replace('/auth/login');
          }
        } else {
          router.replace('/auth/login');
        }
      });

      return () => unsubscribe();
    };

    checkAuthState();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
        <Ionicons name="cube-outline" size={120} color="#007AFF" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  }
});

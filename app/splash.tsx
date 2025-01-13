import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { router, usePathname } from 'expo-router';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function SplashScreen() {
  const fadeAnim = new Animated.Value(0);
  const pathname = usePathname();

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
            
            if (!userData || !userData.role) {
              // No role found - sign out and redirect to login
              await auth().signOut();
              router.replace('/auth/login');
              return;
            }

            // Replace getCurrentRoute() with pathname
            const requestedRoute = pathname || '';
            
            // Check if user is trying to access a route they shouldn't
            if (
              (requestedRoute.includes('/staff') && userData.role !== 'staff') ||
              (requestedRoute.includes('/delivery') && userData.role !== 'delivery') ||
              (requestedRoute.includes('/customer') && userData.role !== 'customer')
            ) {
              // Redirect to appropriate dashboard based on their role
              switch (userData.role) {
                case 'customer':
                  router.replace('/customer');
                  break;
                case 'staff':
                  router.replace('/staff');
                  break;
                case 'delivery':
                  router.replace('/delivery');
                  break;
                default:
                  await auth().signOut();
                  router.replace('/auth/login');
              }
              return;
            }

            // If no unauthorized access attempt, proceed with normal routing
            switch (userData.role) {
              case 'customer':
                router.replace('/customer');
                break;
              case 'delivery':
                router.replace('/delivery');
                break;
              case 'staff':
                router.replace('/staff');
                break;
              default:
                await auth().signOut();
                router.replace('/auth/login');
            }
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

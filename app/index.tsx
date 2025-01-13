import React, { useEffect } from 'react';
import { router } from 'expo-router';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { UserData } from '@/types/auth';

type AppRoute = '/(dashboard)/customer' | '/(dashboard)/staff' | '/(dashboard)/delivery' | '/auth/login';

export default function Index() {
  const [initialRoute, setInitialRoute] = React.useState<AppRoute | null>(null);

  useEffect(() => {
    const checkAuthState = async () => {
      const user = auth().currentUser;
      if (!user) {
        setInitialRoute('/auth/login');
        return;
      }

      try {
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        const userData = userDoc.data() as UserData;

        if (!userData) {
          await auth().signOut();
          setInitialRoute('/auth/login');
          return;
        }

        switch (userData.role) {
          case 'customer':
            setInitialRoute('/(dashboard)/customer');
            break;
          case 'staff':
            setInitialRoute('/(dashboard)/staff');
            break;
          case 'delivery':
            setInitialRoute('/(dashboard)/delivery');
            break;
          default:
            await auth().signOut();
            setInitialRoute('/auth/login');
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        await auth().signOut();
        setInitialRoute('/auth/login');
      }
    };

    checkAuthState();
  }, []);

  useEffect(() => {
    if (initialRoute) {
      router.replace(initialRoute);
    }
  }, [initialRoute]);

  return null;
}

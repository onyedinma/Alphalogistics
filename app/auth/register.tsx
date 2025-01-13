import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import auth from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import firestore from '@react-native-firebase/firestore';
import { authStyles as styles } from '../../styles/auth';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { signUp } from '@/services/auth';
import { UserRole } from '@/types/auth';

// Initialize Google Sign-In (same as in login.tsx)
GoogleSignin.configure({
  webClientId: '733359249229-g8708ugilkga4u5m532rjfiqrcb91uef.apps.googleusercontent.com',
  offlineAccess: true,
  forceCodeForRefreshToken: true,
});

const userRoles = [
  { id: 'customer', label: 'Customer', icon: 'person-outline' },
  { id: 'delivery', label: 'Delivery Personnel', icon: 'bicycle-outline' },
  { id: 'staff', label: 'Staff', icon: 'briefcase-outline' },
];

const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string) => {
  return password.length >= 6;
};

const checkEmailExists = async (email: string) => {
  try {
    // Check Firestore for existing user with role
    const usersSnapshot = await firestore()
      .collection('users')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (!usersSnapshot.empty) {
      const existingUser = usersSnapshot.docs[0].data();
      return {
        exists: true,
        role: existingUser.role,
        message: `This email is already registered as a ${existingUser.role}. Please use a different email.`
      };
    }

    // Check Firebase Auth
    const methods = await auth().fetchSignInMethodsForEmail(email);
    if (methods.length > 0) {
      return {
        exists: true,
        role: 'user',
        message: 'This email is already registered. Please sign in instead.'
      };
    }

    return { exists: false, role: null, message: null };
  } catch (error) {
    console.error('Email check error:', error);
    return {
      exists: true,
      role: 'unknown',
      message: 'Unable to verify email availability. Please try again.'
    };
  }
};

export default function Register() {
  const { role } = useLocalSearchParams<{ role: UserRole }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!role || !['customer', 'staff', 'delivery'].includes(role)) {
      router.replace('/auth/select-role');
    }
  }, [role]);

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      setError('');

      // Check if device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Get the users ID token
      await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();

      if (!idToken) {
        throw new Error('No ID token found');
      }

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);

      // Create user profile
      await firestore().collection('users').doc(userCredential.user.uid).set({
        email: userCredential.user.email?.toLowerCase(),
        name: userCredential.user.displayName,
        role,
        createdAt: firestore.Timestamp.now(),
        updatedAt: firestore.Timestamp.now(),
        emailVerified: userCredential.user.emailVerified
      });

      // Route to appropriate dashboard
      switch (role) {
        case 'customer': router.replace('/customer'); break;
        case 'staff': router.replace('/staff'); break;
        case 'delivery': router.replace('/delivery'); break;
        default: throw new Error('Invalid role selected');
      }
    } catch (error: any) {
      console.error('Google Sign-Up Error:', error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        setError('');
        return;
      }
      setError('Failed to sign up with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!name || !email || !password || !confirmPassword) {
        throw new Error('Please fill in all fields');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      await signUp(email, password, role, name);
      // Will automatically redirect based on role due to auth state change
      
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <Ionicons name="cube-outline" size={60} color="#007AFF" />
        <Text style={styles.headerText}>Create Account</Text>
        <Text style={styles.subtitleText}>
          {role === 'customer' ? 'Customer Account' : 
           role === 'staff' ? 'Staff Account' : 'Delivery Partner Account'}
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.socialButton, { backgroundColor: '#fff' }]}
          onPress={handleGoogleSignUp}
          disabled={loading}
        >
          <Ionicons name="logo-google" size={24} color="#DB4437" />
          <Text style={styles.socialButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.footerText}>
              <Ionicons name="arrow-back" size={16} /> Back to previous screen
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

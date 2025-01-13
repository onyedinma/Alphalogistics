import { UserCredential } from 'firebase/auth';
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import auth from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import firestore from '@react-native-firebase/firestore';
import { authStyles as styles } from '../../styles/auth';
import { Ionicons } from '@expo/vector-icons';
import { signIn } from '@/services/auth';

// Initialize Google Sign-In with proper scopes
GoogleSignin.configure({
  webClientId: '733359249229-g8708ugilkga4u5m532rjfiqrcb91uef.apps.googleusercontent.com',
  offlineAccess: true,
  scopes: ['profile', 'email'],
  forceCodeForRefreshToken: true
});

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>('');

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      const userData = await signIn(email, password);
      // Will automatically redirect based on role due to auth state change

    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');

      await GoogleSignin.signOut();
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);

      // Get user role and route accordingly
      const userDoc = await firestore()
        .collection('users')
        .doc(userCredential.user.uid)
        .get();

      if (!userDoc.exists) {
        setError('This Google account is not registered. Please sign up first.');
        await auth().signOut();
        return;
      }

      const userData = userDoc.data();
      if (!userData?.role) {
        setError('Invalid user profile. Please sign up first.');
        await auth().signOut();
        return;
      }

      // Route based on existing role
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
          throw new Error('Invalid user role');
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the flow
        return;
      }
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  const handleSignUp = () => {
    router.push('/auth/register');
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Ionicons name="cube-outline" size={60} color="#007AFF" />
        <Text style={styles.headerText}>Alpha Logistics</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={[styles.footerText, styles.link, { textAlign: 'right' }]}>
            Forgot Password?
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.socialButton, { backgroundColor: '#fff' }]}
          onPress={handleGoogleLogin}
        >
          <Ionicons name="logo-google" size={24} color="#DB4437" />
          <Text style={styles.socialButtonText}>Continue with Google</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.push('/auth/select-role')}>
          <Text style={styles.footerText}>
            Don't have an account? <Text style={styles.link}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

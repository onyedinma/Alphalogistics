import { UserCredential } from 'firebase/auth';
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { router } from 'expo-router';
import auth from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import firestore from '@react-native-firebase/firestore';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { theme } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { signIn } from '@/services/auth';
import { signInWithGoogle, verifyCustomerRole } from '@/services/googleAuth';
import { useColorScheme } from '@/hooks/useColorScheme';

// Initialize Google Sign-In with proper scopes
GoogleSignin.configure({
  webClientId: '733359249229-g8708ugilkga4u5m532rjfiqrcb91uef.apps.googleusercontent.com',
  offlineAccess: true,
  scopes: ['profile', 'email'],
  forceCodeForRefreshToken: true
});

interface CustomStyles {
  container: ViewStyle;
  formContainer: ViewStyle;
  title: TextStyle;
  input: TextStyle;  // Changed from ViewStyle to TextStyle
  button: ViewStyle;
  buttonText: TextStyle;
  linkText: TextStyle;
  divider: ViewStyle;
  dividerLine: ViewStyle;
  dividerText: TextStyle;
  footer: ViewStyle;
  footerText: TextStyle;
  errorText: TextStyle;
  link: TextStyle;
  socialButton: ViewStyle;
  socialButtonText: TextStyle;
}

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>('');

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user data and verify role
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const userDoc = await firestore().collection('users').doc(userCredential.user.uid).get();
      
      if (!userDoc.exists) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data();
      if (!userData?.role || userData.role !== 'customer') {
        await auth().signOut();
        throw new Error('Access denied. This portal is for customers only.');
      }

      // Will automatically redirect to customer dashboard
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      const userCredential = await signInWithGoogle();
      await verifyCustomerRole(userCredential.user.uid);
      router.replace('/customer');

    } catch (error: any) {
      if (error.message === 'Sign in cancelled') {
        return;
      }
      setError(error.message);
      await GoogleSignin.signOut().catch(() => {});
      await auth().signOut().catch(() => {});
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
    <ScrollView 
      style={[
        styles.container, 
        { backgroundColor: isDark ? theme.colors.darkMode.background.primary : '#F8FAFC' }
      ]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.logoContainer}>
        <Ionicons 
          name="cube-outline" 
          size={64} 
          color={theme.colors.primary} 
          style={styles.logo}
        />
        <Text style={[
          styles.appName,
          { color: isDark ? theme.colors.darkMode.text.primary : '#1E293B' }
        ]}>
          Alpha Logistics
        </Text>
      </View>

      <View style={[
        styles.formContainer,
        {
          backgroundColor: isDark ? theme.colors.darkMode.background.secondary : '#FFFFFF',
          shadowColor: isDark ? '#000' : '#64748B',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 12,
          elevation: 4,
        }
      ]}>
        <Text style={[
          styles.welcomeText,
          { color: isDark ? theme.colors.darkMode.text.primary : '#1E293B' }
        ]}>
          Welcome back
        </Text>
        <Text style={[
          styles.subtitle,
          { color: isDark ? theme.colors.darkMode.text.secondary : '#64748B' }
        ]}>
          Sign in to your account to continue
        </Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={theme.colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDark ? theme.colors.darkMode.background.primary : '#F8FAFC',
              borderColor: isDark ? theme.colors.darkMode.border : '#E2E8F0',
              color: isDark ? theme.colors.darkMode.text.primary : '#1E293B',
            }
          ]}
          placeholderTextColor={isDark ? theme.colors.darkMode.text.tertiary : theme.colors.text.tertiary}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDark ? theme.colors.darkMode.background.primary : '#F8FAFC',
              borderColor: isDark ? theme.colors.darkMode.border : '#E2E8F0',
              color: isDark ? theme.colors.darkMode.text.primary : '#1E293B',
            }
          ]}
          placeholderTextColor={isDark ? theme.colors.darkMode.text.tertiary : theme.colors.text.tertiary}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.loginButton, { opacity: loading ? 0.7 : 1 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleForgotPassword}
          style={styles.forgotPasswordContainer}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: isDark ? '#374151' : '#E2E8F0' }]} />
          <Text style={[styles.dividerText, { color: isDark ? '#9CA3AF' : '#64748B' }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: isDark ? '#374151' : '#E2E8F0' }]} />
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          <Ionicons name="logo-google" size={20} color="#DB4437" />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={[
          styles.footerText,
          { color: isDark ? theme.colors.darkMode.text.secondary : '#64748B' }
        ]}>
          Don't have an account?{' '}
          <Text 
            style={styles.signUpLink}
            onPress={handleSignUp}
          >
            Sign Up
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 32,
  },
  logo: {
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
  },
  formContainer: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    marginLeft: 8,
    color: theme.colors.danger,
    fontSize: 14,
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  loginButton: {
    height: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: 12,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
  },
  googleButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  googleButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  signUpLink: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
});

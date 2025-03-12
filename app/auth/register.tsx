import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Stack, router } from 'expo-router';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { signUp, createCustomerProfile } from '@/services/auth';
import { signInWithGoogle, verifyCustomerRole } from '@/services/googleAuth';
import { theme } from '@/styles/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

// Type definitions
interface RegisterScreenProps {}

const Register: React.FC<RegisterScreenProps> = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      if (!name || !email || !password || !confirmPassword) {
        throw new Error('Please fill in all fields');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Pass only email, password, and name to signUp
      await signUp(email, password, name);
      // Will automatically redirect to customer dashboard
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const userCredential = await signInWithGoogle();
      
      // Check if user already exists
      try {
        await verifyCustomerRole(userCredential.user.uid);
        router.replace('/customer');
        return;
      } catch (error) {
        // User doesn't exist - create new profile
        await createCustomerProfile(
          userCredential.user.uid,
          userCredential.user.email,
          userCredential.user.displayName
        );
        router.replace('/customer');
      }

    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      }
      // Clean up if needed
      await GoogleSignin.signOut().catch(() => {});
      await auth().signOut().catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/auth/login');
  };

  return (
    <ScrollView 
      style={[
        styles.container,
        { backgroundColor: '#FFFFFF' }
      ]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <Ionicons name="cube-outline" size={60} color={theme.colors.primary} />
        <Text style={[styles.headerText, { color: theme.colors.text.primary }]}>Create Customer Account</Text>
      </View>

      <View style={[
        styles.formContainer,
        {
          backgroundColor: '#FFFFFF',
          borderColor: theme.colors.border,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3.84,
          elevation: 5,
        }
      ]}>
        <Text style={[
          styles.title,
          { color: theme.colors.text.primary }
        ]}>Create Account</Text>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: '#F5F5F5',
              borderColor: theme.colors.border,
              color: theme.colors.text.primary,
            }
          ]}
          placeholderTextColor={theme.colors.text.tertiary}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          autoCorrect={false}
        />

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: '#F5F5F5',
              borderColor: theme.colors.border,
              color: theme.colors.text.primary,
            }
          ]}
          placeholderTextColor={theme.colors.text.tertiary}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: '#F5F5F5',
              borderColor: theme.colors.border,
              color: theme.colors.text.primary,
            }
          ]}
          placeholderTextColor={theme.colors.text.tertiary}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: '#F5F5F5',
              borderColor: theme.colors.border,
              color: theme.colors.text.primary,
            }
          ]}
          placeholderTextColor={theme.colors.text.tertiary}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.colors.primary }]} 
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: '#E5E5E5' }]} />
          <Text style={[styles.dividerText, { color: theme.colors.text.tertiary }]}>OR</Text>
          <View style={[styles.dividerLine, { backgroundColor: '#E5E5E5' }]} />
        </View>

        <TouchableOpacity
          style={[styles.socialButton, { 
            backgroundColor: '#FFFFFF',
            borderColor: '#E5E5E5',
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 1,
            },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
          }]}
          onPress={handleGoogleSignUp}
          disabled={loading}
        >
          <Ionicons name="logo-google" size={24} color="#DB4437" />
          <Text style={[styles.socialButtonText, { color: theme.colors.text.primary }]}>
            Continue with Google
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.footerText, { color: theme.colors.text.secondary }]}>
              <Ionicons name="arrow-back" size={16} /> Back to previous screen
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleBackToLogin}>
            <Text style={[styles.footerText, { color: theme.colors.text.secondary }]}>
              Already have an account? {' '}
              <Text style={[styles.link, { color: theme.colors.primary }]}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

export default Register;

interface RegisterStyles {
  header: ViewStyle;
  headerText: TextStyle;
  form: ViewStyle;
  input: TextStyle;  // Changed from ViewStyle to TextStyle
  button: ViewStyle;
  buttonText: TextStyle;
  socialButton: ViewStyle;
  socialButtonText: TextStyle;
  divider: ViewStyle;
  dividerLine: ViewStyle;
  dividerText: TextStyle;
  footer: ViewStyle;
  footerText: TextStyle;
  link: TextStyle;
  container: ViewStyle;
  formContainer: ViewStyle;
  title: TextStyle;
}

const styles = StyleSheet.create<RegisterStyles>({
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  form: {
    gap: 15,
  },
  input: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 16,
    color: theme.colors.text.primary,
  } as TextStyle,
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  buttonText: {
    color: theme.colors.text.inverse,
    fontWeight: '600' as '600',  // Explicit type assertion
    fontSize: theme.typography.sizes.base,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  socialButtonText: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text.primary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    color: theme.colors.text.tertiary,
  },
  footer: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  footerText: {
    color: theme.colors.text.secondary,
  },
  link: {
    color: theme.colors.primary,
    fontWeight: '600' as '600',  // Explicit type assertion
  },
  container: {
    flex: 1,
    padding: 16,
  },
  formContainer: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
});

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import auth from '@react-native-firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { authStyles as styles } from '../../styles/auth';

export default function VerifyEmail() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const currentUser = auth().currentUser;

  const handleResendEmail = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      
      if (currentUser) {
        await currentUser.sendEmailVerification();
        setMessage('Verification email sent! Please check your inbox.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (currentUser) {
        await currentUser.reload();
        if (currentUser.emailVerified) {
          router.replace('/(tabs)');
        } else {
          setError('Email not verified yet. Please check your inbox.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check verification status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <Ionicons name="mail-outline" size={60} color="#007AFF" />
        <Text style={styles.headerText}>Verify Your Email</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.messageText}>
          We've sent a verification email to:
        </Text>
        <Text style={styles.emailText}>{currentUser?.email}</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {message ? <Text style={styles.successText}>{message}</Text> : null}

        <TouchableOpacity 
          style={styles.button}
          onPress={handleRefreshStatus}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>I've Verified My Email</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={handleResendEmail}
          disabled={loading}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Resend Verification Email
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => {
            auth().signOut();
            router.replace('/auth/login');
          }}
        >
          <Text style={styles.linkText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 
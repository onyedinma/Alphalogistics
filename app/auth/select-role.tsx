import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authStyles as styles } from '../../styles/auth';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export default function SelectRole() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleSelect = async (selectedRole: string) => {
    if (selectedRole === 'customer') {
      router.push({
        pathname: '/auth/register',
        params: { role: 'customer' }
      });
    } else if (selectedRole === 'staff') {
      router.push('/auth/select-staff-role');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <Ionicons name="cube-outline" size={60} color="#007AFF" />
        <Text style={styles.headerText}>Join Alpha Logistics</Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.headerText, { fontSize: 18, marginBottom: 20 }]}>
          I want to use Alpha Logistics as a:
        </Text>

        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => handleRoleSelect('customer')}
        >
          <Ionicons name="person-outline" size={24} color="#666" />
          <Text style={styles.roleButtonText}>Customer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => handleRoleSelect('staff')}
        >
          <Ionicons name="briefcase-outline" size={24} color="#666" />
          <Text style={styles.roleButtonText}>Staff Member</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
} 
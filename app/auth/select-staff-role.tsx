import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authStyles as styles } from '../../styles/auth';

export default function SelectStaffRole() {
  const handleRoleSelect = (role: string) => {
    router.push({
      pathname: '/auth/register',
      params: { role }
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <Ionicons name="cube-outline" size={60} color="#007AFF" />
        <Text style={styles.headerText}>Select Staff Role</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.subtitleText}>
          I want to join as:
        </Text>

        <TouchableOpacity
          style={[styles.roleButton, { flexDirection: 'column', alignItems: 'flex-start', padding: 20 }]}
          onPress={() => handleRoleSelect('staff')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="briefcase-outline" size={24} color="#666" />
            <Text style={[styles.roleButtonText, { fontWeight: '600' }]}>Staff</Text>
          </View>
          <Text style={[styles.roleDescription, { marginLeft: 0 }]}>Manage orders and users</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleButton, { flexDirection: 'column', alignItems: 'flex-start', padding: 20 }]}
          onPress={() => handleRoleSelect('delivery')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="bicycle-outline" size={24} color="#666" />
            <Text style={[styles.roleButtonText, { fontWeight: '600' }]}>Delivery Personnel</Text>
          </View>
          <Text style={[styles.roleDescription, { marginLeft: 0 }]}>Handle deliveries and routes</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={{ marginTop: 20 }}
        onPress={() => router.back()}
      >
        <Text style={[styles.footerText, { textAlign: 'center' }]}>
          <Ionicons name="arrow-back" size={16} /> Back to previous screen
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
} 
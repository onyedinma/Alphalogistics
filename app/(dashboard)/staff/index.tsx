import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';

export default function StaffDashboard() {
  const user = auth().currentUser;
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await auth().signOut();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Staff Dashboard',
          headerRight: () => (
            <TouchableOpacity onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back, {user?.displayName || 'Staff Member'}!</Text>
      </View>

      <View style={styles.actionCards}>
        <TouchableOpacity style={styles.card}>
          <Ionicons name="people-outline" size={32} color="#007AFF" />
          <Text style={styles.cardTitle}>Manage Users</Text>
          <Text style={styles.cardDescription}>View and manage user accounts</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Ionicons name="cube-outline" size={32} color="#007AFF" />
          <Text style={styles.cardTitle}>Orders Overview</Text>
          <Text style={styles.cardDescription}>Monitor all delivery orders</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Ionicons name="bicycle-outline" size={32} color="#007AFF" />
          <Text style={styles.cardTitle}>Delivery Personnel</Text>
          <Text style={styles.cardDescription}>Manage delivery staff</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Ionicons name="analytics-outline" size={32} color="#007AFF" />
          <Text style={styles.cardTitle}>Analytics</Text>
          <Text style={styles.cardDescription}>View system analytics and reports</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
    borderRadius: 10,
    marginHorizontal: 15,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  actionCards: {
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
});

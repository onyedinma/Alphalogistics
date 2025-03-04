import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';


interface ProfileSection {
  id: string;
  title: string;
  icon: string;
  onPress: () => void;
  showChevron?: boolean;
  destructive?: boolean;
  subtitle?: string;
}

export default function Profile() {
  const [loading, setLoading] = useState(false);
  const user = auth().currentUser;

  const handleSignOut = async () => {
    try {
      await auth().signOut();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const user = auth().currentUser;
              if (!user) return;

              // Delete user data from Firestore
              await firestore().collection('users').doc(user.uid).delete();
              
              // Delete user account
              await user.delete();
              
              router.replace('/auth/login');
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const sections: ProfileSection[][] = [
    [
      {
        id: 'personal',
        title: 'Personal Information',
        icon: 'person-outline',
        onPress: () => router.push('./profile/personal'),
        showChevron: true,
      },
      {
        id: 'notifications',
        title: 'Notifications',
        icon: 'notifications-outline',
        onPress: () => router.push('./profile/notifications'),
        showChevron: true,
      },
      {
        id: 'addresses',
        title: 'Saved Addresses',
        icon: 'location-outline',
        onPress: () => router.push('./profile/addresses'),
        showChevron: true,
      }
    ],
    [
      {
        id: 'help',
        title: 'Help & Support',
        icon: 'help-circle-outline',
        onPress: () => router.push('./profile/support'),
        showChevron: true,
      },
      {
        id: 'privacy',
        title: 'Privacy Policy',
        icon: 'shield-outline',
        onPress: () => router.push('./profile/privacy'),
        showChevron: true,
      },
      {
        id: 'terms',
        title: 'Terms of Service',
        icon: 'document-text-outline',
        onPress: () => router.push('./profile/terms'),
        showChevron: true,
      }
    ],
    [
      {
        id: 'signout',
        title: 'Sign Out',
        icon: 'log-out-outline',
        onPress: handleSignOut,
      },
      {
        id: 'delete',
        title: 'Delete Account',
        icon: 'trash-outline',
        onPress: handleDeleteAccount,
        destructive: true,
      }
    ]
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Stack.Screen 
        options={{
          title: 'Profile',
          headerTransparent: true,
          headerStyle: {
            backgroundColor: '#ffffff',
            elevation: 0,
            shadowOpacity: 0
          },
          headerBlurEffect: 'light',
          backgroundColor: 'rgba(255,255,255,0.8)',
          headerShadowVisible: false,
        }}
      />

      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <ThemedText style={styles.avatarText}>
              {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
            </ThemedText>
          </View>
          <TouchableOpacity style={styles.editAvatarButton}>
            <Ionicons name="camera" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <ThemedText style={styles.name}>
          {user?.displayName || 'User'}
        </ThemedText>
        <ThemedText style={styles.email}>{user?.email}</ThemedText>
      </View>

      {sections.map((section, index) => (
        <View key={index} style={styles.section}>
          {section.map((item, itemIndex) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                itemIndex === section.length - 1 && styles.lastMenuItem
              ]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={[
                  styles.iconContainer,
                  item.destructive && styles.destructiveIcon
                ]}>
                  <Ionicons 
                    name={item.icon as any} 
                    size={20} 
                    color={item.destructive ? '#FF3B30' : '#007AFF'} 
                  />
                </View>
                <View>
                  <ThemedText style={[
                    styles.menuItemText,
                    item.destructive && styles.destructiveText
                  ]}>
                    {item.title}
                  </ThemedText>
                  {item.subtitle && (
                    <ThemedText style={styles.menuItemSubtitle}>
                      {item.subtitle}
                    </ThemedText>
                  )}
                </View>
              </View>
              {item.showChevron && (
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <ThemedText style={styles.version}>Version 1.0.0</ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    padding: 16,
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  editAvatarButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '600',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 2,
    color: '#1A1A1A',
  },
  email: {
    fontSize: 16,
    color: '#555',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    marginTop: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  destructiveText: {
    color: '#FF3B30',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E3F2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  destructiveIcon: {
    backgroundColor: '#FFE5E5',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },
  version: {
    textAlign: 'center',
    color: '#555',
    fontSize: 13,
    marginTop: 20,
  },
});

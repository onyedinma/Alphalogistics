import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
  '05:00 PM'
];

export default function PickupDate() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExistingDate();
  }, []);

  const loadExistingDate = async () => {
    try {
      const orderDetailsString = await AsyncStorage.getItem('orderDetails');
      if (orderDetailsString) {
        const orderDetails = JSON.parse(orderDetailsString);
        if (orderDetails.pickupDate) {
          const date = new Date(orderDetails.pickupDate);
          setSelectedDate(date);
          // Convert the time to a slot format
          const hours = date.getHours();
          const minutes = date.getMinutes();
          const period = hours >= 12 ? 'PM' : 'AM';
          const hour12 = hours % 12 || 12;
          const timeString = `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
          setSelectedTimeSlot(timeString);
        }
      }
    } catch (error) {
      console.error('Error loading existing date:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
  };

  const handleProceed = async () => {
    if (!selectedTimeSlot) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }

    try {
      // Convert selected date and time slot to a Date object
      const [hours, minutes] = selectedTimeSlot.split(':');
      const isPM = selectedTimeSlot.includes('PM');
      const scheduledDate = new Date(selectedDate);
      scheduledDate.setHours(
        (parseInt(hours) + (isPM && hours !== '12' ? 12 : 0)) % 24,
        parseInt(minutes),
        0,
        0
      );

      // Load existing order details
      const orderDetailsString = await AsyncStorage.getItem('orderDetails');
      if (!orderDetailsString) {
        Alert.alert('Error', 'Please complete previous steps first');
        return;
      }

      // Update order details with new pickup date
      const orderDetails = JSON.parse(orderDetailsString);
      orderDetails.pickupDate = scheduledDate.toISOString();
      await AsyncStorage.setItem('orderDetails', JSON.stringify(orderDetails));

      // Also save as scheduledPickup for backward compatibility
      await AsyncStorage.setItem('scheduledPickup', scheduledDate.toISOString());

      router.push('/customer/checkout');
    } catch (error) {
      console.error('Error saving pickup date:', error);
      Alert.alert('Error', 'Failed to save pickup date');
    }
  };

  // Disable dates before today
  const minDate = new Date();
  // Allow scheduling up to 7 days in advance
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 7);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Select Pickup Date & Time',
            headerShadowVisible: false,
          }}
        />
        <View style={styles.loadingContainer}>
          <ThemedText>Loading...</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Select Pickup Date & Time',
          headerShadowVisible: false,
        }}
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Select Date</ThemedText>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <ThemedText>{selectedDate.toLocaleDateString()}</ThemedText>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={minDate}
              maximumDate={maxDate}
            />
          )}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Select Time Slot</ThemedText>
          <View style={styles.timeSlotGrid}>
            {TIME_SLOTS.map((timeSlot) => (
              <TouchableOpacity
                key={timeSlot}
                style={[
                  styles.timeSlot,
                  selectedTimeSlot === timeSlot && styles.selectedTimeSlot,
                ]}
                onPress={() => handleTimeSlotSelect(timeSlot)}
              >
                <ThemedText
                  style={[
                    styles.timeSlotText,
                    selectedTimeSlot === timeSlot && styles.selectedTimeSlotText,
                  ]}
                >
                  {timeSlot}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.proceedButton}
          onPress={handleProceed}
        >
          <ThemedText style={styles.proceedButtonText}>Proceed</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dateButton: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    width: '31%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedTimeSlot: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  timeSlotText: {
    fontSize: 14,
  },
  selectedTimeSlotText: {
    color: '#fff',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  proceedButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';

type OrderStatus = 'pending' | 'pickup' | 'transit' | 'delivered' | 'cancelled';

interface OrderTrackerProps {
  status: OrderStatus;
  estimatedDelivery?: string;
  currentLocation?: string;
}

const STATUS_CONFIG = {
  pending: {
    icon: 'time-outline',
    color: '#FF9800',
    label: 'Order Pending',
  },
  pickup: {
    icon: 'archive-outline',
    color: '#2196F3',
    label: 'Pickup in Progress',
  },
  transit: {
    icon: 'bicycle-outline',
    color: '#4CAF50',
    label: 'In Transit',
  },
  delivered: {
    icon: 'checkmark-circle-outline',
    color: '#4CAF50',
    label: 'Delivered',
  },
  cancelled: {
    icon: 'close-circle-outline',
    color: '#F44336',
    label: 'Cancelled',
  },
};

export function OrderTracker({ status, estimatedDelivery, currentLocation }: OrderTrackerProps) {
  const config = STATUS_CONFIG[status];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          <Ionicons name={config.icon as any} size={24} color={config.color} />
          <ThemedText style={[styles.statusText, { color: config.color }]}>
            {config.label}
          </ThemedText>
        </View>
        {estimatedDelivery && (
          <ThemedText style={styles.estimatedTime}>
            Est. Delivery: {estimatedDelivery}
          </ThemedText>
        )}
      </View>

      <View style={styles.progressContainer}>
        {Object.keys(STATUS_CONFIG).map((step, index) => {
          const isCompleted = Object.keys(STATUS_CONFIG).indexOf(status) >= index;
          const isActive = status === step;

          return (
            <React.Fragment key={step}>
              <View style={styles.stepContainer}>
                <View
                  style={[
                    styles.dot,
                    isCompleted && styles.completedDot,
                    isActive && styles.activeDot,
                  ]}
                />
                <ThemedText
                  style={[
                    styles.stepLabel,
                    isCompleted && styles.completedLabel,
                    isActive && styles.activeLabel,
                  ]}
                >
                  {STATUS_CONFIG[step as OrderStatus].label}
                </ThemedText>
              </View>
              {index < Object.keys(STATUS_CONFIG).length - 1 && (
                <View
                  style={[
                    styles.line,
                    isCompleted && styles.completedLine,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {currentLocation && (
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={20} color="#666" />
          <ThemedText style={styles.locationText}>{currentLocation}</ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  estimatedTime: {
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
    marginBottom: 8,
  },
  completedDot: {
    backgroundColor: '#4CAF50',
  },
  activeDot: {
    backgroundColor: '#2196F3',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: '#E0E0E0',
    position: 'absolute',
    top: 6,
    left: '50%',
    right: '50%',
    zIndex: -1,
  },
  completedLine: {
    backgroundColor: '#4CAF50',
  },
  stepLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  completedLabel: {
    color: '#4CAF50',
  },
  activeLabel: {
    color: '#2196F3',
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
}); 
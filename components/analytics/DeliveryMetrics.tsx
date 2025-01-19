import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { DeliveryMetrics as Metrics } from '@/types';
import { formatDuration } from '@/utils/date';

interface DeliveryMetricsProps {
  metrics: Metrics;
}

export function DeliveryMetrics({ metrics }: DeliveryMetricsProps) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Delivery Performance</ThemedText>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricIcon}>
            <Ionicons name="cube" size={24} color="#2196F3" />
          </View>
          <ThemedText style={styles.metricValue}>
            {metrics.totalDeliveries}
          </ThemedText>
          <ThemedText style={styles.metricLabel}>Total Deliveries</ThemedText>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.metricIcon, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          </View>
          <ThemedText style={styles.metricValue}>
            {(metrics.successRate * 100).toFixed(1)}%
          </ThemedText>
          <ThemedText style={styles.metricLabel}>Success Rate</ThemedText>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.metricIcon, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="time" size={24} color="#FF9800" />
          </View>
          <ThemedText style={styles.metricValue}>
            {formatDuration(metrics.averageDeliveryTime)}
          </ThemedText>
          <ThemedText style={styles.metricLabel}>Avg. Delivery Time</ThemedText>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.metricIcon, { backgroundColor: '#F3E5F5' }]}>
            <Ionicons name="star" size={24} color="#9C27B0" />
          </View>
          <ThemedText style={styles.metricValue}>
            {metrics.customerRating.toFixed(1)}
          </ThemedText>
          <ThemedText style={styles.metricLabel}>Customer Rating</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
}); 
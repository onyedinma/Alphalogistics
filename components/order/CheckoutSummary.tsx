import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

interface CheckoutSummaryProps {
  subtotal: number;
  discount: number;
  pickupCharge: number;
  insurance: string;
  total: number;
  walletBalance: number;
  onFundWallet: () => void;
  onSaveForLater: () => void;
  onCreateShipment: () => void;
}

export function CheckoutSummary({
  subtotal,
  discount,
  pickupCharge,
  insurance,
  total,
  walletBalance,
  onFundWallet,
  onSaveForLater,
  onCreateShipment
}: CheckoutSummaryProps) {
  return (
    <View style={styles.container}>
      <View style={styles.summarySection}>
        <ThemedText style={styles.sectionTitle}>Payment Summary</ThemedText>
        
        <View style={styles.row}>
          <ThemedText>Shipping cost</ThemedText>
          <ThemedText>₦{subtotal.toLocaleString()}</ThemedText>
        </View>
        
        {/* Add other summary rows */}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.fundWalletButton} onPress={onFundWallet}>
          <ThemedText style={styles.buttonText}>Fund Wallet</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={onSaveForLater}>
          <ThemedText style={styles.saveButtonText}>Save for later</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.createButton} onPress={onCreateShipment}>
          <ThemedText style={styles.buttonText}>Create Shipment</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  summarySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionButtons: {
    gap: 12,
  },
  fundWalletButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
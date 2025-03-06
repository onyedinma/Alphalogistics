# Order Flow Implementation Guide

## Data Flow

### Storage Service Pattern
```typescript
export class StorageService {
  static validateOrderStorage(data: any): data is OrderDraft {
    // Type validation implementation
  }

  static async saveOrderDraft(data: Partial<OrderDraft>): Promise<void> {
    // Save with validation
  }

  static async getOrderDraft(): Promise<OrderDraft | null> {
    // Retrieve with validation
  }
}
```

### Screen Flow
1. Item Details
   - Add/edit items
   - Calculate totals
   - Save to draft

2. Delivery Details
   - Load draft
   - Add delivery info
   - Update pricing

3. Checkout
   - Validate complete draft
   - Process order
   - Clear draft

## Implementation Guidelines

### 1. Item Details Screen
```typescript
const handleAddItem = async () => {
  // Validate and save item
  const draft = await StorageService.getOrderDraft();
  const updatedDraft = {
    ...draft,
    items: [...draft.items, newItem],
    pricing: calculatePricing(items)
  };
  await StorageService.saveOrderDraft(updatedDraft);
};
```

### 2. Delivery Details Screen
```typescript
const handleSubmit = async () => {
  // Update draft with delivery info
  const draft = await StorageService.getOrderDraft();
  const updatedDraft = {
    ...draft,
    sender: senderDetails,
    receiver: receiverDetails,
    delivery: {
      scheduledPickup: selectedDate.toISOString(),
      vehicle: selectedVehicle,
      fee: calculateDeliveryFee(totalWeight)
    }
  };
  await StorageService.saveOrderDraft(updatedDraft);
};
```

### 3. Checkout Screen
```typescript
const handleCheckout = async () => {
  const draft = await StorageService.getOrderDraft();
  if (!validateCompleteDraft(draft)) {
    return Alert.alert('Error', 'Missing required information');
  }
  await OrderService.createOrder(draft);
  await StorageService.clearOrderData();
};
```

## Testing Points

### Draft Persistence
- Verify item details saved
- Check delivery info updates
- Confirm pricing calculations

### Navigation State
- Test back navigation
- Verify data preservation
- Check edit scenarios

### Error Handling
- Invalid data submission
- Network errors
- Missing required fields

## Best Practices
1. Use StorageService consistently
2. Validate before saving
3. Handle all errors
4. Maintain type safety
5. Clear data appropriately
# Order Flow Data Persistence Guide

## Current Issue
When navigating from Pickup Details (new-order.tsx) to Item Details screen, the previously entered information (sender, receiver, pickup date, vehicle) is lost when trying to proceed to checkout.

## Data Flow Analysis

### 1. Current Flow (With Issue)
```
Pickup Details Screen
↓ (Data not properly persisted)
Item Details Screen
↓ (Cannot find pickup details)
Checkout Screen (Error: Missing Information)
```

### 2. Expected Flow
```
Pickup Details Screen
↓ (Save to AsyncStorage)
Item Details Screen (Load from AsyncStorage)
↓ (Combine with item details)
Checkout Screen (Complete order data)
```

## Solution Implementation

### 1. Pickup Details Screen (new-order.tsx)
```typescript
// Before navigating to item details
const handleProceed = async () => {
  if (!selectedVehicle || !pickupDate || !senderDetails || !receiverDetails) {
    Alert.alert('Error', 'Please fill in all required fields');
    return;
  }

  try {
    // Save complete order draft
    const orderDraft = {
      sender: senderDetails,
      receiver: receiverDetails,
      delivery: {
        scheduledPickup: pickupDate,
        vehicle: selectedVehicle
      }
    };
    
    await AsyncStorage.setItem('orderDraft', JSON.stringify(orderDraft));
    router.push('/(dashboard)/customer/item-details');
  } catch (error) {
    console.error('Error saving order draft:', error);
    Alert.alert('Error', 'Failed to save order details');
  }
};
```

### 2. Item Details Screen (item-details.tsx)
```typescript
// When proceeding to checkout
const handleProceedToCheckout = async () => {
  if (itemList.items.length === 0) {
    Alert.alert('Error', 'Please add at least one item');
    return;
  }

  setIsLoading(true);
  try {
    // Get order draft from AsyncStorage
    const orderDraftStr = await AsyncStorage.getItem('orderDraft');
    if (!orderDraftStr) {
      Alert.alert('Error', 'Order details not found');
      return;
    }

    const orderDraft = JSON.parse(orderDraftStr);
    
    // Validate required information
    if (!orderDraft.sender || !orderDraft.receiver || 
        !orderDraft.delivery?.scheduledPickup || !orderDraft.delivery?.vehicle) {
      Alert.alert(
        'Missing Information',
        'Please complete the order details first (sender, receiver, pickup date, and vehicle selection).'
      );
      return;
    }

    // Add items to order draft
    orderDraft.items = itemList.items;
    orderDraft.pricing = {
      itemValue: itemList.totalValue,
      deliveryFee: calculateDeliveryFee(itemList.totalWeight),
      total: itemList.totalValue + calculateDeliveryFee(itemList.totalWeight)
    };

    // Save updated order draft
    await AsyncStorage.setItem('orderDraft', JSON.stringify(orderDraft));
    router.push('/customer/checkout');
  } catch (error) {
    console.error('Error preparing checkout:', error);
    Alert.alert('Error', 'Failed to prepare checkout. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

## Implementation Steps

1. **Modify Pickup Details Screen**
   - Save complete order draft to AsyncStorage before navigation
   - Include all necessary fields (sender, receiver, pickup date, vehicle)
   - Handle errors appropriately

2. **Update Item Details Screen**
   - Load order draft when component mounts
   - Validate presence of required information
   - Combine item details with existing order draft
   - Save complete order data before checkout

3. **Testing Points**
   - Verify order draft is saved correctly from pickup details
   - Confirm data persistence between screen navigations
   - Check error handling for missing information
   - Validate complete order data at checkout

## Best Practices

1. **Data Persistence**
   - Use a single source of truth (orderDraft in AsyncStorage)
   - Save data incrementally as it's entered
   - Validate data completeness before proceeding

2. **Error Handling**
   - Check for missing data at each step
   - Provide clear error messages to users
   - Prevent navigation if required data is missing

3. **State Management**
   - Keep AsyncStorage and UI state in sync
   - Update storage when form data changes
   - Load saved data when screens mount

## Common Issues and Solutions

1. **Missing Data**
   ```typescript
   // Always check for required fields
   if (!orderDraft.sender || !orderDraft.receiver) {
     Alert.alert('Error', 'Missing sender or receiver details');
     return;
   }
   ```

2. **Data Type Safety**
   ```typescript
   interface OrderDraft {
     sender?: {
       name: string;
       address: string;
       phone: string;
     };
     receiver?: {
       name: string;
       address: string;
       phone: string;
     };
     delivery?: {
       scheduledPickup: Date;
       vehicle: string;
     };
     items?: ItemDetails[];
     pricing?: {
       itemValue: number;
       deliveryFee: number;
       total: number;
     };
   }
   ```

3. **Navigation Safety**
   ```typescript
   // Before navigation, ensure data is saved
   await AsyncStorage.setItem('orderDraft', JSON.stringify(orderDraft));
   router.push('/next-screen');
   ```

## Testing Checklist

1. **Pickup Details**
   - [ ] All fields filled correctly
   - [ ] Data saved to AsyncStorage
   - [ ] Navigation to item details successful

2. **Item Details**
   - [ ] Previous data loaded correctly
   - [ ] Items added successfully
   - [ ] Combined data saved before checkout

3. **Checkout**
   - [ ] Complete order data available
   - [ ] Pricing calculated correctly
   - [ ] Order submission successful 
# Receiver Details Flow and Data Persistence

## Current Flow Issues
1. Data loss when navigating between screens in the receiver flow
2. Incomplete persistence of receiver details in AsyncStorage
3. Inconsistent state management between screens

## Solution Architecture

### 1. AsyncStorage Structure
```typescript
interface OrderDraft {
  receiver?: {
    name: string;
    address: string;
    phone: string;
    deliveryMethod: 'pickup' | 'delivery';
  };
  // Other order details...
}
```

### 2. Key Points for Implementation

#### A. Receiver Details Screen
- Save partial data immediately when any field is updated
- Maintain state using AsyncStorage between navigation steps
```typescript
// Save partial data
const savePartialData = async (fieldName: string, value: string) => {
  try {
    const orderDraft = await AsyncStorage.getItem('orderDraft');
    const parsedDraft = orderDraft ? JSON.parse(orderDraft) : {};
    
    parsedDraft.receiver = {
      ...parsedDraft.receiver,
      [fieldName]: value
    };
    
    await AsyncStorage.setItem('orderDraft', JSON.stringify(parsedDraft));
  } catch (error) {
    console.error('Error saving partial data:', error);
  }
};
```

#### B. Address Search Integration
- Pass existing receiver data to address search screen
- Preserve other fields when returning from address search
```typescript
// When navigating to address search
router.push({
  pathname: '/address-search',
  params: {
    returnScreen: 'receiver',
    currentData: JSON.stringify(receiverData)
  }
});
```

#### C. New Order Screen (Pickup Details)
- Load complete receiver data on mount and after navigation
- Update UI when receiver details change
```typescript
useEffect(() => {
  const loadReceiverData = async () => {
    try {
      const orderDraft = await AsyncStorage.getItem('orderDraft');
      if (orderDraft) {
        const { receiver } = JSON.parse(orderDraft);
        if (receiver) {
          setReceiverDetails(receiver);
        }
      }
    } catch (error) {
      console.error('Error loading receiver data:', error);
    }
  };
  
  loadReceiverData();
}, []);
```

### 3. Implementation Steps

1. **Modify Receiver Details Screen**
   - Add AsyncStorage persistence for each field update
   - Implement state restoration on component mount
   - Handle navigation with data preservation

2. **Update Address Search Integration**
   - Pass current receiver data as params
   - Handle return navigation with data preservation
   - Update AsyncStorage with new address while keeping other fields

3. **Enhance New Order Screen**
   - Implement proper data loading from AsyncStorage
   - Add state updates for receiver details changes
   - Handle navigation with complete data

### 4. Testing Points

1. **Data Persistence**
   - Enter receiver name
   - Navigate to address search
   - Verify name is preserved after returning
   - Complete other fields
   - Verify all data shows in Pickup Details

2. **Navigation**
   - Test all navigation paths preserve data
   - Verify data consistency between screens
   - Check error handling for missing data

3. **Edge Cases**
   - Test partial data saves
   - Verify behavior with missing fields
   - Check error state handling

## Implementation Guidelines

1. Use a single source of truth (AsyncStorage)
2. Save data incrementally as it's entered
3. Restore state completely on screen mount
4. Handle all error cases gracefully
5. Maintain consistent data structure

## Error Handling

```typescript
const handleError = (error: any, context: string) => {
  console.error(`Error in ${context}:`, error);
  Alert.alert(
    'Error',
    'There was an error saving your data. Please try again.'
  );
};
```

## Best Practices

1. Always validate data before saving
2. Use TypeScript interfaces for type safety
3. Implement proper error handling
4. Add loading states during async operations
5. Keep AsyncStorage operations consistent 